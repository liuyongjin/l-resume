# backend-agent-python

[English](./README.en.md)

简流 AI Agent 服务（Python Flask），为 `backend-nest` 提供简历解析、优化、工作流节点等能力。

- 端口：**5001**
- Nest 通过 `MULTIAGENT_SERVICE_URL` 调用（HTTP 代理路径仍为 `/api/multiagent/*`）

## 快速开始

```bash
cd backend-agent-python
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入 ZHIPU_API_KEY
python src/main.py --dev
```

## 配置说明

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 模型列表、API 地址、QPS、超时、工作流节点默认参数 | `backend-nest/config/llm-models.json` | **唯一配置源** |
| API Key | `backend-agent-python/.env` → `ZHIPU_API_KEY` | 密钥不入库 |
| Agent 服务地址 | `backend-nest/.env` → `MULTIAGENT_SERVICE_URL` | Nest 代理目标 |
| Agent 本地端口 | `backend-agent-python/.env` → `API_PORT` 等 | 仅部署项 |

Agent `.env` 仅需 API Key 与本地服务端口，**不支持模拟模式**，必须配置有效 API Key 后启动。

全局助手对话会先做 **RAG 检索**（产品功能文档 + 简历写作知识），再流式生成回答。

Nest 侧配置：

```bash
MULTIAGENT_SERVICE_URL=http://localhost:5001
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

## 主要 API（Python 服务直连）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/agents/capabilities` | 能力清单 |
| POST | `/api/agents/optimize` | 简历优化 |
| POST | `/api/agents/generate-versions` | 多版本生成 |
| POST | `/api/agents/analyze-match` | JD 匹配分析 |
| POST | `/api/agents/parse-resume` | 简历解析 |
| POST | `/api/agents/translate` | 翻译 |
| POST | `/api/agents/resume-chat-edit` | 对话式编辑 |
| POST | `/api/agents/assistant-chat/stream` | 全局助手流式对话（SSE） |
| POST | `/api/agents/run-node` | 工作流单节点执行 |

前台统一经 Nest `/api/multiagent/*` 访问，不建议浏览器直连本服务。

## 相关文档

- [根 README](../README.md)
- [Nest API](../backend-nest/README.md)
- [前台 Web](../frontend-web/README.md)
