# backend-agent-fastapi

[English](./README.en.md)

简流 AI Agent 服务（**Python FastAPI**），为 `backend-resume-nest` 提供简历解析、优化、工作流节点、全局助手等能力。

- 端口：**5001**
- ASGI：**uvicorn**
- Nest 通过 `MULTIAGENT_SERVICE_URL` 调用（HTTP 代理路径仍为 `/api/multiagent/*`）
- **对外 API 路径与响应格式与旧 Flask 版完全兼容**，Nest 无需改代码

## 快速开始

```bash
cd backend-agent-fastapi
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入 ZHIPU_API_KEY
python src/main.py --dev          # 或 npm run dev
```

## 配置说明

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 模型列表、API 地址、QPS、超时、工作流节点默认参数 | `backend-resume-nest/config/llm-models.json` | **唯一配置源** |
| API Key | `backend-agent-fastapi/.env` → `ZHIPU_API_KEY` | 密钥不入库 |
| Agent 服务地址 | `backend-resume-nest/.env` → `MULTIAGENT_SERVICE_URL` | Nest 代理目标 |
| Agent 本地端口 | `backend-agent-fastapi/.env` → `API_PORT` 等 | 仅部署项 |

Agent `.env` 仅需 API Key 与本地服务端口，**不支持模拟模式**，必须配置有效 API Key 后启动。

全局助手对话会先做 **RAG 检索**（产品功能文档 + 简历写作知识），再流式生成回答（SSE）。

Nest 侧配置：

```bash
MULTIAGENT_SERVICE_URL=http://127.0.0.1:5001
```

## 智能体角色

| Agent | 职责 |
|-------|------|
| Planner | 任务规划 |
| Analyzer | 简历 / JD 分析 |
| Writer | 内容生成 |
| Reviewer | 审核润色 |
| Optimizer | 定向优化 |
| Translator | 中英翻译 |

## 主要 API（与 Nest 契约一致）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查（`service=backend-agent-fastapi`） |
| GET | `/api/agents/capabilities` | 能力清单 |
| POST | `/api/agents/optimize` | 简历优化 |
| POST | `/api/agents/generate-versions` | 多版本生成 |
| POST | `/api/agents/analyze-match` | JD 匹配分析 |
| POST | `/api/agents/parse-resume` | 简历解析 |
| POST | `/api/agents/translate` | 翻译 |
| POST | `/api/agents/resume-chat-edit` | 对话式编辑 |
| GET | `/api/agents/assistant-skills` | 助手 Skills |
| POST | `/api/agents/assistant-chat/stream` | 全局助手流式对话（SSE） |
| POST | `/api/agents/run-node` | 工作流单节点执行 |
| GET | `/api/agents/workflow-status/{task_id}` | 工作流状态 |

前台统一经 Nest `/api/multiagent/*` 访问，不建议浏览器直连本服务。

## 从 Flask 迁移说明

- Flask + Waitress → **FastAPI + uvicorn**
- 路由路径、HTTP 方法、JSON 字段名未变
- 原 `asyncio.run(orchestrator.…)` 改为在 async 路由内 `await orchestrator.…`
- SSE 使用 `StreamingResponse`，事件格式仍为 `data: …\n\n`

## 相关文档

- [根 README](../README.md)
- [Nest API](../backend-resume-nest/README.md)
- [前台 Web](../frontend-resume-nuxt/README.md)
