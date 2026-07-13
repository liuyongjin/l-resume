"""
简历 RAG 知识库
基于关键词匹配的检索增强生成模块，为 Agent 提供行业特定的简历知识
"""

import json
import logging
import re
from typing import Dict, List, Any, Optional
from pathlib import Path

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)

# 知识库目录
KNOWLEDGE_DIR = Path(__file__).parent / "data"


class ResumeKnowledgeBase:
    """简历知识库 - 提供行业模板、关键词、最佳实践等检索"""

    def __init__(self):
        self._templates: Dict[str, Dict] = {}
        self._industry_keywords: Dict[str, List[str]] = {}
        self._action_verbs: Dict[str, List[str]] = {}
        self._best_practices: Dict[str, str] = {}
        self._role_examples: Dict[str, List[Dict]] = {}
        self._loaded = False

    def load(self) -> None:
        """加载知识库"""
        if self._loaded:
            return
        try:
            self._load_templates()
            self._load_keywords()
            self._load_best_practices()
            self._loaded = True
            logger.info(f"知识库加载完成: {len(self._templates)} 个行业模板, {len(self._industry_keywords)} 组关键词")
        except Exception as e:
            logger.error(f"知识库加载失败: {e}")

    def _load_templates(self) -> None:
        """加载内置行业模板"""
        self._templates = {
            "software_engineer": {
                "sections": ["专业技术栈", "项目经验", "开源贡献", "技术博客"],
                "emphasis": "突出技术深度和广度，量化项目影响（用户量、性能提升百分比）",
                "summary_template": "拥有{N}年经验的{title}，精通{tech_stack}。主导过{project_count}个核心项目，累计服务{user_scale}用户。"
            },
            "product_manager": {
                "sections": ["产品规划", "需求分析", "项目推进", "数据驱动决策"],
                "emphasis": "突出产品思维和数据驱动能力，用数据说明产品成果",
                "summary_template": "{N}年产品经验，擅长{domains}。主导过{product_count}款产品从0到1，其中{top_product}实现{metric}增长。"
            },
            "data_scientist": {
                "sections": ["算法模型", "数据分析", "业务洞察", "工程落地"],
                "emphasis": "突出算法能力和业务价值的结合，量化模型效果",
                "summary_template": "专注于{domains}的数据科学家，精通{tech_stack}。主导的{model_name}模型提升业务指标{improvement}%。"
            },
            "frontend_engineer": {
                "sections": ["前端架构", "组件开发", "性能优化", "工程化"],
                "emphasis": "突出前端架构能力和用户体验思维",
                "summary_template": "{N}年前端开发经验，精通{framework}。负责过{project_count}+项目的架构设计与性能优化。"
            },
            "backend_engineer": {
                "sections": ["系统架构", "分布式系统", "数据库设计", "性能优化"],
                "emphasis": "突出系统设计能力和高并发处理经验",
                "summary_template": "{N}年后端开发经验，专注{domains}方向。设计实现的{system_name}系统支撑{QPS}级并发。"
            },
            "fullstack_engineer": {
                "sections": ["全栈项目", "前后端架构", "DevOps", "团队协作"],
                "emphasis": "突出全栈能力和端到端交付经验",
                "summary_template": "全栈工程师，{N}年经验。独立完成过{project_count}+项目从前端到部署的全流程开发。"
            },
            "ui_designer": {
                "sections": ["设计系统", "用户体验", "交互设计", "视觉设计"],
                "emphasis": "突出设计思维和用户研究成果",
                "summary_template": "拥有{N}年UI/UX设计经验，主导过{product_count}+产品的设计系统搭建，提升用户满意度{improvement}%。"
            },
            "devops_engineer": {
                "sections": ["CI/CD", "容器编排", "监控告警", "基础设施"],
                "emphasis": "突出自动化能力和运维效率提升",
                "summary_template": "DevOps工程师，{N}年经验。构建的CI/CD流水线将部署效率提升{improvement}倍。"
            },
            "general": {
                "sections": ["专业技能", "工作经验", "项目成果", "教育背景"],
                "emphasis": "突出核心能力和量化成果",
                "summary_template": "拥有{N}年{title}经验，擅长{skills}。曾主导{achievement}。"
            }
        }

    def _load_keywords(self) -> None:
        """加载行业关键词"""
        self._industry_keywords = {
            "互联网": ["敏捷开发", "微服务", "高并发", "分布式", "云计算", "大数据", "AI", "机器学习", "DevOps", "CI/CD"],
            "金融": ["风控", "量化交易", "合规", "清算", "支付", "信贷", "保险", "投资", "区块链", "监管科技"],
            "医疗": ["电子病历", "医疗影像", "临床决策", "健康管理", "药物研发", "基因测序", "远程医疗", "医联体"],
            "教育": ["在线教育", "智能辅导", "学习分析", "知识图谱", "自适应学习", "MOOC", "LMS"],
            "电商": ["用户增长", "转化率", "供应链", "仓储物流", "商品推荐", "营销自动化", "会员体系", "私域流量"],
            "游戏": ["游戏引擎", "实时渲染", "物理引擎", "游戏AI", "匹配系统", "反外挂", "帧同步", "状态同步"],
            "汽车": ["自动驾驶", "车联网", "智能座舱", "ADAS", "V2X", "OTA升级", "电池管理", "路径规划"],
            "制造": ["工业4.0", "数字孪生", "预测性维护", "MES", "PLC", "SCADA", "物联网", "智能制造"],
            "硬件": ["嵌入式", "FPGA", "PCB设计", "射频", "功耗优化", "固件", "驱动开发", "RTOS"],
            "传媒": ["推荐算法", "内容分发", "自然语言处理(NLP)", "视频处理(FFmpeg)", "实时流媒体(RTMP/HLS)", "CDN", "AIGC"],
        }

        self._action_verbs = {
            "chinese": [
                "主导", "负责", "设计", "开发", "优化", "重构", "搭建", "落地",
                "推动", "制定", "分析", "挖掘", "实现", "改进", "协调", "管理",
                "构建", "部署", "维护", "监控", "调研", "创新", "攻克", "提升",
                "降低", "缩短", "增长", "突破", "引领", "打造", "赋能"
            ],
            "english": [
                "Led", "Designed", "Developed", "Architected", "Optimized",
                "Implemented", "Spearheaded", "Orchestrated", "Engineered",
                "Accelerated", "Transformed", "Streamlined", "Automated",
                "Pioneered", "Launched", "Drove", "Delivered", "Managed",
                "Reduced", "Increased", "Achieved", "Established", "Directed"
            ]
        }

    def _load_best_practices(self) -> None:
        """加载简历写作最佳实践"""
        self._best_practices = {
            "quantify": "每个工作经历至少包含一个量化成果（数字、百分比、规模）",
            "star_method": "使用STAR法则（情境-任务-行动-结果）描述项目经验",
            "keyword_optimization": "在简历中自然融入目标职位描述中的关键词",
            "length_control": "工作经历描述控制在3-5条要点，每条1-2行",
            "action_verb_start": "每个要点以行为动词开头",
            "customization": "每次投递根据目标职位定制简历内容",
            "ats_friendly": "使用标准字体和格式，确保ATS系统可解析",
            "reverse_chronological": "经历按时间倒序排列",
        }

    def get_template_definition(self, template_id: str) -> Dict:
        """获取7个默认模板的关键节点信息

        支持前端 themeKey 与知识库 template_id 的双向映射
        """
        theme_key_map = {
            "frontendEngineer": "classic",
            "modern": "modern",
            "creative": "creative",
            "data": "data",
            "amber": "amber",
            "purple": "purple",
            "developer": "developer",
        }
        template_id = theme_key_map.get(template_id, template_id)
        template_definitions = {
            "classic": {
                "name": "极简专业",
                "target_role": "前端工程师/全栈工程师",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "工作经历",
                    "education": "教育背景",
                    "skills": "专业技能",
                    "projects": "项目经验",
                },
                "emphasis": "突出技术深度和广度，量化项目影响（用户量、性能提升百分比）",
                "summary_prompt": "简要概述技术背景、核心能力和职业亮点，突出N年经验和技术栈",
                "experience_prompt": "按时间倒序，每段经历包含公司、职位、时间、描述和关键成就",
                "education_prompt": "包含学校、学历、专业、GPA（如果优秀）",
                "skills_prompt": "列举核心技术技能，使用简洁标签展示",
                "projects_prompt": "突出项目名称、担任角色、项目描述和技术栈",
            },
            "modern": {
                "name": "应届大学生",
                "target_role": "应届毕业生",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "实习/校园经历",
                    "education": "教育背景",
                    "skills": "专业技能",
                    "projects": "项目经验",
                },
                "emphasis": "突出实习经历、校园活动、项目实践和学习能力，弥补工作经验不足",
                "summary_prompt": "应届生身份，突出专业背景、学习能力、实习经历和职业期望",
                "experience_prompt": "包含实习经历和校园工作经历（如学生会、社团），描述具体职责和成果",
                "education_prompt": "突出学校、专业、GPA和在校荣誉，可包含主修课程",
                "skills_prompt": "列举专业相关技能和工具，展示学习潜力",
                "projects_prompt": "突出毕设、课程项目或个人项目，展示动手能力",
            },
            "creative": {
                "name": "创意设计师",
                "target_role": "UI/UX设计师",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "工作经历",
                    "education": "教育背景",
                    "skills": "设计技能",
                    "projects": "项目/作品集",
                },
                "emphasis": "突出设计思维、品牌视觉、作品质量和创新理念",
                "summary_prompt": "概述设计风格、擅长领域和设计理念，突出代表作品",
                "experience_prompt": "描述负责的设计项目，量化用户满意度提升、设计规范覆盖面等",
                "skills_prompt": "突出设计工具（Figma/Sketch等）和设计方法论",
                "projects_prompt": "重点展示作品集项目，描述设计思路和成果",
            },
            "data": {
                "name": "数据分析师",
                "target_role": "数据分析师",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "工作经历",
                    "education": "教育背景",
                    "skills": "技术技能",
                    "projects": "项目经验",
                },
                "emphasis": "突出数据分析能力、量化成果和业务洞察，用数字说话",
                "summary_prompt": "概述数据分析经验、技术栈和业务影响力，突出量化成果",
                "experience_prompt": "每段经历量化业务价值（如提升多少效率、带来多少增量收入）",
                "skills_prompt": "突出分析工具（Python/SQL/Tableau）和大数据技术",
                "projects_prompt": "突出数据项目的方法论、模型效果和业务影响",
            },
            "amber": {
                "name": "产品经理",
                "target_role": "产品经理",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "工作经历",
                    "education": "教育背景",
                    "skills": "核心能力",
                    "projects": "项目经验",
                },
                "emphasis": "突出产品思维、项目管理能力和团队协调能力",
                "summary_prompt": "概述产品经验年限、擅长领域和代表性产品成果",
                "experience_prompt": "描述负责的产品线，说明产品规模和业务增长指标",
                "skills_prompt": "突出需求分析、项目管理、数据分析等核心能力",
                "projects_prompt": "突出0到1的产品项目，说明产品效果和数据",
            },
            "purple": {
                "name": "学术研究者",
                "target_role": "研究员/博士后",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "研究经历",
                    "education": "教育背景",
                    "skills": "研究技能",
                    "projects": "科研项目",
                },
                "emphasis": "突出学术成果（论文、项目）、研究方向和学术影响力",
                "summary_prompt": "概述研究方向、发表论文情况和主持项目经历",
                "experience_prompt": "详细描述研究经历，列出发表论文（期刊、会议）",
                "education_prompt": "突出学历层次和学校声望，强调学术背景",
                "skills_prompt": "突出研究工具、编程能力和实验技能",
                "projects_prompt": "突出科研项目的创新性和学术贡献",
            },
            "developer": {
                "name": "程序开发",
                "target_role": "全栈开发工程师",
                "sections": ["basicInfo", "summary", "experience", "education", "skills", "projects"],
                "section_labels": {
                    "basicInfo": "基本信息",
                    "summary": "个人总结",
                    "experience": "工作经历",
                    "education": "教育背景",
                    "skills": "技术栈",
                    "projects": "项目/开源",
                },
                "emphasis": "突出技术栈深度、开源贡献和工程能力",
                "summary_prompt": "概述技术栈、项目经验和开源贡献，突出技术热情",
                "experience_prompt": "描述技术方案设计、系统架构和性能优化成果",
                "skills_prompt": "详细列出编程语言、框架和工具",
                "projects_prompt": "突出开源项目和复杂工程项目的技术实现",
            },
        }
        return template_definitions.get(template_id, template_definitions["classic"])

    def get_template(self, industry: str = None) -> Dict:
        """获取行业模板"""
        self.load()
        industry = (industry or "general").lower().replace(" ", "_")
        return self._templates.get(industry, self._templates["general"])

    def get_keywords(self, industry: str) -> List[str]:
        """获取行业关键词"""
        self.load()
        return self._industry_keywords.get(industry, [])

    def get_action_verbs(self, lang: str = "chinese") -> List[str]:
        """获取行为动词列表"""
        self.load()
        return self._action_verbs.get(lang, self._action_verbs["chinese"])

    def get_best_practices(self) -> Dict[str, str]:
        """获取最佳实践"""
        self.load()
        return self._best_practices

    def retrieve_context(self, target_position: str, industry: str, experience_level: str) -> str:
        """检索与目标职位相关的知识上下文"""

        self.load()
        context_parts = []

        # 1. 行业模板
        template = self.get_template(industry)
        context_parts.append(f"【行业模板 - {industry or '通用'}】")
        context_parts.append(f"建议板块: {', '.join(template.get('sections', []))}")
        context_parts.append(f"写作重点: {template.get('emphasis', '')}")
        context_parts.append(f"摘要模板: {template.get('summary_template', '')}")

        # 2. 行业关键词
        keywords = self.get_keywords(industry)
        if keywords:
            context_parts.append(f"\n【{industry}行业核心关键词】")
            context_parts.append(", ".join(keywords[:15]))

        # 3. 行为动词
        verbs = self.get_action_verbs("chinese")
        context_parts.append(f"\n【推荐行为动词】")
        context_parts.append(", ".join(verbs[:10]))

        # 4. 最佳实践
        context_parts.append(f"\n【简历写作最佳实践】")
        for key, value in self._best_practices.items():
            context_parts.append(f"- {value}")

        # 5. 经验级别建议
        level_advice = {
            "entry": "突出学习能力、实习经验、项目实践、技术热情",
            "mid": "突出独立负责的项目、团队协作、技术深度、业务理解",
            "senior": "突出架构设计、技术决策、团队管理、业务影响力",
            "lead": "突出战略规划、团队建设、跨部门协作、技术愿景",
        }
        advice = level_advice.get(experience_level, level_advice["mid"])
        context_parts.append(f"\n【{experience_level}级别写作建议】")
        context_parts.append(advice)

        return "\n".join(context_parts)


# 全局知识库实例
knowledge_base = ResumeKnowledgeBase()