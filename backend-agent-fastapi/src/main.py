import os
import sys
import json
import logging
import time
import uuid
import asyncio
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 日志必须在业务模块 import 之前初始化
from logging_config import setup_logging, get_log_dir

setup_logging()

from agents.base import MultiAgentOrchestrator, ZhipuAIClient
from knowledge import knowledge_base
from knowledge.assistant_rag import retrieve_for_assistant
from knowledge.assistant_skills import detect_skills, list_skills, skill_catalog_prompt

# ==================== 路径与日志器 ====================

project_root = Path(__file__).parent.parent
LOG_DIR = get_log_dir()
date_tag = datetime.now().strftime('%Y%m%d')
LOG_FILE = LOG_DIR / f"multiagent_{date_tag}.log"
ERROR_LOG_FILE = LOG_DIR / f"multiagent_error_{date_tag}.log"
API_LOG_FILE = LOG_DIR / f"multiagent_api_{date_tag}.log"

business_logger = logging.getLogger('multiagent.business')
api_logger = logging.getLogger('multiagent.api')
error_logger = logging.getLogger('multiagent.error')
logger = logging.getLogger(__name__)

# ==================== 环境配置 ====================

load_dotenv(project_root / ".env")

from config import ai_config

config = {
    "ZHIPU_API_KEY": ai_config.ZHIPU_API_KEY,
    "ZHIPU_MODEL": ai_config.ZHIPU_MODEL,
    "ZHIPU_API_URL": ai_config.ZHIPU_API_URL,
    "AI_QPS_LIMIT": ai_config.AI_QPS_LIMIT,
    "API_PORT": os.getenv("API_PORT", "5001"),
}

SERVICE_NAME = "backend-agent-fastapi"
SERVICE_VERSION = "2.0.0"

# ==================== FastAPI 应用 ====================

app = FastAPI(
    title="简流 AI Agent",
    description="Multi-agent resume service (FastAPI)",
    version=SERVICE_VERSION,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = MultiAgentOrchestrator(config)

_request_id: ContextVar[str] = ContextVar("request_id", default="N/A")
_start_time: ContextVar[float] = ContextVar("start_time", default=0.0)


def generate_request_id() -> str:
    return str(uuid.uuid4())[:8]


def log_business_event(event_type, message, data=None):
    business_logger.info(
        f"[业务事件] {event_type} | {message} | 数据={json.dumps(data, ensure_ascii=False) if data else 'N/A'}"
    )


def log_error(error_type, message, exception=None, stack_trace=None):
    error_logger.error(
        f"[错误] {error_type} | {message} | 异常={str(exception) if exception else 'N/A'}"
    )
    business_logger.error(
        f"[业务错误] ID={_request_id.get()} | {error_type} | {message}"
    )


def ok(data: Any = None, message: str = None) -> dict:
    body: dict = {"success": True}
    if message is not None:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return body


def fail(code: int, message: str, status: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"success": False, "error": {"code": code, "message": message}},
    )


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    rid = generate_request_id()
    _request_id.set(rid)
    started = time.time()
    _start_time.set(started)

    api_logger.info(
        "[REQUEST] "
        + json.dumps(
            {
                "request_id": rid,
                "method": request.method,
                "path": request.url.path,
                "ip": request.client.host if request.client else None,
                "query_params": dict(request.query_params),
                "timestamp": datetime.now().isoformat(),
            },
            ensure_ascii=False,
        )
    )
    business_logger.info(
        f"[请求开始] ID={rid} | {request.method} {request.url.path}"
    )

    try:
        response = await call_next(request)
    except Exception as e:
        import traceback
        log_error("中间件异常", str(e), e, traceback.format_exc())
        raise

    duration_ms = round((time.time() - started) * 1000, 2)
    api_logger.info(
        "[RESPONSE] "
        + json.dumps(
            {
                "request_id": rid,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "timestamp": datetime.now().isoformat(),
            },
            ensure_ascii=False,
        )
    )
    business_logger.info(
        f"[请求结束] ID={rid} | 状态={response.status_code} | 耗时={duration_ms}ms"
    )
    return response


@app.exception_handler(Exception)
async def handle_exception(_request: Request, e: Exception):
    import traceback
    log_error("全局异常", str(e), e, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": 5000, "message": f"服务器内部错误: {str(e)}"},
        },
    )


THEME_KEY_MAP = {
    "frontendEngineer": "classic",
    "modern": "modern",
    "creative": "creative",
    "data": "data",
    "amber": "amber",
    "purple": "purple",
    "developer": "developer",
}


def normalize_template_id(template_id: str) -> str:
    return THEME_KEY_MAP.get(template_id, template_id or "classic")


@app.get("/health")
def health_check():
    log_business_event("健康检查", "服务健康检查请求")
    result = {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "framework": "fastapi",
        "catalog_path": ai_config.catalog_path,
        "api_key_configured": bool(ai_config.ZHIPU_API_KEY),
        "default_model": ai_config.normalize_resume_model(ai_config.ZHIPU_MODEL),
        "supported_models": ai_config.ZHIPU_SUPPORTED_MODELS,
        "api_url": ai_config.ZHIPU_API_URL,
        "log_directory": str(LOG_DIR),
        "uptime": datetime.now().isoformat(),
    }
    log_business_event(
        "健康检查",
        "服务状态正常",
        {"api_key_configured": result["api_key_configured"]},
    )
    return result


@app.get("/api/agents/capabilities")
def get_capabilities():
    log_business_event("能力查询", "查询智能体能力列表")
    capabilities = {
        "success": True,
        "data": {
            "workflows": [
                {
                    "type": "generate_versions",
                    "name": "多版本生成（支持模板适配）",
                    "description": "基于7个模板解析内容，适配选中模板格式，生成中英文简历版本",
                    "agents": ["planner", "analyzer", "writer", "reviewer", "translator"],
                    "estimated_time": "30-60秒",
                    "supports_templates": True,
                    "supports_bilingual": True,
                    "templates": [
                        "classic", "modern", "creative", "data",
                        "amber", "purple", "developer",
                    ],
                },
                {
                    "type": "optimize_resume",
                    "name": "简历优化",
                    "description": "分析并优化现有简历内容",
                    "agents": ["analyzer", "optimizer", "reviewer"],
                    "estimated_time": "20-40秒",
                },
                {
                    "type": "analyze_match",
                    "name": "匹配度分析",
                    "description": "分析简历与目标职位的匹配程度",
                    "agents": ["analyzer"],
                    "estimated_time": "10-20秒",
                },
                {
                    "type": "translate",
                    "name": "简历翻译",
                    "description": "将中文简历翻译成英文简历",
                    "agents": ["translator"],
                    "estimated_time": "10-30秒",
                },
            ],
            "agent_types": [
                {"type": "planner", "role": "规划者", "description": "制定任务执行计划"},
                {"type": "analyzer", "role": "分析者", "description": "分析简历内容和职位要求"},
                {"type": "writer", "role": "撰写者", "description": "生成和撰写简历内容（支持模板适配）"},
                {"type": "reviewer", "role": "审核者", "description": "审核和评估简历质量"},
                {"type": "optimizer", "role": "优化者", "description": "优化和改进简历内容"},
                {"type": "translator", "role": "翻译者", "description": "翻译简历内容"},
            ],
        },
    }
    log_business_event(
        "能力查询",
        "返回能力列表",
        {"workflows_count": len(capabilities["data"]["workflows"])},
    )
    return capabilities


@app.post("/api/agents/generate-versions")
async def generate_versions(request: Request):
    try:
        data = await request.json()
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return fail(1001, "请求数据不能为空")

        resume_data = data.get("resumeData", {})
        target_role = data.get("targetRole", "")
        template_id = normalize_template_id(data.get("templateId", "classic"))
        versions_count = data.get("versionsCount", 2)
        styles = data.get("styles", ["专业", "创意"])
        generate_english = data.get("generateEnglish", False)
        english_versions_count = data.get("englishVersionsCount", 0)
        industry = data.get("industry", "互联网")
        experience_level = data.get("experienceLevel", "mid")
        workflow_nodes = data.get("workflowNodes", [])
        agent_configs = data.get("agentConfigs", {})

        log_business_event("多版本生成-入参", "接收生成请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "target_role": target_role,
            "template_id": template_id,
            "versions_count": versions_count,
            "styles": styles,
            "generate_english": generate_english,
            "english_versions_count": english_versions_count,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False)),
        })

        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return fail(1001, "简历数据不能为空")

        input_data = {
            "resume_data": resume_data,
            "target_role": target_role,
            "template_id": template_id,
            "versions": versions_count,
            "styles": styles,
            "generate_english": generate_english,
            "english_versions_count": english_versions_count,
            "industry": industry,
            "experience_level": experience_level,
            "workflow_nodes": workflow_nodes,
            "agent_configs": agent_configs,
        }

        log_business_event("工作流启动", "启动多版本生成工作流", {
            "workflow_type": "generate_versions",
            "input_summary": {
                "has_resume": bool(resume_data),
                "target_role": target_role,
                "template_id": template_id,
                "versions": versions_count,
                "generate_english": generate_english,
            },
        })

        result = await orchestrator.execute_workflow("generate_versions", input_data)

        log_business_event("工作流完成", "多版本生成工作流执行完成", {
            "workflow_type": "generate_versions",
            "result_status": result.get("status", "unknown"),
            "versions_generated": len(result.get("output_data", {}).get("versions", [])),
            "english_versions_generated": len(result.get("output_data", {}).get("english_versions", [])),
            "has_analysis": bool(result.get("output_data", {}).get("analysis")),
            "has_reviews": bool(result.get("output_data", {}).get("reviews")),
        })

        log_business_event("多版本生成-响应", "返回生成结果", {
            "success": True,
            "versions_count": len(result.get("output_data", {}).get("versions", [])),
            "english_versions_count": len(result.get("output_data", {}).get("english_versions", [])),
        })

        return ok(result, "多版本生成完成")
    except Exception as e:
        import traceback
        log_error("多版本生成异常", str(e), e, traceback.format_exc())
        log_business_event("多版本生成失败", f"异常: {str(e)}")
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.post("/api/agents/parse-resume")
async def parse_resume(request: Request):
    try:
        data = await request.json() or {}
        resume_record = data.get("resumeRecord") or {}
        resume_data = data.get("resumeData") or resume_record.get("data") or {}
        raw_text = data.get("rawText") or resume_data.get("rawText") or ""
        template_schema = data.get("templateSchema") or {}
        template_snapshot = data.get("templateSnapshot") or {}
        data_schema = data.get("dataSchema") or (
            template_snapshot.get("dataSchema") if isinstance(template_snapshot, dict) else {}
        ) or template_schema
        style_schema = data.get("styleSchema") or (
            template_snapshot.get("styleSchema") if isinstance(template_snapshot, dict) else {}
        )
        target_role = data.get("targetRole") or ""

        if raw_text:
            resume_data = {**resume_data, "rawText": raw_text}

        if not resume_data and not raw_text:
            return fail(1001, "简历数据或原始文本不能为空")

        log_business_event("简历解析-入参", "接收解析请求", {
            "target_role": target_role,
            "raw_text_length": len(raw_text),
            "template_id": template_snapshot.get("id") if isinstance(template_snapshot, dict) else None,
            "resume_record_keys": list(resume_record.keys()) if isinstance(resume_record, dict) else [],
        })

        from agents.base import AgentType
        writer = orchestrator.agents.get(AgentType.WRITER)
        if writer is None:
            return fail(5000, "Writer agent 未初始化", 500)

        snapshot_style = template_snapshot.get("style") if isinstance(template_snapshot, dict) else {}
        snapshot_config = template_snapshot.get("config") if isinstance(template_snapshot, dict) else {}
        default_style = snapshot_style if isinstance(snapshot_style, dict) else {}

        input_record = {
            "title": resume_record.get("title") or (
                f"AI简历-{template_snapshot.get('name', '默认')}"
                if isinstance(template_snapshot, dict) else "未命名简历"
            ),
            "data": resume_data,
            "style": resume_record.get("style") or default_style,
            "templateId": resume_record.get("templateId") or (
                template_snapshot.get("id") if isinstance(template_snapshot, dict) else None
            ),
            "source": resume_record.get("source") or "workflow",
            "isFavorite": resume_record.get("isFavorite", False),
            "shareToken": resume_record.get("shareToken"),
            "shareExpiresAt": resume_record.get("shareExpiresAt"),
        }

        schema_hint = json.dumps({
            "template": {
                "id": template_snapshot.get("id") if isinstance(template_snapshot, dict) else None,
                "name": template_snapshot.get("name") if isinstance(template_snapshot, dict) else None,
                "config": snapshot_config,
            },
            "dataScaffold": template_schema,
            "dataSchema": data_schema,
            "styleSchema": style_schema,
        }, ensure_ascii=False)[:12000]
        input_hint = json.dumps(input_record, ensure_ascii=False)[:12000]

        system_prompt = """你是简历解析专家。将输入内容解析为与 resumes 表对齐的结构化 JSON。

## 输出字段（除 created_at / updated_at 外均需考虑）
- title: 简历文档名称（列表显示的文件名，不是 basicInfo.name 候选人姓名）
- data: 简历正文，字段名必须使用 dataSchema 中的标准字段：
  basicInfo, professionalSummary, workExperience, education, projectExperience, skills 等
- style: 简历样式 JSON，字段含义见 styleSchema.fields（fontSize, theme, fontFamily, lineHeight, margin, layout 等）
- templateId: 模板 ID
- source: 来源（manual / workflow / template）
- isFavorite: 是否收藏
- shareToken: 分享 token（无则 null）
- shareExpiresAt: 分享过期时间 ISO 字符串（无则 null）

## 重要规则
1. 将 rawText 中的信息拆分到 basicInfo / workExperience / education / projectExperience / skills 等字段
2. professionalSummary 只写 2-4 句个人总结，禁止把整份简历原文粘贴到 professionalSummary
3. 工作经历写入 workExperience（不要用 experience），项目写入 projectExperience（不要用 projects）
4. 若某板块无内容则输出空数组 []，不要编造模板示例数据

只输出 JSON，不要解释。"""

        raw_text_section = ""
        if raw_text:
            raw_text_section = (
                "原始简历全文 rawText（请拆分至各字段，勿整段写入 professionalSummary）：\n"
                f"{raw_text[:12000]}"
            )

        user_prompt = f"""目标职位: {target_role}

模板 dataScaffold（示例结构）、dataSchema（字段说明）与 styleSchema（样式说明）:
{schema_hint}

待解析的 resumes 记录（data 可能仅含 rawText，需结构化拆分）:
{input_hint}

{raw_text_section}

请输出完整 resumes 记录 JSON。"""

        parsed = await asyncio.to_thread(
            writer.call_ai_json,
            system_prompt,
            user_prompt,
            temperature=0.2,
            max_tokens=4096,
        )

        content = parsed
        if isinstance(parsed, dict):
            if parsed.get("data") and isinstance(parsed.get("data"), dict):
                content = parsed
            else:
                versions = parsed.get("versions") or []
                if versions and isinstance(versions[0], dict):
                    v0 = versions[0]
                    inner = v0.get("content") or v0
                    content = {
                        "title": v0.get("resumeTitle") or v0.get("title") or input_record.get("title"),
                        "data": inner if isinstance(inner, dict) else resume_data,
                        "style": v0.get("style") or input_record.get("style"),
                        "templateId": input_record.get("templateId"),
                        "source": input_record.get("source"),
                        "isFavorite": input_record.get("isFavorite", False),
                        "shareToken": input_record.get("shareToken"),
                        "shareExpiresAt": input_record.get("shareExpiresAt"),
                    }
                elif parsed.get("basicInfo") or parsed.get("personalInfo"):
                    content = {**input_record, "data": parsed}

        if isinstance(content, dict) and "data" not in content:
            content = {**input_record, "data": content}

        if isinstance(content, dict) and isinstance(content.get("data"), dict):
            content["data"] = orchestrator._normalize_resume_content_patch(content["data"])

        log_business_event("简历解析-完成", "解析成功", {
            "parsed_title": content.get("title") if isinstance(content, dict) else None,
            "parsed_keys": list(content.keys()) if isinstance(content, dict) else [],
        })

        return {
            "success": True,
            "message": "简历解析完成",
            "data": {
                "output_data": {
                    "parsed": content.get("data") if isinstance(content, dict) else content,
                    "parsedRecord": content,
                }
            },
        }
    except Exception as e:
        import traceback
        log_error("简历解析异常", str(e), e, traceback.format_exc())
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.post("/api/agents/optimize")
async def optimize_resume(request: Request):
    try:
        data = await request.json()
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return fail(1001, "请求数据不能为空")

        resume_data = data.get("resumeData", {})
        optimization_focus = data.get("optimizationFocus", [])
        agent_configs = data.get("agentConfigs", {})

        log_business_event("简历优化-入参", "接收优化请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "optimization_focus": optimization_focus,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False)),
        })

        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return fail(1001, "简历数据不能为空")

        input_data = {
            "resume_data": resume_data,
            "optimization_focus": optimization_focus,
            "base_content": resume_data,
            "agent_configs": agent_configs,
        }

        log_business_event("工作流启动", "启动简历优化工作流", {
            "workflow_type": "optimize_resume",
            "input_summary": {
                "has_resume": bool(resume_data),
                "optimization_focus_count": len(optimization_focus),
            },
        })

        result = await orchestrator.execute_workflow("optimize_resume", input_data)

        log_business_event("工作流完成", "简历优化工作流执行完成", {
            "workflow_type": "optimize_resume",
            "result_status": result.get("status", "unknown"),
            "has_analysis": bool(result.get("output_data", {}).get("analysis")),
            "has_optimized_content": bool(result.get("output_data", {}).get("optimized_content")),
            "has_final_review": bool(result.get("output_data", {}).get("final_review")),
        })

        log_business_event("简历优化-响应", "返回优化结果", {
            "success": True,
            "has_optimized_content": bool(result.get("output_data", {}).get("optimized_content")),
        })

        return ok(result, "简历优化完成")
    except Exception as e:
        import traceback
        log_error("简历优化异常", str(e), e, traceback.format_exc())
        log_business_event("简历优化失败", f"异常: {str(e)}")
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.post("/api/agents/run-node")
async def run_workflow_node(request: Request):
    try:
        data = await request.json() or {}
        node = data.get("node") or {}
        context = data.get("context") or {}

        if not node.get("id"):
            return fail(1001, "节点信息不能为空")

        resume_data = context.get("resumeData") or context.get("resume_data") or {}
        if not resume_data:
            return fail(1001, "resumeData 不能为空")

        log_business_event("工作流节点执行-入参", "接收单节点执行请求", {
            "node_id": node.get("id"),
            "node_type": node.get("type"),
            "agent_type": node.get("agentType"),
            "has_system_prompt": bool((node.get("config") or {}).get("systemPrompt")),
            "model": (node.get("config") or {}).get("model"),
            "temperature": (node.get("config") or {}).get("temperature"),
        })

        node_orchestrator = MultiAgentOrchestrator()
        result = await node_orchestrator.run_workflow_node(node, context)

        log_business_event("工作流节点执行-响应", "单节点执行完成", {
            "node_id": node.get("id"),
            "status": result.get("status"),
            "agent_type": (result.get("output_data") or {}).get("agent_type"),
        })

        return ok(result, "节点执行完成")
    except Exception as e:
        import traceback
        log_error("工作流节点执行异常", str(e), e, traceback.format_exc())
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.post("/api/agents/analyze-match")
async def analyze_match(request: Request):
    try:
        data = await request.json()
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return fail(1001, "请求数据不能为空")

        resume_data = data.get("resumeData", {})
        job_description = data.get("jobDescription", "")
        agent_configs = data.get("agentConfigs", {})

        log_business_event("匹配度分析-入参", "接收分析请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "job_description_length": len(job_description),
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False)),
        })

        if not resume_data or not job_description:
            log_business_event("参数校验失败", "简历数据或职位描述为空", {
                "has_resume": bool(resume_data),
                "has_job_description": bool(job_description),
            })
            return fail(1001, "简历数据和职位描述都不能为空")

        input_data = {
            "resume_data": resume_data,
            "job_description": job_description,
            "agent_configs": agent_configs,
        }

        log_business_event("工作流启动", "启动匹配度分析工作流", {
            "workflow_type": "analyze_match",
            "input_summary": {
                "has_resume": bool(resume_data),
                "job_description_length": len(job_description),
            },
        })

        result = await orchestrator.execute_workflow("analyze_match", input_data)

        match_analysis = result.get("output_data", {}).get("match_analysis", {})
        log_business_event("工作流完成", "匹配度分析工作流执行完成", {
            "workflow_type": "analyze_match",
            "result_status": result.get("status", "unknown"),
            "match_score": match_analysis.get("match_score") if isinstance(match_analysis, dict) else None,
            "match_level": match_analysis.get("match_level") if isinstance(match_analysis, dict) else None,
        })

        log_business_event("匹配度分析-响应", "返回分析结果", {
            "success": True,
            "match_score": match_analysis.get("match_score") if isinstance(match_analysis, dict) else None,
        })

        return ok(result, "匹配度分析完成")
    except Exception as e:
        import traceback
        log_error("匹配度分析异常", str(e), e, traceback.format_exc())
        log_business_event("匹配度分析失败", f"异常: {str(e)}")
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.post("/api/agents/resume-chat-edit")
async def resume_chat_edit(request: Request):
    try:
        data = await request.json() or {}
        message = (data.get("message") or "").strip()
        resume_data = data.get("resumeData") or data.get("resume_data") or {}

        if not message:
            return fail(1001, "message 不能为空")
        if not resume_data:
            return fail(1001, "resumeData 不能为空")

        log_business_event("简历对话编辑-入参", "接收对话编辑请求", {
            "message_length": len(message),
            "history_len": len(data.get("history") or []),
            "model_id": data.get("modelId") or data.get("model_id"),
            "template_id": (data.get("resumeRecord") or {}).get("templateId"),
        })

        chat_orchestrator = MultiAgentOrchestrator()
        result = await chat_orchestrator.run_resume_chat_edit(data)

        if result.get("status") == "failed":
            return fail(
                5000,
                (result.get("output_data") or {}).get("error", "执行失败"),
                500,
            )

        log_business_event("简历对话编辑-响应", "对话编辑完成", {
            "has_patch": bool((result.get("output_data") or {}).get("resumeData")),
        })

        return ok(result, "对话编辑完成")
    except Exception as e:
        import traceback
        log_error("简历对话编辑异常", str(e), e, traceback.format_exc())
        return fail(5000, f"服务器错误: {str(e)}", 500)


ASSISTANT_SYSTEM_PROMPT = """你是「简流」产品的全局 AI 助手，基于检索到的产品功能与简历知识回答问题。
你可以回答：平台怎么用（模板、编辑器、智能执行、工作流、导出设置等），以及简历写作建议。
你还拥有 Skills，可引导用户「根据模板创建简历」或「智能执行创建简历」——会话里会出现可点击按钮，由前端执行。
要求：
1. 优先依据下方【检索到的简流知识】与【可用 Skills】作答；知识中没有的内容要明确说不确定，不要编造功能
2. 回答简洁、友好、可执行；优先使用用户的语言（中文或英文）
3. 用户要创建简历时：说明推荐用哪个 Skill/按钮，不要假装已经创建完成
4. 若用户要“直接改某一份简历内容”，引导其打开编辑器的「AI编辑」页
5. 不要输出与简历/产品无关的危险操作建议
"""


@app.get("/api/agents/assistant-skills")
def assistant_skills():
    return ok({"skills": list_skills()})


@app.post("/api/agents/assistant-chat/stream")
async def assistant_chat_stream(request: Request):
    try:
        data = await request.json() or {}
        message = (data.get("message") or "").strip()
        if not message:
            return fail(1001, "message 不能为空")

        history = data.get("history") or []
        if not isinstance(history, list):
            history = []

        model_id = data.get("modelId") or data.get("model_id")

        knowledge_base.load()
        rag_context, hit_titles = retrieve_for_assistant(knowledge_base, message, top_k=5)
        detected_skills = detect_skills(message)
        system_prompt = (
            ASSISTANT_SYSTEM_PROMPT
            + "\n\n"
            + skill_catalog_prompt()
            + "\n\n"
            + rag_context
        )
        if detected_skills:
            system_prompt += (
                "\n\n【本次检测到的 Skills】\n"
                + "\n".join(
                    f"- {s['id']}: {s.get('label') or s['name']}"
                    for s in detected_skills
                )
                + "\n请在回答中简要说明这些操作按钮的用途。"
            )

        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-12:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = (item.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        log_business_event("全局助手-入参", "接收流式对话请求", {
            "message_length": len(message),
            "history_len": len(history),
            "model_id": model_id,
            "rag_hits": hit_titles,
            "skills": [s["id"] for s in detected_skills],
        })

        client = ZhipuAIClient()

        def event_stream():
            try:
                if detected_skills:
                    skill_payload = json.dumps(
                        {"type": "skill", "skills": detected_skills},
                        ensure_ascii=False,
                    )
                    yield f"data: {skill_payload}\n\n"
                for delta in client.chat_stream(messages, model=model_id):
                    payload = json.dumps({"delta": delta}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as stream_err:
                err_payload = json.dumps({"error": str(stream_err)}, ensure_ascii=False)
                yield f"data: {err_payload}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        import traceback
        log_error("全局助手流式对话失败", str(e), e, traceback.format_exc())
        return fail(5000, str(e), 500)


@app.post("/api/agents/translate")
async def translate_resume(request: Request):
    try:
        data = await request.json()
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return fail(1001, "请求数据不能为空")

        resume_data = data.get("resumeData", {})
        target_language = data.get("targetLanguage", "en")

        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return fail(1001, "简历数据不能为空")

        log_business_event("简历翻译-入参", "接收翻译请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "target_language": target_language,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False)),
        })

        input_data = {
            "resume_data": resume_data,
            "target_language": target_language,
        }

        log_business_event("工作流启动", "启动简历翻译工作流", {
            "workflow_type": "translate",
            "target_language": target_language,
        })

        result = await orchestrator.execute_workflow("translate", input_data)

        log_business_event("工作流完成", "简历翻译工作流执行完成", {
            "workflow_type": "translate",
            "result_status": result.get("status", "unknown"),
            "has_translated": bool(result.get("output_data", {}).get("translated")),
        })

        log_business_event("简历翻译-响应", "返回翻译结果", {
            "success": True,
            "has_translated": bool(result.get("output_data", {}).get("translated")),
        })

        return ok(result, "简历翻译完成")
    except Exception as e:
        import traceback
        log_error("简历翻译异常", str(e), e, traceback.format_exc())
        log_business_event("简历翻译失败", f"异常: {str(e)}")
        return fail(5000, f"服务器错误: {str(e)}", 500)


@app.get("/api/agents/workflow-status/{task_id}")
def get_workflow_status(task_id: str):
    log_business_event("状态查询", f"查询工作流状态: {task_id}")
    result = {
        "success": True,
        "data": {
            "task_id": task_id,
            "status": "completed",
            "message": "任务已完成",
        },
    }
    log_business_event("状态查询-响应", f"返回工作流状态: {task_id}", {"status": "completed"})
    return result


# ==================== 启动服务 ====================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="简流 AI Agent 服务 (FastAPI)")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="开发模式（更详细启动日志；使用 uvicorn）",
    )
    parser.add_argument("--port", type=int, default=None, help="监听端口，默认读 .env API_PORT")
    args = parser.parse_args()

    host = config.get("API_HOST", "0.0.0.0") or "0.0.0.0"
    port = int(args.port or config.get("API_PORT", 5001))
    debug = args.dev or os.getenv("API_DEBUG", "false").lower() == "true"

    ai_config.print_config()

    is_valid, error_msg = ai_config.validate_config()
    if not is_valid:
        logger.error(f"配置验证失败: {error_msg}")
        raise SystemExit(1)

    base_url = f"http://localhost:{port}"
    service_urls = [
        ("健康检查", f"{base_url}/health"),
        ("能力列表", f"{base_url}/api/agents/capabilities"),
        ("多版本生成", f"{base_url}/api/agents/generate-versions"),
        ("简历优化", f"{base_url}/api/agents/optimize"),
        ("匹配度分析", f"{base_url}/api/agents/analyze-match"),
        ("简历解析", f"{base_url}/api/agents/parse-resume"),
        ("简历翻译", f"{base_url}/api/agents/translate"),
        ("对话式编辑", f"{base_url}/api/agents/resume-chat-edit"),
        ("全局助手流式", f"{base_url}/api/agents/assistant-chat/stream"),
        ("助手 Skills", f"{base_url}/api/agents/assistant-skills"),
        ("工作流节点", f"{base_url}/api/agents/run-node"),
    ]

    logger.info("=" * 60)
    logger.info("启动多智能体简历服务 (FastAPI)")
    logger.info("=" * 60)
    logger.info(f"服务名:     {SERVICE_NAME}")
    logger.info(f"服务根地址: {base_url}")
    logger.info(f"监听地址:   http://{host}:{port}")
    logger.info("--- 服务地址 ---")
    for name, url in service_urls:
        logger.info(f"  {name}: {url}")
    logger.info(f"Nest 代理:  backend-resume-nest /api/multiagent/* -> {base_url}")
    logger.info(f"端口: {port}")
    logger.info(f"开发模式: {debug}")
    logger.info("ASGI: uvicorn")
    logger.info(f"模型配置: {ai_config.catalog_path}")
    logger.info(f"QPS 限制: {ai_config.AI_QPS_LIMIT}")
    logger.info(f"日志目录: {LOG_DIR}")
    logger.info("=" * 60)

    business_logger.info(
        "服务启动 | 端口=%d | QPS限制=%d | catalog=%s | asgi=uvicorn | service=%s",
        port,
        ai_config.AI_QPS_LIMIT,
        ai_config.catalog_path,
        SERVICE_NAME,
    )

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="debug" if debug else "info",
        timeout_keep_alive=600,
    )
