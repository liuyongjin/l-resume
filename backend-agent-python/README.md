# backend-agent-python

简流 AI Agent 服务（Python），为 `backend-nest` 提供简历解析、优化、工作流节点等能力。

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

Nest 侧配置：

```bash
MULTIAGENT_SERVICE_URL=http://localhost:5001
```

## 主要 API（Python 服务直连）

| 方法 | 路径 |
|------|------|
| GET | `/health` |
| GET | `/api/agents/capabilities` |
| POST | `/api/agents/optimize` |
| POST | `/api/agents/generate-versions` |
| POST | `/api/agents/analyze-match` |
| POST | `/api/agents/parse-resume` |
| POST | `/api/agents/translate` |
| POST | `/api/agents/resume-chat-edit` |
| POST | `/api/agents/run-node` |
