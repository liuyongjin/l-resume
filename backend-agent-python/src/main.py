import os
import sys
import json
import logging
import time
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS

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

# 使用配置类
from config import ai_config

config = {
    "ZHIPU_API_KEY": ai_config.ZHIPU_API_KEY,
    "ZHIPU_MODEL": ai_config.ZHIPU_MODEL,
    "ZHIPU_API_URL": ai_config.ZHIPU_API_URL,
    "AI_QPS_LIMIT": ai_config.AI_QPS_LIMIT,
    "API_PORT": os.getenv("API_PORT", "5001"),
}

# ==================== Flask 应用 ====================

app = Flask(__name__)
CORS(app)

orchestrator = MultiAgentOrchestrator(config)

# ==================== 日志装饰器和工具函数 ====================

def generate_request_id():
    """生成请求ID"""
    return str(uuid.uuid4())[:8]

def log_request():
    """记录请求日志"""
    g.request_id = generate_request_id()
    g.start_time = time.time()
    
    # 记录请求信息
    request_data = {
        "request_id": g.request_id,
        "method": request.method,
        "path": request.path,
        "ip": request.remote_addr,
        "headers": dict(request.headers),
        "body": request.get_json(silent=True) if request.is_json else None,
        "query_params": dict(request.args),
        "timestamp": datetime.now().isoformat()
    }
    
    api_logger.info(f"[REQUEST] {json.dumps(request_data, ensure_ascii=False, indent=2)}")
    business_logger.info(f"[请求开始] ID={g.request_id} | {request.method} {request.path} | IP={request.remote_addr}")
    
    return request_data

def log_response(response):
    """记录响应日志"""
    duration = time.time() - g.start_time
    
    # 获取响应数据
    response_data = None
    try:
        if hasattr(response, 'get_json'):
            response_data = response.get_json(silent=True)
        elif isinstance(response, tuple):
            response_data = response[0].get_json(silent=True) if hasattr(response[0], 'get_json') else str(response[0])
        else:
            response_data = str(response)
    except Exception as e:
        response_data = f"无法解析响应: {str(e)}"
    
    log_data = {
        "request_id": g.request_id,
        "status_code": response[1] if isinstance(response, tuple) else response.status_code,
        "duration_ms": round(duration * 1000, 2),
        "response": response_data,
        "timestamp": datetime.now().isoformat()
    }
    
    api_logger.info(f"[RESPONSE] {json.dumps(log_data, ensure_ascii=False, indent=2)}")
    business_logger.info(f"[请求结束] ID={g.request_id} | 状态={response[1] if isinstance(response, tuple) else response.status_code} | 耗时={round(duration * 1000, 2)}ms")
    
    return response

def log_business_event(event_type, message, data=None):
    """记录业务事件日志"""
    log_data = {
        "request_id": g.get('request_id', 'N/A'),
        "event_type": event_type,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    business_logger.info(f"[业务事件] {event_type} | {message} | 数据={json.dumps(data, ensure_ascii=False) if data else 'N/A'}")

def log_error(error_type, message, exception=None, stack_trace=None):
    """记录错误日志"""
    error_data = {
        "request_id": g.get('request_id', 'N/A'),
        "error_type": error_type,
        "message": message,
        "exception": str(exception) if exception else None,
        "stack_trace": stack_trace,
        "timestamp": datetime.now().isoformat()
    }
    error_logger.error(f"[错误] {error_type} | {message} | 异常={str(exception) if exception else 'N/A'}")
    business_logger.error(f"[业务错误] ID={g.get('request_id', 'N/A')} | {error_type} | {message}")

# ==================== 请求中间件 ====================

@app.before_request
def before_request():
    """请求前处理"""
    log_request()

@app.after_request
def after_request(response):
    """请求后处理"""
    return log_response(response)

@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理"""
    import traceback
    log_error("全局异常", str(e), e, traceback.format_exc())
    return jsonify({
        "success": False,
        "error": {"code": 5000, "message": f"服务器内部错误: {str(e)}"}
    }), 500

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

@app.route("/health", methods=["GET"])
def health_check():
    """健康检查接口"""
    log_business_event("健康检查", "服务健康检查请求")
    
    result = {
        "status": "ok",
        "service": "backend-agent-python",
        "version": "1.0.0",
        "catalog_path": ai_config.catalog_path,
        "api_key_configured": bool(ai_config.ZHIPU_API_KEY),
        "default_model": ai_config.normalize_resume_model(ai_config.ZHIPU_MODEL),
        "supported_models": ai_config.ZHIPU_SUPPORTED_MODELS,
        "api_url": ai_config.ZHIPU_API_URL,
        "log_directory": str(LOG_DIR),
        "uptime": datetime.now().isoformat()
    }
    
    log_business_event("健康检查", "服务状态正常", {"api_key_configured": result["api_key_configured"]})
    return jsonify(result)


@app.route("/api/agents/capabilities", methods=["GET"])
def get_capabilities():
    """获取智能体能力列表"""
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
                    "templates": ["classic", "modern", "creative", "data", "amber", "purple", "developer"]
                },
                {
                    "type": "optimize_resume",
                    "name": "简历优化",
                    "description": "分析并优化现有简历内容",
                    "agents": ["analyzer", "optimizer", "reviewer"],
                    "estimated_time": "20-40秒"
                },
                {
                    "type": "analyze_match",
                    "name": "匹配度分析",
                    "description": "分析简历与目标职位的匹配程度",
                    "agents": ["analyzer"],
                    "estimated_time": "10-20秒"
                },
                {
                    "type": "translate",
                    "name": "简历翻译",
                    "description": "将中文简历翻译成英文简历",
                    "agents": ["translator"],
                    "estimated_time": "10-30秒"
                }
            ],
            "agent_types": [
                {"type": "planner", "role": "规划者", "description": "制定任务执行计划"},
                {"type": "analyzer", "role": "分析者", "description": "分析简历内容和职位要求"},
                {"type": "writer", "role": "撰写者", "description": "生成和撰写简历内容（支持模板适配）"},
                {"type": "reviewer", "role": "审核者", "description": "审核和评估简历质量"},
                {"type": "optimizer", "role": "优化者", "description": "优化和改进简历内容"},
                {"type": "translator", "role": "翻译者", "description": "翻译简历内容"}
            ]
        }
    }
    
    log_business_event("能力查询", "返回能力列表", {"workflows_count": len(capabilities["data"]["workflows"])})
    return jsonify(capabilities)


@app.route("/api/agents/generate-versions", methods=["POST"])
def generate_versions():
    """多版本生成接口（支持模板适配和中英文双语生成）"""
    try:
        data = request.get_json()
        
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "请求数据不能为空"}
            }), 400
        
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
        
        # 记录入参详情
        log_business_event("多版本生成-入参", "接收生成请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "target_role": target_role,
            "template_id": template_id,
            "versions_count": versions_count,
            "styles": styles,
            "generate_english": generate_english,
            "english_versions_count": english_versions_count,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False))
        })
        
        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "简历数据不能为空"}
            }), 400
        
        # 构建输入数据
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
            }
        })
        
        # 执行工作流
        result = asyncio.run(orchestrator.execute_workflow("generate_versions", input_data))
        
        # 记录工作流结果
        log_business_event("工作流完成", "多版本生成工作流执行完成", {
            "workflow_type": "generate_versions",
            "result_status": result.get("status", "unknown"),
            "versions_generated": len(result.get("output_data", {}).get("versions", [])),
            "english_versions_generated": len(result.get("output_data", {}).get("english_versions", [])),
            "has_analysis": bool(result.get("output_data", {}).get("analysis")),
            "has_reviews": bool(result.get("output_data", {}).get("reviews"))
        })
        
        response_data = {
            "success": True,
            "message": "多版本生成完成",
            "data": result
        }
        
        log_business_event("多版本生成-响应", "返回生成结果", {
            "success": True,
            "versions_count": len(result.get("output_data", {}).get("versions", [])),
            "english_versions_count": len(result.get("output_data", {}).get("english_versions", [])),
        })
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        log_error("多版本生成异常", str(e), e, traceback.format_exc())
        log_business_event("多版本生成失败", f"异常: {str(e)}")
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"}
        }), 500


@app.route("/api/agents/parse-resume", methods=["POST"])
def parse_resume():
    """解析上传简历为 resumes 表完整字段 + 模板 schema 结构化 data"""
    try:
        data = request.get_json() or {}
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
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "简历数据或原始文本不能为空"}
            }), 400

        log_business_event("简历解析-入参", "接收解析请求", {
            "target_role": target_role,
            "raw_text_length": len(raw_text),
            "template_id": template_snapshot.get("id") if isinstance(template_snapshot, dict) else None,
            "resume_record_keys": list(resume_record.keys()) if isinstance(resume_record, dict) else [],
        })

        from agents.base import AgentType
        writer = orchestrator.agents.get(AgentType.WRITER)

        snapshot_style = template_snapshot.get("style") if isinstance(template_snapshot, dict) else {}
        snapshot_config = template_snapshot.get("config") if isinstance(template_snapshot, dict) else {}
        default_style = snapshot_style if isinstance(snapshot_style, dict) else {}

        input_record = {
            "title": resume_record.get("title") or f"AI简历-{template_snapshot.get('name', '默认')}" if isinstance(template_snapshot, dict) else "未命名简历",
            "data": resume_data,
            "style": resume_record.get("style") or default_style,
            "templateId": resume_record.get("templateId") or (template_snapshot.get("id") if isinstance(template_snapshot, dict) else None),
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

        parsed = writer.call_ai_json(
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

        return jsonify({
            "success": True,
            "message": "简历解析完成",
            "data": {
                "output_data": {
                    "parsed": content.get("data") if isinstance(content, dict) else content,
                    "parsedRecord": content,
                }
            }
        })
    except Exception as e:
        import traceback
        log_error("简历解析异常", str(e), e, traceback.format_exc())
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"}
        }), 500


@app.route("/api/agents/optimize", methods=["POST"])
def optimize_resume():
    """简历优化接口"""
    try:
        data = request.get_json()
        
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "请求数据不能为空"}
            }), 400
        
        resume_data = data.get("resumeData", {})
        optimization_focus = data.get("optimizationFocus", [])
        agent_configs = data.get("agentConfigs", {})
        
        # 记录入参详情
        log_business_event("简历优化-入参", "接收优化请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "optimization_focus": optimization_focus,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False))
        })
        
        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "简历数据不能为空"}
            }), 400
        
        # 构建输入数据
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
                "optimization_focus_count": len(optimization_focus)
            }
        })
        
        # 执行工作流
        result = asyncio.run(orchestrator.execute_workflow("optimize_resume", input_data))
        
        # 记录工作流结果
        log_business_event("工作流完成", "简历优化工作流执行完成", {
            "workflow_type": "optimize_resume",
            "result_status": result.get("status", "unknown"),
            "has_analysis": bool(result.get("output_data", {}).get("analysis")),
            "has_optimized_content": bool(result.get("output_data", {}).get("optimized_content")),
            "has_final_review": bool(result.get("output_data", {}).get("final_review"))
        })
        
        response_data = {
            "success": True,
            "message": "简历优化完成",
            "data": result
        }
        
        log_business_event("简历优化-响应", "返回优化结果", {
            "success": True,
            "has_optimized_content": bool(result.get("output_data", {}).get("optimized_content"))
        })
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        log_error("简历优化异常", str(e), e, traceback.format_exc())
        log_business_event("简历优化失败", f"异常: {str(e)}")
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"}
        }), 500


@app.route("/api/agents/run-node", methods=["POST"])
def run_workflow_node():
    """按工作流设计器节点配置执行单个智能体节点"""
    try:
        data = request.get_json() or {}
        node = data.get("node") or {}
        context = data.get("context") or {}

        if not node.get("id"):
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "节点信息不能为空"},
            }), 400

        resume_data = context.get("resumeData") or context.get("resume_data") or {}
        if not resume_data:
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "resumeData 不能为空"},
            }), 400

        log_business_event("工作流节点执行-入参", "接收单节点执行请求", {
            "node_id": node.get("id"),
            "node_type": node.get("type"),
            "agent_type": node.get("agentType"),
            "has_system_prompt": bool((node.get("config") or {}).get("systemPrompt")),
            "model": (node.get("config") or {}).get("model"),
            "temperature": (node.get("config") or {}).get("temperature"),
        })

        node_orchestrator = MultiAgentOrchestrator()
        result = asyncio.run(node_orchestrator.run_workflow_node(node, context))

        log_business_event("工作流节点执行-响应", "单节点执行完成", {
            "node_id": node.get("id"),
            "status": result.get("status"),
            "agent_type": (result.get("output_data") or {}).get("agent_type"),
        })

        return jsonify({"success": True, "message": "节点执行完成", "data": result})
    except Exception as e:
        import traceback
        log_error("工作流节点执行异常", str(e), e, traceback.format_exc())
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"},
        }), 500


@app.route("/api/agents/analyze-match", methods=["POST"])
def analyze_match():
    """匹配度分析接口"""
    try:
        data = request.get_json()
        
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "请求数据不能为空"}
            }), 400
        
        resume_data = data.get("resumeData", {})
        job_description = data.get("jobDescription", "")
        agent_configs = data.get("agentConfigs", {})
        
        # 记录入参详情
        log_business_event("匹配度分析-入参", "接收分析请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "job_description_length": len(job_description),
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False))
        })
        
        if not resume_data or not job_description:
            log_business_event("参数校验失败", "简历数据或职位描述为空", {
                "has_resume": bool(resume_data),
                "has_job_description": bool(job_description)
            })
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "简历数据和职位描述都不能为空"}
            }), 400
        
        # 构建输入数据
        input_data = {
            "resume_data": resume_data,
            "job_description": job_description,
            "agent_configs": agent_configs,
        }
        
        log_business_event("工作流启动", "启动匹配度分析工作流", {
            "workflow_type": "analyze_match",
            "input_summary": {
                "has_resume": bool(resume_data),
                "job_description_length": len(job_description)
            }
        })
        
        # 执行工作流
        result = asyncio.run(orchestrator.execute_workflow("analyze_match", input_data))
        
        # 记录工作流结果
        match_analysis = result.get("output_data", {}).get("match_analysis", {})
        log_business_event("工作流完成", "匹配度分析工作流执行完成", {
            "workflow_type": "analyze_match",
            "result_status": result.get("status", "unknown"),
            "match_score": match_analysis.get("match_score") if isinstance(match_analysis, dict) else None,
            "match_level": match_analysis.get("match_level") if isinstance(match_analysis, dict) else None
        })
        
        response_data = {
            "success": True,
            "message": "匹配度分析完成",
            "data": result
        }
        
        log_business_event("匹配度分析-响应", "返回分析结果", {
            "success": True,
            "match_score": match_analysis.get("match_score") if isinstance(match_analysis, dict) else None
        })
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        log_error("匹配度分析异常", str(e), e, traceback.format_exc())
        log_business_event("匹配度分析失败", f"异常: {str(e)}")
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"}
        }), 500


@app.route("/api/agents/resume-chat-edit", methods=["POST"])
def resume_chat_edit():
    """简历编辑器 AI 对话修改"""
    try:
        data = request.get_json() or {}

        message = (data.get("message") or "").strip()
        resume_data = data.get("resumeData") or data.get("resume_data") or {}

        if not message:
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "message 不能为空"},
            }), 400

        if not resume_data:
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "resumeData 不能为空"},
            }), 400

        log_business_event("简历对话编辑-入参", "接收对话编辑请求", {
            "message_length": len(message),
            "history_len": len(data.get("history") or []),
            "model_id": data.get("modelId") or data.get("model_id"),
            "template_id": (data.get("resumeRecord") or {}).get("templateId"),
        })

        orchestrator = MultiAgentOrchestrator()
        result = asyncio.run(orchestrator.run_resume_chat_edit(data))

        if result.get("status") == "failed":
            return jsonify({
                "success": False,
                "error": {"code": 5000, "message": (result.get("output_data") or {}).get("error", "执行失败")},
            }), 500

        log_business_event("简历对话编辑-响应", "对话编辑完成", {
            "has_patch": bool((result.get("output_data") or {}).get("resumeData")),
        })

        return jsonify({
            "success": True,
            "message": "对话编辑完成",
            "data": result,
        })
    except Exception as e:
        import traceback
        log_error("简历对话编辑异常", str(e), e, traceback.format_exc())
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"},
        }), 500


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


@app.route("/api/agents/assistant-skills", methods=["GET"])
def assistant_skills():
    """列出全局助手可用 Skills"""
    return jsonify({
        "success": True,
        "data": {
            "skills": list_skills(),
        },
    })


@app.route("/api/agents/assistant-chat/stream", methods=["POST"])
def assistant_chat_stream():
    """全局 AI 助手流式对话（SSE + RAG + Skills）"""
    try:
        data = request.get_json() or {}
        message = (data.get("message") or "").strip()
        if not message:
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "message 不能为空"},
            }), 400

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

        # 注意：不要设置 Connection 等 hop-by-hop 头，Waitress(WSGI) 会直接 500
        return Response(
            event_stream(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        import traceback
        log_error("全局助手流式对话失败", str(e), e, traceback.format_exc())
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": str(e)},
        }), 500


@app.route("/api/agents/translate", methods=["POST"])
def translate_resume():
    """简历翻译接口"""
    try:
        data = request.get_json()
        
        if not data:
            log_business_event("参数校验失败", "请求数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "请求数据不能为空"}
            }), 400
        
        resume_data = data.get("resumeData", {})
        target_language = data.get("targetLanguage", "en")
        
        if not resume_data:
            log_business_event("参数校验失败", "简历数据为空")
            return jsonify({
                "success": False,
                "error": {"code": 1001, "message": "简历数据不能为空"}
            }), 400
        
        # 记录入参详情
        log_business_event("简历翻译-入参", "接收翻译请求", {
            "resume_data_keys": list(resume_data.keys()) if resume_data else [],
            "target_language": target_language,
            "resume_data_size": len(json.dumps(resume_data, ensure_ascii=False))
        })
        
        # 构建输入数据
        input_data = {
            "resume_data": resume_data,
            "target_language": target_language
        }
        
        log_business_event("工作流启动", "启动简历翻译工作流", {
            "workflow_type": "translate",
            "target_language": target_language
        })
        
        # 执行工作流
        result = asyncio.run(orchestrator.execute_workflow("translate", input_data))
        
        # 记录工作流结果
        log_business_event("工作流完成", "简历翻译工作流执行完成", {
            "workflow_type": "translate",
            "result_status": result.get("status", "unknown"),
            "has_translated": bool(result.get("output_data", {}).get("translated"))
        })
        
        response_data = {
            "success": True,
            "message": "简历翻译完成",
            "data": result
        }
        
        log_business_event("简历翻译-响应", "返回翻译结果", {
            "success": True,
            "has_translated": bool(result.get("output_data", {}).get("translated"))
        })
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        log_error("简历翻译异常", str(e), e, traceback.format_exc())
        log_business_event("简历翻译失败", f"异常: {str(e)}")
        return jsonify({
            "success": False,
            "error": {"code": 5000, "message": f"服务器错误: {str(e)}"}
        }), 500


@app.route("/api/agents/workflow-status/<task_id>", methods=["GET"])
def get_workflow_status(task_id):
    """获取工作流状态"""
    log_business_event("状态查询", f"查询工作流状态: {task_id}")
    
    result = {
        "success": True,
        "data": {
            "task_id": task_id,
            "status": "completed",
            "message": "任务已完成"
        }
    }
    
    log_business_event("状态查询-响应", f"返回工作流状态: {task_id}", {"status": "completed"})
    return jsonify(result)


# ==================== 启动服务 ====================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="简流 AI Agent 服务")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="开发模式（更详细启动日志；仍使用 Waitress，避免 Flask 开发服务器警告）",
    )
    parser.add_argument("--port", type=int, default=None, help="监听端口，默认读 .env API_PORT")
    args = parser.parse_args()

    host = config.get("API_HOST", "0.0.0.0") or "0.0.0.0"
    port = int(args.port or config.get("API_PORT", 5001))
    # --dev 或 API_DEBUG=true 仅影响日志文案；对外一律用 Waitress
    debug = args.dev or os.getenv("API_DEBUG", "false").lower() == "true"

    # 打印配置信息
    ai_config.print_config()

    # 验证配置
    is_valid, error_msg = ai_config.validate_config()
    if not is_valid:
        logger.error(f"配置验证失败: {error_msg}")
        raise SystemExit(1)

    # 启动日志
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
    logger.info("启动多智能体简历服务")
    logger.info("=" * 60)
    logger.info(f"服务根地址: {base_url}")
    logger.info(f"监听地址:   http://{host}:{port}")
    logger.info("--- 服务地址 ---")
    for name, url in service_urls:
        logger.info(f"  {name}: {url}")
    logger.info(f"Nest 代理:  backend-resume-nest /api/multiagent/* -> {base_url}")
    logger.info(f"端口: {port}")
    logger.info(f"开发模式: {debug}")
    logger.info("WSGI: waitress")
    logger.info(f"模型配置: {ai_config.catalog_path}")
    logger.info(f"QPS 限制: {ai_config.AI_QPS_LIMIT}")
    logger.info(f"日志目录: {LOG_DIR}")
    logger.info(f"API 日志文件: {API_LOG_FILE}")
    logger.info(f"错误日志文件: {ERROR_LOG_FILE}")
    logger.info("=" * 60)

    business_logger.info(
        "服务启动 | 端口=%d | QPS限制=%d | catalog=%s | wsgi=waitress",
        port,
        ai_config.AI_QPS_LIMIT,
        ai_config.catalog_path,
    )

    from waitress import serve

    # channel_timeout 拉长以支持助手 SSE / 工作流长请求
    serve(
        app,
        host=host,
        port=port,
        threads=8,
        channel_timeout=600,
        ident="l-resume-agent",
    )