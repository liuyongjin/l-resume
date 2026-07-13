"""
多智能体系统核心模块
- Agent 基类及各专业 Agent
- QPS 限流器
- 智谱清言 API 客户端
- 多智能体编排器（支持并行子Agent）
"""

import os
import sys
import json
import logging
import re
import time
import asyncio
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)


def extract_requested_resume_title_from_prompt(prompt: str) -> Optional[str]:
    """从工作流节点 systemPrompt / 描述中解析「修改简历名称/文档名称」类指令的目标标题。"""
    if not isinstance(prompt, str) or not prompt.strip():
        return None
    text = prompt.strip()

    # 兼容中文弯引号 U+201C/U+201D、直角引号、ASCII 引号
    rename = re.search(
        r'(?:修改|改|设置|设为)[为成]?\s*'
        r'[\u201c"\u300c「\'`‘]'
        r'([^\u201d"\u300d」\'`’\n]+)'
        r'[\u201d"\u300d」\'`’]',
        text,
    )
    if rename:
        title = rename.group(1).strip()
        if title:
            return title

    if not any(k in text for k in ("简历名称", "文档名称", "简历标题", "文件名")):
        return None

    patterns = [
        r'简历(?:名称|标题|文档名称)[\s\S]*?(?:修改|改|设置|设为)[\s\S]*?'
        r'[\u201c"\u300c「\'`‘]([^\u201d"\u300d」\'`’\n]+)[\u201d"\u300d」\'`’]',
        r'(?:名称|标题)[\s\S]*?(?:修改|改|设置|设为)[\s\S]*?'
        r'[\u201c"\u300c「\'`‘]([^\u201d"\u300d」\'`’\n]+)[\u201d"\u300d」\'`’]',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            title = match.group(1).strip()
            if title:
                return title
    return None


def log_agent_io(
    agent_type: str,
    phase: str,
    input_summary: Optional[Dict[str, Any]] = None,
    output_summary: Optional[Dict[str, Any]] = None,
) -> None:
    """记录智能体输入/输出摘要，便于排查执行链路"""
    if input_summary is not None:
        logger.info(
            "[Agent输入] %s | %s | %s",
            agent_type,
            phase,
            json.dumps(input_summary, ensure_ascii=False)[:2000],
        )
    if output_summary is not None:
        logger.info(
            "[Agent输出] %s | %s | %s",
            agent_type,
            phase,
            json.dumps(output_summary, ensure_ascii=False)[:2000],
        )

# 导入配置
from config import ai_config, AIConfig, LLM_API_KEY_ENV
# 导入知识库
from knowledge import knowledge_base

# ==================== 枚举与数据结构 ====================

class AgentType(Enum):
    PLANNER = "planner"
    WRITER = "writer"
    REVIEWER = "reviewer"
    OPTIMIZER = "optimizer"
    ANALYZER = "analyzer"


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class AgentMessage:
    agent_type: str
    content: str
    timestamp: str
    metadata: Dict[str, Any]


@dataclass
class AgentTask:
    task_id: str
    task_type: str
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    agents: List[AgentMessage] = None
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if self.agents is None:
            self.agents = []
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()


# ==================== QPS 限流器 ====================

class QPSLimiter:
    """QPS 限流器 - 令牌桶算法，锁外等待避免阻塞"""

    def __init__(self, qps: int = 1):
        self.qps = qps
        self.timestamps: List[float] = []
        self.lock = threading.Lock()
        self.last_cleanup = time.time()

    def _cleanup_old(self, now: float) -> None:
        self.timestamps = [ts for ts in self.timestamps if now - ts < 1.0]

    def acquire(self) -> float:
        wait_time = 0
        with self.lock:
            now = time.time()
            if now - self.last_cleanup > 0.1:
                self._cleanup_old(now)
                self.last_cleanup = now

            if len(self.timestamps) >= self.qps:
                oldest = self.timestamps[0] if self.timestamps else now
                wait_time = 1.0 - (now - oldest)
                if wait_time <= 0:
                    self._cleanup_old(now)
            else:
                self.timestamps.append(now)
                return 0

        if wait_time > 0:
            time.sleep(wait_time)
            with self.lock:
                self._cleanup_old(time.time())
                self.timestamps.append(time.time())
        return wait_time


# ==================== AI 客户端 ====================

def resolve_zhipu_api_key(explicit_key: str = None, config: Dict[str, Any] = None) -> str:
    """优先使用显式传入 / orchestrator config / 当前 .env 中的 API Key"""
    config = config or {}
    for candidate in (
        explicit_key,
        config.get("ZHIPU_API_KEY"),
        config.get("zhipu_api_key"),
        ai_config.ZHIPU_API_KEY,
    ):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


class ZhipuAIClient:
    """智谱清言 API 客户端"""

    def __init__(self, api_key: str = None, model: str = None,
                 api_url: str = None, qps_limit: int = None,
                 config: Dict[str, Any] = None):
        self.config = config or {}
        self._api_key_override = api_key.strip() if isinstance(api_key, str) and api_key.strip() else None
        self.model = ai_config.normalize_resume_model(model or ai_config.ZHIPU_MODEL)
        self.api_url = api_url or ai_config.ZHIPU_API_URL
        self.temperature = ai_config.API_TEMPERATURE
        self.max_tokens = ai_config.API_MAX_TOKENS
        self.timeout = ai_config.API_TIMEOUT
        self.qps_limiter = QPSLimiter(qps_limit or ai_config.AI_QPS_LIMIT)
        logger.info(f"ZhipuAIClient 初始化 - Model: {self.model}, QPS: {self.qps_limiter.qps}")

    def _current_api_key(self) -> str:
        return resolve_zhipu_api_key(self._api_key_override, self.config)

    def chat(self, messages: List[Dict[str, str]], temperature: float = None,
             max_tokens: int = None, model: str = None) -> str:
        wait_time = self.qps_limiter.acquire()
        if wait_time > 0:
            logger.info(f"QPS 限流等待: {wait_time:.2f}s")

        import urllib.request
        import urllib.error

        api_key = self._current_api_key()
        if not api_key:
            raise Exception("智谱清言 API Key 未配置，请在 backend-agent-python/.env 中设置 ZHIPU_API_KEY")

        resolved_model = ai_config.normalize_resume_model(model or self.model)
        payload = {
            "model": resolved_model,
            "messages": messages,
            "temperature": temperature if temperature is not None else self.temperature,
            "max_tokens": max_tokens if max_tokens is not None else self.max_tokens,
        }

        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            self.api_url, data=data,
            headers={'Content-Type': 'application/json',
                     'Authorization': f'Bearer {api_key}'},
            method='POST'
        )

        try:
            if ai_config.LOG_API_CALLS:
                logger.info(f"API 调用 - Model: {resolved_model}, Msgs: {len(messages)}")

            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                content = result.get('choices', [{}])[0].get('message', {}).get('content', '')

            if ai_config.LOG_API_CALLS:
                logger.info(f"API 返回 - Length: {len(content)}")
            return content

        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            logger.error(f"API HTTP {e.code}: {error_body}")
            raise Exception(f"API HTTP Error {e.code}: {error_body}")
        except Exception as e:
            logger.error(f"API Error: {e}")
            raise Exception(f"API Error: {str(e)}")


# ==================== 工具函数 ====================

def safe_json_parse(text: str, default: Dict = None) -> Dict:
    """安全解析 JSON，尝试多种策略"""
    if default is None:
        default = {}
    if not text:
        return default
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 尝试提取 { ... } 块
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return default


# ==================== Agent 基类 ====================

class BaseAgent:
    """Agent 基类"""

    def __init__(self, agent_type: AgentType, config: Dict[str, Any] = None):
        self.agent_type = agent_type
        self.config = config or {}
        api_key = resolve_zhipu_api_key(config=self.config)
        if not api_key:
            raise RuntimeError(
                f"Agent {agent_type.value}: 未配置 API Key，"
                f"请在 backend-agent-python/.env 中设置 {LLM_API_KEY_ENV}"
            )
        self.zhipu_client = ZhipuAIClient(config=self.config)
        logger.info(f"Agent {agent_type.value} 已启用真实 API")

    def call_ai(self, system_prompt: str, user_prompt: str,
                temperature: float = None, max_tokens: int = None) -> str:
        """调用智谱清言 API"""
        if not self.zhipu_client:
            self.zhipu_client = ZhipuAIClient(config=self.config)
        model = self.config.get("model")
        return self.zhipu_client.chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], temperature=temperature, max_tokens=max_tokens, model=model)

    def get_ai_params(self, default_temperature: float = 0.4) -> Dict[str, Any]:
        """读取 apply_agent_configs 写入的运行参数"""
        max_tokens = self.config.get("max_tokens") or self.config.get("maxTokens")
        return {
            "temperature": self.config.get("temperature", default_temperature),
            "max_tokens": max_tokens or 4096,
            "model": ai_config.normalize_resume_model(self.config.get("model")),
        }

    def resolve_system_prompt(self, default_prompt: str) -> str:
        """优先使用工作流设计器注入的 systemPrompt"""
        if getattr(self, "_custom_prompt_applied", False) and getattr(self, "system_prompt", ""):
            return self.system_prompt
        return default_prompt

    @staticmethod
    def writer_json_output_schema() -> str:
        """工作流节点执行时的 JSON 输出约束（含简历文档名称字段）"""
        return """

## 输出格式（严格 JSON，勿输出其它文字）
{
  "versions": [
    {
      "version_id": 1,
      "resumeTitle": "简历文档名称（若任务要求修改名称则填于此，否则可省略）",
      "resumeStyle": { "theme": "#2563eb", "fontSize": 14, "lineHeight": 1.5, "fontFamily": "system-ui", "margin": 28 },
      "title": "版本标题（可选）",
      "style": "专业版",
      "content": {
        "basicInfo": { "name": "", "position": "", "phone": "", "email": "", "city": "" },
        "professionalSummary": "2-4句个人总结（禁止粘贴整份简历原文）",
        "workExperience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": [] }],
        "education": [{ "school": "", "major": "", "degree": "", "startDate": "", "endDate": "" }],
        "projectExperience": [{ "name": "", "role": "", "startDate": "", "endDate": "", "description": [] }],
        "skills": [{ "category": "", "items": [] }]
      }
    }
  ]
}

注意：「简历文档名称 / resumeTitle」指简历列表中显示的文件名，与 basicInfo.name（候选人姓名）不同。
「resumeStyle」指 resumes.style 字段，可修改 theme/fontSize 等样式。
若系统提示词要求修改简历名称，必须在 versions[0].resumeTitle 写入新名称，勿写入 title 字段。"""

    @staticmethod
    def optimizer_json_output_schema() -> str:
        return """

## 输出格式（严格 JSON，勿输出其它文字）
{
  "optimized_versions": [
    {
      "version_id": 1,
      "resumeTitle": "简历文档名称（若任务要求修改名称则填于此，否则可省略）",
      "original_score": 75,
      "improved_score": 85,
      "changes_summary": ["改动说明"],
      "final_content": {
        "basicInfo": { "name": "", "position": "", "phone": "", "email": "", "city": "" },
        "professionalSummary": "2-4句个人总结（禁止粘贴整份简历原文）",
        "workExperience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": [] }],
        "education": [{ "school": "", "major": "", "degree": "", "startDate": "", "endDate": "" }],
        "projectExperience": [{ "name": "", "role": "", "startDate": "", "endDate": "", "description": [] }],
        "skills": [{ "category": "", "items": [] }]
      }
    }
  ]
}

注意：resumeTitle 是 resumes.title（列表文件名），与 basicInfo.name（候选人姓名）不同。"""

    def call_ai_json(self, system_prompt: str, user_prompt: str,
                     temperature: float = 0.3, max_tokens: int = None) -> Dict:
        """调用 AI 并解析 JSON 返回"""
        response = self.call_ai(system_prompt, user_prompt, temperature, max_tokens)
        return safe_json_parse(response, {"raw": response})

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


# ==================== 专业 Agent ====================

class PlannerAgent(BaseAgent):
    """规划智能体 - 分析输入并制定多版本生成策略"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.PLANNER, config)
        self.system_prompt = """你是一位资深职业顾问和简历规划专家。你的任务：
1. 分析候选人背景和目标职位的匹配度
2. 制定简历版本生成的策略，包括每个版本应侧重的方向
3. 给出针对性的关键词和写作建议

## 输出格式（严格JSON）
{
  "analysis": {
    "position_match": "职位匹配度评估",
    "key_strengths": ["核心优势1", "核心优势2"],
    "gaps": ["需要补充的内容"]
  },
  "plan": {
    "strategy": "整体生成策略",
    "versions": [
      {"id": 1, "focus": "版本1侧重点", "style": "风格", "target_companies": ["适合的公司类型"]}
    ]
  },
  "keywords_to_include": ["关键词1", "关键词2"],
  "writing_tips": ["写作建议1", "写作建议2"]
}"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        target_role = context.get("targetRole", context.get("target_role", ""))
        industry = context.get("industry", "互联网")
        experience = context.get("experience", "mid")
        versions = context.get("versionsCount", context.get("versions", 2))
        resume_data = context.get("resumeData", context.get("resume_data", {}))

        try:
            # 从知识库检索上下文
            rag_context = knowledge_base.retrieve_context(target_role, industry, experience)

            user_prompt = f"""{rag_context}

## 任务信息
- 目标职位: {target_role}
- 行业: {industry}
- 经验级别: {experience}
- 需要生成的版本数: {versions}

## 候选人数据
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

请分析以上信息并生成优化计划。严格按JSON格式输出。"""
            return self.call_ai_json(self.system_prompt, user_prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"PlannerAgent 错误: {e}")
            raise


class WriterAgent(BaseAgent):
    """撰写智能体 - 根据规划生成简历（支持模板适配）"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.WRITER, config)

    def _build_system_prompt(self, template_def: Dict = None) -> str:
        """根据模板定义构建系统提示词"""
        base_prompt = """你是一位资深简历写手和HR顾问，精通各类职位的简历撰写。你的任务是根据提供的候选人信息和模板要求，撰写高质量的简历内容。

## 写作原则
1. 使用STAR法则（情境-任务-行动-结果）描述工作经历
2. 每条经历包含量化成果（数字、百分比、规模）
3. 使用有力的行为动词
4. 突出与目标职位和模板定位相关的技能
5. 语言专业、简洁、有力
6. 内容必须适配目标模板的版块结构"""

        if template_def:
            template_name = template_def.get("name", "")
            emphasis = template_def.get("emphasis", "")
            sections = template_def.get("section_labels", {})
            summary_prompt = template_def.get("summary_prompt", "")
            experience_prompt = template_def.get("experience_prompt", "")
            education_prompt = template_def.get("education_prompt", "")
            skills_prompt = template_def.get("skills_prompt", "")
            projects_prompt = template_def.get("projects_prompt", "")

            base_prompt += f"""

## 目标模板: {template_name}
## 写作重点: {emphasis}

## 各板块写作要求
- 基本信息: {sections.get('basicInfo', '基本信息')}
- 个人总结: {summary_prompt}
- 工作经历: {experience_prompt}
- 教育背景: {education_prompt}
- 技能: {skills_prompt}
- 项目经验: {projects_prompt}"""

        base_prompt += """

## 输出格式（严格JSON）
{
  "versions": [
    {
      "version_id": 1,
      "title": "版本名称",
      "style": "专业版",
      "content": {
        "basicInfo": {"name": "", "title": "", "phone": "", "email": "", "location": ""},
        "summary": "个人简介（2-3句话，突出核心优势）",
        "experience": [
          {"company": "公司名", "position": "职位", "duration": "时间段",
           "description": "工作描述", "achievements": ["带量化数据的成就1", "成就2"]}
        ],
        "education": [
          {"school": "学校", "major": "专业", "degree": "学位", "duration": "时间段", "gpa": "可选"}
        ],
        "skills": ["技能1", "技能2"],
        "projects": [
          {"name": "项目名", "role": "角色", "duration": "时间段",
           "description": "描述", "achievements": ["成果1", "成果2"],
           "techStack": ["技术1", "技术2"]}
        ]
      }
    }
  ]
}"""
        return base_prompt

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        target_role = context.get("targetRole", context.get("target_role", ""))
        industry = context.get("industry", "互联网")
        experience_level = context.get("experienceLevel", context.get("experience_level", "mid"))
        versions = context.get("versionsCount", context.get("versions", 2))
        styles = context.get("styles", ["专业", "创意"])
        resume_data = context.get("resumeData", context.get("resume_data", {}))
        plan = context.get("plan", {})
        template_id = context.get("template_id", "classic")
        template_def = context.get("template_definition", {})

        try:
            custom_applied = getattr(self, "_custom_prompt_applied", False)
            node_prompt = task_input.get("prompt") or ""

            if custom_applied:
                resume_record = context.get("resumeRecord") or context.get("resume_record") or {}
                system_prompt = (self.system_prompt or "") + self.writer_json_output_schema()
                user_prompt = f"""## 当前 resumes 记录
- title（文档名称 / 列表文件名）: {resume_record.get('title') or '未设置'}
- templateId: {resume_record.get('templateId') or template_id}
- style: {json.dumps(resume_record.get('style') or {}, ensure_ascii=False)}

## 当前简历 data
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

## 上下文
- 目标职位: {target_role or '未指定'}
- 模板类型: {template_def.get('name', '通用')}
- 节点说明: {node_prompt or '按系统提示词修改简历'}

## 输出字段说明（务必遵守）
- 若系统提示词要求修改「简历名称 / 文档名称 / 简历标题」，将新名称写入 versions[0].resumeTitle（对应 resumes.title，不是 version 的 title 字段）
- 若要求修改「姓名 / 候选人姓名」，写入 content.basicInfo.name
- 文档名称与候选人姓名不可混淆

请严格按系统提示词中的指令修改上述简历，并按 JSON 格式输出完整结果。"""
            else:
                rag_context = knowledge_base.retrieve_context(target_role, industry, experience_level)
                system_prompt = self._build_system_prompt(template_def)
                user_prompt = f"""{rag_context}

## 任务信息
- 目标职位: {target_role}
- 模板类型: {template_def.get('name', '通用')}
- 模板定位: {template_def.get('target_role', target_role)}
- 需要生成 {versions} 个版本
- 风格: {', '.join(styles)}
- 经验级别: {experience_level}

## 模板写作强调
{template_def.get('emphasis', '突出核心能力和量化成果')}

## 规划建议
{json.dumps(plan, ensure_ascii=False, indent=2)}

## 候选人数据
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

请基于以上信息生成 {versions} 个简历版本。确保每个版本内容充实，工作经历至少2条，每条至少3个要点并包含量化数据。内容必须适配"{template_def.get('name', '通用')}"模板的版块结构。严格按JSON格式输出。"""

            ai_params = self.get_ai_params(default_temperature=0.7)
            logger.info(
                f"WriterAgent 执行 - model={ai_params.get('model') or '-'}, "
                f"custom_prompt={custom_applied}, "
                f"temp={ai_params['temperature']}"
            )
            return self.call_ai_json(
                system_prompt,
                user_prompt,
                temperature=ai_params["temperature"],
                max_tokens=ai_params["max_tokens"],
            )
        except Exception as e:
            logger.error(f"WriterAgent 错误: {e}")
            raise


class ReviewerAgent(BaseAgent):
    """审核智能体 - 审核简历质量"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.REVIEWER, config)
        self.system_prompt = """你是一位资深HR和简历审核专家，审核过上万份简历。你的任务是对简历进行全面评估。

## 评估维度（每项0-20分，总分100）
1. 内容完整性 - 关键板块是否齐全
2. 量化程度 - 是否有足够的数字和成果支撑
3. 语言质量 - 表达是否专业、简洁、有力
4. 职位匹配度 - 是否针对目标职位优化
5. ATS友好度 - 是否有利于通过自动筛选

## 输出格式（严格JSON）
{
  "reviews": [
    {
      "version_id": 1,
      "scores": {"completeness": 0, "quantification": 0, "language": 0, "matching": 0, "ats": 0},
      "total_score": 0,
      "strengths": ["优点1", "优点2"],
      "weaknesses": ["不足1", "不足2"],
      "suggestions": ["改进建议1", "改进建议2"],
      "ats_issues": ["ATS问题（如缺少关键词）"]
    }
  ],
  "best_version": 1,
  "overall_assessment": "综合评估总结"
}"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        versions_data = context.get("versions_data", {})
        target_role = context.get("targetRole", context.get("target_role", ""))

        try:
            user_prompt = f"""## 目标职位
{target_role}

## 待审核的简历版本
{json.dumps(versions_data, ensure_ascii=False, indent=2)}

请对每个版本进行全面评估，严格按JSON格式输出。"""
            return self.call_ai_json(self.system_prompt, user_prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"ReviewerAgent 错误: {e}")
            raise


class OptimizerAgent(BaseAgent):
    """优化智能体 - 根据审核意见优化简历"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.OPTIMIZER, config)
        self.system_prompt = """你是一位简历优化大师，擅长根据审核反馈对简历进行精细化打磨。你的任务是根据审核意见改进简历内容，使其更加完善和竞争力。

## 优化重点
1. 补充量化数据（数字、百分比、规模）
2. 优化措辞使其更加专业有力
3. 强化与目标职位的相关性
4. 修复ATS不友好的问题
5. 精简冗余内容

## 输出格式（严格JSON）
{
  "optimized_versions": [
    {
      "version_id": 1,
      "original_score": 75,
      "improved_score": 85,
      "changes_summary": ["改动1", "改动2"],
      "final_content": { /* 完整的优化后简历内容，结构与输入保持一致 */ }
    }
  ]
}"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        node_prompt = task_input.get("prompt") or ""
        versions_data = context.get("versions_data", {})
        reviews = context.get("reviews", {})

        try:
            custom_applied = getattr(self, "_custom_prompt_applied", False)
            resolved_prompt = self.resolve_system_prompt(self.system_prompt)
            requested_title = extract_requested_resume_title_from_prompt(resolved_prompt) if custom_applied else None
            system_prompt = (
                (resolved_prompt or "") + self.optimizer_json_output_schema()
                if custom_applied
                else resolved_prompt
            )
            resume_record = context.get("resumeRecord") or context.get("resume_record") or {}
            current_title = resume_record.get("title") if isinstance(resume_record, dict) else None
            current_name = None
            if isinstance(versions_data, dict):
                first_version = (versions_data.get("versions") or [{}])[0]
                if isinstance(first_version, dict):
                    content = first_version.get("content") or {}
                    if isinstance(content, dict):
                        basic = content.get("basicInfo") or {}
                        if isinstance(basic, dict):
                            current_name = basic.get("name")

            if requested_title:
                title_instruction = f"- 文档名称 resumeTitle: 必须设置为「{requested_title}」（见系统提示词）"
            elif custom_applied:
                title_instruction = "- 文档名称 resumeTitle: 按系统提示词要求设置（见系统提示词）"
            else:
                title_instruction = f"- 文档名称 resumeTitle: {current_title or '沿用输入，不要改回默认'}"

            user_prompt = f"""## 节点任务
{node_prompt}

## 必须保留（除非系统/节点任务明确要求修改）
{title_instruction}
- 候选人姓名 basicInfo.name: {current_name or '沿用输入'}

## 审核反馈
{json.dumps(reviews, ensure_ascii=False, indent=2)}

## 待优化的简历
{json.dumps(versions_data, ensure_ascii=False, indent=2)}

请在不撤销上述必须保留字段的前提下，根据节点任务与审核反馈优化每个版本，严格按 JSON 格式输出。"""
            ai_params = self.get_ai_params(default_temperature=0.5)
            logger.info(
                f"OptimizerAgent 执行 - model={ai_params.get('model') or '-'}, "
                f"custom_prompt={getattr(self, '_custom_prompt_applied', False)}, "
                f"temp={ai_params['temperature']}"
            )
            return self.call_ai_json(
                system_prompt,
                user_prompt,
                temperature=ai_params["temperature"],
                max_tokens=ai_params["max_tokens"],
            )
        except Exception as e:
            logger.error(f"OptimizerAgent 错误: {e}")
            raise


class AnalyzerAgent(BaseAgent):
    """分析智能体 - 解析简历、分析匹配度"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.ANALYZER, config)
        self.system_prompt = """你是一位简历分析专家，擅长从简历中提取结构化信息并进行深度分析。

## 输出格式（严格JSON）
{
  "analysis": {
    "career_level": "junior/mid/senior/lead",
    "years_of_experience": 0,
    "core_competencies": ["核心能力1", "核心能力2"],
    "tech_stack": ["技术1", "技术2"],
    "industry_focus": ["行业1"],
    "education_level": "本科/硕士/博士",
    "career_progression": "职业发展路径评估",
    "notable_achievements": ["突出成就"],
    "red_flags": ["需要关注的问题（如频繁跳槽、空白期）"]
  },
  "match_analysis": {
    "overall_match": 0,
    "skills_match": {"matched": [], "missing": []},
    "experience_match": "经验匹配度说明",
    "recommendations": ["建议1", "建议2"],
    "interview_focus": ["面试应着重考察的方面"]
  }
}"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        resume_data = context.get("resumeData", context.get("resume_data", {}))
        job_description = context.get("jobDescription", context.get("job_description", ""))
        target_role = context.get("targetRole", context.get("target_role", ""))

        try:
            # 如果提供了JD，做匹配度分析；否则做简历解析
            if job_description:
                user_prompt = f"""## 简历数据
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

## 目标职位描述
{job_description}

请分析简历与职位的匹配度，严格按JSON格式输出。"""
                return self.call_ai_json(self.system_prompt, user_prompt, temperature=0.3)
            else:
                user_prompt = f"""## 简历数据
{json.dumps(resume_data, ensure_ascii=False, indent=2)}
## 目标职位: {target_role}

请解析简历并分析，严格按JSON格式输出。"""
                return self.call_ai_json(self.system_prompt, user_prompt, temperature=0.3)
        except Exception as e:
            logger.error(f"AnalyzerAgent 错误: {e}")
            raise


class TranslatorAgent(BaseAgent):
    """翻译智能体 - 将简历从中文翻译为英文"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.ANALYZER, config)
        self.system_prompt = """你是一位专业的简历翻译专家，精通中英文简历写作。你的任务是将中文简历翻译为地道的英文简历。

## 翻译要求
1. 完全保持原始JSON结构
2. 使用专业、地道的英文表达
3. 人名使用拼音，公司名使用官方英文名（如无则用拼音）
4. 职位名称使用国际通用的英文对应职位
5. 量化数据格式调整为英文习惯（如"1万" -> "10,000"）
6. 确保语法正确，无拼写错误
7. 使用有力度的英文行为动词

## 行为动词参考
- 领导类: Led, Directed, Spearheaded, Orchestrated, Chaired
- 创建类: Designed, Developed, Architected, Built, Established
- 改进类: Optimized, Enhanced, Streamlined, Transformed, Revamped
- 成果类: Achieved, Delivered, Generated, Increased, Reduced
- 分析类: Analyzed, Identified, Researched, Evaluated, Assessed
- 管理类: Managed, Oversaw, Coordinated, Administered, Supervised

## 输出格式
直接返回翻译后的JSON，保持与输入完全相同的结构。不要添加任何解释。"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context", {})
        resume_data = context.get("resume_data", {})

        try:
            user_prompt = f"""Translate the following Chinese resume to English. Keep the exact same JSON structure:

{json.dumps(resume_data, ensure_ascii=False, indent=2)}

Output only the translated JSON. Do not include any explanation."""
            response = self.call_ai(self.system_prompt, user_prompt, temperature=0.2, max_tokens=4096)
            result = safe_json_parse(response)
            if not result or "error" in str(result).lower()[:10]:
                # 尝试从响应中提取 JSON
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    return safe_json_parse(json_match.group(), {"raw": response})
            return result if result else {"raw": response}
        except Exception as e:
            logger.error(f"TranslatorAgent 错误: {e}")
            raise


class ResumeChatEditorAgent(BaseAgent):
    """简历对话编辑智能体 - 根据模板 schema 理解字段并修改简历"""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(AgentType.WRITER, config)
        self.system_prompt = ""

    @staticmethod
    def _output_schema_hint() -> str:
        return """

## 输出格式（严格 JSON，勿输出其它文字）
{
  "message": "向用户说明做了哪些修改（中文，简洁）",
  "resumeData": {
    "basicInfo": { "name": "", "position": "", "phone": "", "email": "", "city": "" },
    "professionalSummary": "",
    "workExperience": [{ "id": "", "company": "", "position": "", "startDate": "", "endDate": "", "description": [] }],
    "education": [{ "id": "", "school": "", "major": "", "degree": "", "startDate": "", "endDate": "", "description": "" }],
    "projectExperience": [{ "id": "", "name": "", "role": "", "startDate": "", "endDate": "", "description": [] }],
    "skills": [{ "id": "", "category": "", "items": [] }],
    "certificates": [{ "id": "", "name": "", "issuer": "", "date": "" }],
    "campusActivity": [{ "name": "", "role": "", "duration": "", "description": "" }],
    "portfolio": [{ "name": "", "type": "", "url": "", "description": "" }],
    "dataProjects": [{ "name": "", "role": "", "duration": "", "description": "", "metrics": "", "tools": "" }],
    "productAchievements": [{ "name": "", "role": "", "duration": "", "description": "", "metrics": "" }],
    "publications": [{ "title": "", "journal": "", "year": "", "citations": "", "doi": "" }],
    "openSourceProject": [{ "id": "", "name": "", "url": "", "description": "" }],
    "otherTags": [],
    "githubDesc": ""
  },
  "title": "若修改了简历文档名称则填写，否则省略",
  "style": { "theme": "#2563eb", "fontSize": 14 }
}

规则：
- resumeData 只需包含本次需要变更的字段；未修改的字段不要输出
- 仅修改 dataSchema.enabledComponents / fields 中列出的区块，不要编造模板未启用的区块
- 数组字段若修改请输出该数组的完整条目，保留 id 字段
- basicInfo.name 是候选人姓名；title 是简历列表文件名，二者不可混淆
- 若用户仅咨询未要求修改，resumeData 可省略或为空对象"""

    def _build_system_prompt(
        self,
        data_schema: Dict[str, Any],
        style_schema: Dict[str, Any],
        template_snapshot: Dict[str, Any],
        resume_record: Dict[str, Any],
    ) -> str:
        template_name = template_snapshot.get("name") or "通用模板"
        theme_key = resume_record.get("templateId") or template_snapshot.get("config", {}).get("themeKey") or ""
        config = template_snapshot.get("config") or {}
        enabled = config.get("components") or data_schema.get("enabledComponents") or []
        enabled_text = "、".join(enabled) if isinstance(enabled, list) and enabled else "全部标准区块"
        return f"""你是一位专业的简历编辑助手。用户会通过对话要求修改简历内容。

## 模板信息
- 模板名称: {template_name}
- themeKey: {theme_key}
- 当前模板启用的简历区块: {enabled_text}

## 简历 data 字段 schema（JSON Schema 描述，修改时必须遵守字段含义与结构）
{json.dumps(data_schema, ensure_ascii=False, indent=2)}

## 简历 style 字段 schema
{json.dumps(style_schema, ensure_ascii=False, indent=2)}

## 当前 resumes 记录元信息
- title（文档名称）: {resume_record.get('title') or '未设置'}
- templateId: {resume_record.get('templateId') or theme_key}
- style: {json.dumps(resume_record.get('style') or {}, ensure_ascii=False)}

请根据用户指令修改简历。先理解 schema 中各字段含义，再输出变更。
{self._output_schema_hint()}"""

    async def process(self, task_input: Dict[str, Any]) -> Dict[str, Any]:
        context = task_input.get("context") or {}
        message = (task_input.get("message") or context.get("message") or "").strip()
        history = context.get("history") or []
        resume_data = context.get("resumeData") or context.get("resume_data") or {}
        resume_record = context.get("resumeRecord") or context.get("resume_record") or {}
        data_schema = context.get("dataSchema") or context.get("data_schema") or {}
        style_schema = context.get("styleSchema") or context.get("style_schema") or {}
        template_snapshot = context.get("templateSnapshot") or context.get("template_snapshot") or {}

        if not message:
            return {"message": "请输入要修改的内容。", "resumeData": {}}

        system_prompt = self._build_system_prompt(
            data_schema if isinstance(data_schema, dict) else {},
            style_schema if isinstance(style_schema, dict) else {},
            template_snapshot if isinstance(template_snapshot, dict) else {},
            resume_record if isinstance(resume_record, dict) else {},
        )

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        for item in history[-10:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content")
            if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                messages.append({"role": role, "content": content.strip()})

        user_content = f"""## 当前简历 data
{json.dumps(resume_data, ensure_ascii=False, indent=2)}

## 用户最新指令
{message}"""
        messages.append({"role": "user", "content": user_content})

        try:
            ai_params = self.get_ai_params(default_temperature=0.4)
            response = self.zhipu_client.chat(
                messages,
                temperature=ai_params["temperature"],
                max_tokens=ai_params["max_tokens"],
                model=ai_params["model"],
            )
            parsed = safe_json_parse(response, {})
            if not isinstance(parsed, dict):
                parsed = {}

            reply = parsed.get("message") or parsed.get("reply") or "已完成修改。"
            resume_patch = parsed.get("resumeData") or parsed.get("resume_data") or {}
            if not isinstance(resume_patch, dict):
                resume_patch = {}

            result: Dict[str, Any] = {
                "message": str(reply),
                "resumeData": resume_patch,
            }
            if isinstance(parsed.get("title"), str) and parsed["title"].strip():
                result["title"] = parsed["title"].strip()
            if isinstance(parsed.get("style"), dict):
                result["style"] = parsed["style"]

            log_agent_io("resume_chat_editor", "chat_edit", output_summary={
                "message_preview": str(reply)[:120],
                "patch_keys": list(resume_patch.keys()) if isinstance(resume_patch, dict) else [],
            })
            return result
        except Exception as e:
            logger.error(f"ResumeChatEditorAgent 错误: {e}", exc_info=True)
            return {
                "message": f"处理失败: {str(e)}",
                "resumeData": {},
            }


# ==================== 多智能体编排器 ====================

class MultiAgentOrchestrator:
    """多智能体编排器 - 协调多个Agent并行/串行执行工作流"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.agents = {
            AgentType.PLANNER: PlannerAgent(self.config),
            AgentType.WRITER: WriterAgent(self.config),
            AgentType.REVIEWER: ReviewerAgent(self.config),
            AgentType.OPTIMIZER: OptimizerAgent(self.config),
            AgentType.ANALYZER: AnalyzerAgent(self.config),
            "translator": TranslatorAgent(self.config),
            "resume_chat_editor": ResumeChatEditorAgent(self.config),
        }
        # 确保知识库已加载
        knowledge_base.load()
        self._log_init()

    def _log_init(self):
        logger.info("=" * 60)
        logger.info("MultiAgentOrchestrator 初始化完成")
        logger.info(f"模型配置: {ai_config.catalog_path}")
        logger.info(f"API Key: {'已配置' if ai_config.ZHIPU_API_KEY else '未配置'}")
        logger.info(f"QPS 限制: {ai_config.AI_QPS_LIMIT}")
        logger.info(f"知识库: {len(knowledge_base._templates)} 个行业模板")
        logger.info("=" * 60)

    def apply_agent_configs(self, agent_configs: Dict[str, Any]) -> None:
        """应用前端工作流设计器传入的 Agent 配置（提示词、温度等）"""
        if not agent_configs:
            return

        agent_key_map = {
            "planner": AgentType.PLANNER,
            "analyzer": AgentType.ANALYZER,
            "writer": AgentType.WRITER,
            "reviewer": AgentType.REVIEWER,
            "optimizer": AgentType.OPTIMIZER,
            "translator": "translator",
        }

        for config_key, cfg in agent_configs.items():
            agent_ref = agent_key_map.get(config_key)
            if not agent_ref or agent_ref not in self.agents:
                continue

            agent = self.agents[agent_ref]
            system_prompt = cfg.get("systemPrompt") or cfg.get("system_prompt")
            if system_prompt is not None and system_prompt != "":
                agent.system_prompt = system_prompt
                agent._custom_prompt_applied = True
            else:
                agent._custom_prompt_applied = False
            if cfg.get("temperature") is not None:
                agent.config["temperature"] = cfg["temperature"]
            if cfg.get("topP") is not None:
                agent.config["top_p"] = cfg["topP"]
            if cfg.get("maxTokens") is not None:
                agent.config["max_tokens"] = cfg["maxTokens"]
            model_name = cfg.get("model")
            if model_name:
                normalized_model = ai_config.normalize_resume_model(model_name)
                agent.config["model"] = normalized_model
                if agent.zhipu_client:
                    agent.zhipu_client.model = normalized_model
            if cfg.get("memoryTurns") is not None:
                agent.config["memory_turns"] = cfg["memoryTurns"]

            logger.info(
                f"已应用 Agent 配置: {config_key} "
                f"(prompt={'有' if system_prompt else '无'}, "
                f"temp={cfg.get('temperature')}, model={model_name or agent.config.get('model') or '-'})"
            )

    def _resolve_agent_type_from_node(self, node: Dict[str, Any]) -> str:
        if node.get("agentType"):
            return str(node["agentType"])

        type_aliases = {
            "parse": "analyzer",
            "optimize": "optimizer",
            "edit": "writer",
            "editor": "writer",
            "skill": "analyzer",
            "interview": "writer",
            "custom": "writer",
            "planner": "planner",
            "analyzer": "analyzer",
            "writer": "writer",
            "reviewer": "reviewer",
            "optimizer": "optimizer",
            "translator": "translator",
            "llm": "writer",
        }

        node_type = str(node.get("type") or "")
        node_id = str(node.get("id") or "")
        id_prefix = node_id.split("_")[0] if node_id else ""

        return type_aliases.get(node_type) or type_aliases.get(id_prefix) or type_aliases.get(node_id) or node_type

    def _normalize_resume_content_patch(self, patch: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(patch, dict):
            return {}
        normalized = json.loads(json.dumps(patch, ensure_ascii=False))

        if not normalized.get("professionalSummary") and normalized.get("summary"):
            normalized["professionalSummary"] = normalized["summary"]

        if not normalized.get("workExperience") and isinstance(normalized.get("experience"), list):
            normalized["workExperience"] = normalized["experience"]
        if not normalized.get("projectExperience") and isinstance(normalized.get("projects"), list):
            normalized["projectExperience"] = normalized["projects"]
        if not normalized.get("openSourceProject") and isinstance(normalized.get("openSource"), list):
            normalized["openSourceProject"] = normalized["openSource"]

        raw_text = normalized.get("rawText") if isinstance(normalized.get("rawText"), str) else ""
        summary = normalized.get("professionalSummary") if isinstance(normalized.get("professionalSummary"), str) else ""
        if raw_text and summary and len(summary) > 600 and (
            summary.strip() == raw_text.strip() or raw_text.strip().startswith(summary.strip()[:200])
        ):
            has_structure = any(
                isinstance(normalized.get(key), list) and len(normalized.get(key)) > 0
                for key in ("workExperience", "education", "projectExperience", "skills")
            )
            if has_structure:
                normalized["professionalSummary"] = ""

        for alias in ("summary", "experience", "projects", "openSource"):
            normalized.pop(alias, None)
        return normalized

    def _merge_resume_content(self, base: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(base, dict):
            base = {}
        if not isinstance(patch, dict):
            return base

        patch = self._normalize_resume_content_patch(patch)
        merged = json.loads(json.dumps(base, ensure_ascii=False))

        if isinstance(patch.get("basicInfo"), dict):
            merged["basicInfo"] = {**(merged.get("basicInfo") or {}), **patch["basicInfo"]}

        for key in (
            "professionalSummary", "rawText", "githubDesc",
            "workExperience", "education", "projectExperience", "skills",
            "certificates", "openSourceProject", "github", "campusActivity",
            "portfolio", "dataProjects", "productAchievements", "publications", "otherTags",
        ):
            if key in patch and patch[key] not in (None, ""):
                merged[key] = patch[key]

        return merged

    def _extract_resume_style_from_agent_result(
        self,
        agent_type: str,
        result: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        direct = result.get("resumeStyle") or result.get("resume_style")
        if isinstance(direct, dict):
            return direct

        if agent_type == "writer":
            versions = result.get("versions") or []
            if versions and isinstance(versions[0], dict):
                style = versions[0].get("resumeStyle") or versions[0].get("style")
                if isinstance(style, dict):
                    return style

        if agent_type == "optimizer":
            optimized = result.get("optimized_versions") or []
            if optimized and isinstance(optimized[0], dict):
                style = optimized[0].get("resumeStyle") or optimized[0].get("style")
                if isinstance(style, dict):
                    return style

        return None

    def _extract_resume_title_from_agent_result(
        self,
        agent_type: str,
        result: Dict[str, Any],
    ) -> Optional[str]:
        direct = result.get("resumeTitle") or result.get("resume_title")
        if isinstance(direct, str) and direct.strip():
            return direct.strip()

        if agent_type == "writer":
            versions = result.get("versions") or []
            if versions and isinstance(versions[0], dict):
                v0 = versions[0]
                for key in ("resumeTitle", "resume_title"):
                    value = v0.get(key)
                    if isinstance(value, str) and value.strip():
                        return value.strip()

        if agent_type == "optimizer":
            optimized = result.get("optimized_versions") or []
            if optimized and isinstance(optimized[0], dict):
                for key in ("resumeTitle", "resume_title"):
                    value = optimized[0].get(key)
                    if isinstance(value, str) and value.strip():
                        return value.strip()

        return None

    def _resolve_resume_title_for_node(
        self,
        agent_type: str,
        agent_result: Dict[str, Any],
        resume_record: Dict[str, Any],
        system_prompt: str,
    ) -> Optional[str]:
        """合并 AI 输出与 systemPrompt 中的显式改名指令，避免误用 versions[].title。"""
        extracted = self._extract_resume_title_from_agent_result(agent_type, agent_result)
        requested = extract_requested_resume_title_from_prompt(system_prompt or "")
        if requested:
            return requested
        if extracted:
            return extracted
        if isinstance(resume_record, dict):
            prev_title = resume_record.get("title")
            if isinstance(prev_title, str) and prev_title.strip():
                return prev_title.strip()
        return None

    def _extract_resume_from_agent_result(
        self,
        agent_type: str,
        result: Dict[str, Any],
        input_resume: Dict[str, Any],
    ) -> Dict[str, Any]:
        if agent_type == "writer":
            versions = result.get("versions") or []
            if versions:
                content = versions[0].get("content") if isinstance(versions[0], dict) else versions[0]
                if isinstance(content, dict):
                    return self._merge_resume_content(input_resume, content)

        if agent_type == "optimizer":
            optimized = result.get("optimized_versions") or []
            if optimized:
                content = optimized[0].get("final_content") or optimized[0].get("content")
                if isinstance(content, dict):
                    return self._merge_resume_content(input_resume, content)

        if agent_type == "translator":
            translated = result.get("translated") or result.get("translation")
            if isinstance(translated, dict):
                return self._merge_resume_content(input_resume, translated)

        return input_resume

    async def run_workflow_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """按工作流设计器节点配置执行单个智能体节点"""
        agent_type = self._resolve_agent_type_from_node(node)
        node_config = node.get("config") or {}
        agent_configs = context.get("agent_configs") or context.get("agentConfigs") or {}

        typed_cfg = agent_configs.get(agent_type) or {}
        merged_cfg = {
            **node_config,
            **typed_cfg,
            "name": node.get("name") or typed_cfg.get("name"),
            "description": node.get("description") or typed_cfg.get("description"),
            "temperature": typed_cfg.get("temperature", node_config.get("temperature", node.get("temp"))),
        }
        if merged_cfg.get("system_prompt") and not merged_cfg.get("systemPrompt"):
            merged_cfg["systemPrompt"] = merged_cfg["system_prompt"]

        final_agent_configs = {agent_type: merged_cfg} if merged_cfg else {}
        if final_agent_configs:
            self.apply_agent_configs(final_agent_configs)

        agent_key_map = {
            "planner": AgentType.PLANNER,
            "analyzer": AgentType.ANALYZER,
            "writer": AgentType.WRITER,
            "reviewer": AgentType.REVIEWER,
            "optimizer": AgentType.OPTIMIZER,
            "translator": "translator",
        }
        agent_ref = agent_key_map.get(agent_type)
        if not agent_ref or agent_ref not in self.agents:
            return {
                "status": TaskStatus.FAILED.value,
                "output_data": {"error": f"不支持的智能体节点类型: {agent_type}"},
            }

        resume_data = context.get("resume_data") or context.get("resumeData") or {}
        resume_record = context.get("resume_record") or context.get("resumeRecord") or {}
        template_id = context.get("template_id") or context.get("templateId") or "classic"
        template_def = knowledge_base.get_template_definition(template_id)

        task_context = {
            **context,
            "resumeData": resume_data,
            "resume_data": resume_data,
            "resumeRecord": resume_record,
            "resume_record": resume_record,
            "template_id": template_id,
            "template_definition": template_def,
            "versionsCount": 1,
            "versions": 1,
            "styles": context.get("styles") or ["专业版"],
            "targetRole": context.get("targetRole") or context.get("target_role") or "",
            "target_role": context.get("targetRole") or context.get("target_role") or "",
            "industry": context.get("industry") or "互联网",
            "experienceLevel": context.get("experienceLevel") or context.get("experience_level") or "mid",
            "experience_level": context.get("experienceLevel") or context.get("experience_level") or "mid",
        }

        agent = self.agents[agent_ref]
        prompt = node.get("name") or node.get("description") or f"执行节点 {agent_type}"

        if agent_type == "optimizer":
            task_context["versions_data"] = {
                "versions": [{
                    "version_id": 1,
                    "content": resume_data,
                    "resumeTitle": resume_record.get("title") if isinstance(resume_record, dict) else None,
                }],
            }
            task_context["reviews"] = context.get("reviews") or {}
        elif agent_type == "reviewer":
            task_context["versions_data"] = {
                "versions": [{"version_id": 1, "content": resume_data}],
            }

        try:
            agent_result = await agent.process({"prompt": prompt, "context": task_context})
            merged_resume = self._extract_resume_from_agent_result(agent_type, agent_result, resume_data)
            active_system_prompt = "\n".join(
                part.strip()
                for part in (
                    merged_cfg.get("systemPrompt"),
                    node_config.get("systemPrompt"),
                    node_config.get("system_prompt"),
                    node.get("description"),
                )
                if isinstance(part, str) and part.strip()
            )
            resume_title = self._resolve_resume_title_for_node(
                agent_type,
                agent_result,
                resume_record if isinstance(resume_record, dict) else {},
                active_system_prompt,
            )
            resume_style = self._extract_resume_style_from_agent_result(agent_type, agent_result)

            log_agent_io(agent_type, "run_workflow_node", output_summary={
                "node_id": node.get("id"),
                "agent_type": agent_type,
                "has_custom_prompt": bool(merged_cfg.get("systemPrompt") or node_config.get("systemPrompt")),
                "system_prompt_preview": str(merged_cfg.get("systemPrompt") or node_config.get("systemPrompt") or "")[:120],
                "resume_title": resume_title,
                "has_resume_style": bool(resume_style),
                "resume_keys": list(merged_resume.keys()) if isinstance(merged_resume, dict) else [],
            })

            output_data = {
                "resume_data": merged_resume,
                "agent_type": agent_type,
                "node_id": node.get("id"),
                "agent_result": agent_result,
                "applied_config": final_agent_configs.get(agent_type) or node_config,
            }
            if resume_title:
                output_data["resume_title"] = resume_title
                output_data["title"] = resume_title
            if resume_style:
                output_data["resume_style"] = resume_style
                output_data["style"] = resume_style

            return {
                "status": TaskStatus.COMPLETED.value,
                "output_data": output_data,
            }
        except Exception as e:
            logger.error(f"单节点执行失败 node={node.get('id')} agent={agent_type}: {e}", exc_info=True)
            return {
                "status": TaskStatus.FAILED.value,
                "output_data": {"error": str(e), "node_id": node.get("id"), "agent_type": agent_type},
            }

    async def run_resume_chat_edit(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """简历编辑器 AI 对话修改"""
        agent = self.agents.get("resume_chat_editor")
        if not agent:
            return {
                "status": TaskStatus.FAILED.value,
                "output_data": {"error": "resume_chat_editor 智能体未初始化"},
            }

        model_id = input_data.get("modelId") or input_data.get("model_id")
        if model_id:
            normalized = ai_config.normalize_resume_model(model_id)
            agent.config["model"] = normalized
            if agent.zhipu_client:
                agent.zhipu_client.model = normalized

        context = {
            "message": input_data.get("message") or "",
            "history": input_data.get("history") or [],
            "resumeData": input_data.get("resumeData") or input_data.get("resume_data") or {},
            "resumeRecord": input_data.get("resumeRecord") or input_data.get("resume_record") or {},
            "dataSchema": input_data.get("dataSchema") or input_data.get("data_schema") or {},
            "styleSchema": input_data.get("styleSchema") or input_data.get("style_schema") or {},
            "templateSnapshot": input_data.get("templateSnapshot") or input_data.get("template_snapshot") or {},
        }

        log_agent_io("resume_chat_editor", "request", input_summary={
            "message_preview": str(context["message"])[:120],
            "history_len": len(context["history"]),
            "resume_keys": list(context["resumeData"].keys()) if isinstance(context["resumeData"], dict) else [],
            "model": agent.config.get("model"),
        })

        result = await agent.process({"message": context["message"], "context": context})
        return {
            "status": TaskStatus.COMPLETED.value,
            "output_data": result if isinstance(result, dict) else {"message": str(result), "resumeData": {}},
        }

    async def execute_workflow(self, workflow_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        task_id = f"task_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        log_agent_io("orchestrator", "workflow_start", {
            "task_id": task_id,
            "workflow_type": workflow_type,
            "template_id": input_data.get("template_id") or input_data.get("templateId"),
            "target_role": input_data.get("target_role") or input_data.get("targetRole"),
            "workflow_nodes_count": len(input_data.get("workflow_nodes") or input_data.get("workflowNodes") or []),
            "agent_config_keys": list((input_data.get("agent_configs") or input_data.get("agentConfigs") or {}).keys()),
        })

        # 应用前端传入的 Agent 配置
        agent_configs = input_data.get("agent_configs") or input_data.get("agentConfigs") or {}
        if agent_configs:
            self.apply_agent_configs(agent_configs)

        workflows = {
            "generate_versions": self._generate_versions_workflow,
            "optimize_resume": self._optimize_resume_workflow,
            "analyze_match": self._analyze_match_workflow,
            "translate": self._translate_resume_workflow,
        }
        handler = workflows.get(workflow_type)
        if not handler:
            log_agent_io("orchestrator", "workflow_error", output_summary={"error": f"未知工作流: {workflow_type}"})
            return {"error": f"未知工作流: {workflow_type}"}
        result = await handler(task_id, input_data)
        log_agent_io("orchestrator", "workflow_end", output_summary={
            "task_id": task_id,
            "status": result.get("status"),
            "output_keys": list((result.get("output_data") or {}).keys()) if isinstance(result.get("output_data"), dict) else [],
            "versions_count": len((result.get("output_data") or {}).get("versions", [])),
            "error": (result.get("output_data") or {}).get("error"),
        })
        return result

    # ==================== 工作流1: 多版本生成（支持模板适配和双语生成） ====================
    async def _generate_versions_workflow(self, task_id: str, input_data: Dict) -> Dict:
        task = AgentTask(task_id=task_id, task_type="generate_versions",
                         status=TaskStatus.RUNNING.value, input_data=input_data)

        try:
            # 获取模板定义
            template_id = input_data.get("template_id", "classic")
            template_def = knowledge_base.get_template_definition(template_id)
            logger.info(f"模板定义: {template_def.get('name', 'Unknown')} (id={template_id})")

            # 阶段1: 并行执行规划和分析
            plan_future = self.agents[AgentType.PLANNER].process(
                {"prompt": "制定生成计划", "context": {
                    **input_data,
                    "template_id": template_id,
                    "template_definition": template_def,
                }})
            analyze_future = self.agents[AgentType.ANALYZER].process(
                {"prompt": "分析简历数据", "context": {
                    **input_data,
                    "template_id": template_id,
                    "template_definition": template_def,
                }})

            plan_result, analysis_result = await asyncio.gather(plan_future, analyze_future)
            log_agent_io("planner", "阶段1-规划", output_summary={
                "plan_keys": list(plan_result.keys()) if isinstance(plan_result, dict) else [],
            })
            log_agent_io("analyzer", "阶段1-分析", output_summary={
                "analysis_keys": list(analysis_result.keys()) if isinstance(analysis_result, dict) else [],
            })
            logger.info(f"阶段1完成: 规划+分析 ({task_id}) 模板={template_def.get('name')}")

            # 阶段2: 根据规划和模板定义生成简历
            versions_count = input_data.get("versionsCount", input_data.get("versions_count", 2))
            styles = input_data.get("styles", ["专业", "创意"])
            resume_data = input_data.get("resumeData", input_data.get("resume_data", {}))

            # 并行生成多个版本
            writer_tasks = []
            for i in range(versions_count):
                style = styles[i % len(styles)] if i < len(styles) else "专业"
                version_plan = plan_result.get("plan", {}).get("versions", [])
                focus = version_plan[i].get("focus", "") if i < len(version_plan) else ""

                writer_tasks.append(self.agents[AgentType.WRITER].process({
                    "prompt": f"生成版本{i + 1}",
                    "context": {
                        **input_data,
                        "version_index": i,
                        "style": style,
                        "focus": focus,
                        "analysis": analysis_result,
                        "plan": plan_result,
                        "template_id": template_id,
                        "template_definition": template_def,
                    }
                }))

            writer_results = await asyncio.gather(*writer_tasks)
            log_agent_io("writer", "阶段2-撰写", output_summary={
                "versions_generated": sum(len(wr.get("versions", [])) for wr in writer_results if isinstance(wr, dict)),
            })

            # 合并多个 Writer 的结果
            all_versions = []
            for i, wr in enumerate(writer_results):
                for v in wr.get("versions", []):
                    v["version_id"] = len(all_versions) + 1
                    v["template_id"] = template_id
                    v["template_name"] = template_def.get("name", "")
                    all_versions.append(v)

            logger.info(f"阶段2完成: 生成 {len(all_versions)} 个中文版本 ({task_id})")

            # 阶段3: 审核
            review_result = await self.agents[AgentType.REVIEWER].process({
                "prompt": "审核所有版本",
                "context": {"versions_data": {"versions": all_versions},
                           "targetRole": input_data.get("targetRole", input_data.get("target_role", "")),
                           "template_id": template_id,
                           "template_definition": template_def,
                           }
            })
            log_agent_io("reviewer", "阶段3-审核", output_summary={
                "best_version": review_result.get("best_version") if isinstance(review_result, dict) else None,
                "reviews_count": len(review_result.get("reviews", [])) if isinstance(review_result, dict) else 0,
            })

            # 确定推荐版本
            best_v = review_result.get("best_version", 1)

            # 阶段4: 生成英文版本（如果需要）
            all_english_versions = []
            generate_english = input_data.get("generate_english", False)
            english_versions_count = input_data.get("english_versions_count", 0)

            if generate_english and english_versions_count > 0:
                logger.info(f"阶段4: 开始生成 {english_versions_count} 个英文版本 ({task_id})")

                translate_tasks = []
                for i in range(min(english_versions_count, len(all_versions))):
                    source_version = all_versions[i]
                    source_content = source_version.get("content", {})

                    translate_tasks.append(self.agents["translator"].process({
                        "prompt": f"翻译版本{i + 1}为英文",
                        "context": {
                            "resume_data": source_content,
                            "target_language": "en",
                            "template_id": template_id,
                            "template_definition": template_def,
                        }
                    }))

                translate_results = await asyncio.gather(*translate_tasks)

                for i, tr in enumerate(translate_results):
                    all_english_versions.append({
                        "version_id": i + 1,
                        "title": f"English Resume - {template_def.get('name', '')} V{i + 1}",
                        "language": "en",
                        "template_id": template_id,
                        "template_name": template_def.get("name", ""),
                        "content": tr if isinstance(tr, dict) else {"raw": str(tr)},
                    })

                logger.info(f"阶段4完成: 生成 {len(all_english_versions)} 个英文版本 ({task_id})")

            task.output_data = {
                "task_id": task_id,
                "template_id": template_id,
                "template_name": template_def.get("name", ""),
                "analysis": analysis_result,
                "plan": plan_result,
                "versions": all_versions,
                "english_versions": all_english_versions,
                "reviews": review_result.get("reviews", []),
                "recommended_version": best_v,
                "overall_assessment": review_result.get("overall_assessment", ""),
            }
            task.status = TaskStatus.COMPLETED.value
            return asdict(task)

        except Exception as e:
            logger.error(f"生成工作流失败: {e}", exc_info=True)
            log_agent_io("orchestrator", "workflow_exception", output_summary={"error": str(e), "task_id": task_id})
            task.status = TaskStatus.FAILED.value
            task.output_data = {"error": str(e)}
            return asdict(task)

    # ==================== 工作流2: 简历优化 ====================
    async def _optimize_resume_workflow(self, task_id: str, input_data: Dict) -> Dict:
        task = AgentTask(task_id=task_id, task_type="optimize_resume",
                         status=TaskStatus.RUNNING.value, input_data=input_data)

        try:
            # 并行分析+审核
            analyze_future = self.agents[AgentType.ANALYZER].process(
                {"prompt": "分析简历问题", "context": input_data})
            review_future = self.agents[AgentType.REVIEWER].process(
                {"prompt": "审核简历", "context": {
                    "versions_data": {"versions": [{"version_id": 1,
                     "content": input_data.get("resumeData", input_data.get("resume_data", {}))}]},
                    "targetRole": input_data.get("targetRole", input_data.get("target_role", ""))
                }})

            analysis, review = await asyncio.gather(analyze_future, review_future)
            logger.info(f"优化阶段1完成: 分析+审核 ({task_id})")

            # 优化
            optimized = await self.agents[AgentType.OPTIMIZER].process({
                "prompt": "优化简历",
                "context": {
                    **input_data,
                    "versions_data": {"versions": [{"version_id": 1,
                     "content": input_data.get("resumeData", input_data.get("resume_data", {}))}]},
                    "reviews": review,
                    "analysis": analysis,
                }
            })

            optimized_versions = optimized.get("optimized_versions", [{}])

            task.output_data = {
                "task_id": task_id,
                "analysis": analysis,
                "review": review,
                "optimized_content": optimized_versions[0] if optimized_versions else {},
                "all_optimized": optimized_versions,
            }
            task.status = TaskStatus.COMPLETED.value
            return asdict(task)

        except Exception as e:
            logger.error(f"优化工作流失败: {e}")
            task.status = TaskStatus.FAILED.value
            task.output_data = {"error": str(e)}
            return asdict(task)

    # ==================== 工作流3: 匹配度分析 ====================
    async def _analyze_match_workflow(self, task_id: str, input_data: Dict) -> Dict:
        task = AgentTask(task_id=task_id, task_type="analyze_match",
                         status=TaskStatus.RUNNING.value, input_data=input_data)

        try:
            analysis = await self.agents[AgentType.ANALYZER].process({
                "prompt": "分析职位匹配度",
                "context": input_data
            })

            task.output_data = {"task_id": task_id, "match_analysis": analysis}
            task.status = TaskStatus.COMPLETED.value
            return asdict(task)

        except Exception as e:
            logger.error(f"匹配分析工作流失败: {e}")
            task.status = TaskStatus.FAILED.value
            task.output_data = {"error": str(e)}
            return asdict(task)

    # ==================== 工作流4: 翻译 ====================
    async def _translate_resume_workflow(self, task_id: str, input_data: Dict) -> Dict:
        task = AgentTask(task_id=task_id, task_type="translate",
                         status=TaskStatus.RUNNING.value, input_data=input_data)

        try:
            translated = await self.agents["translator"].process({
                "prompt": "翻译简历",
                "context": input_data
            })

            task.output_data = {
                "task_id": task_id,
                "original": input_data.get("resume_data", {}),
                "translated": translated,
                "target_language": input_data.get("target_language", "en"),
            }
            task.status = TaskStatus.COMPLETED.value
            return asdict(task)

        except Exception as e:
            logger.error(f"翻译工作流失败: {e}")
            task.status = TaskStatus.FAILED.value
            task.output_data = {"error": str(e)}
            return asdict(task)