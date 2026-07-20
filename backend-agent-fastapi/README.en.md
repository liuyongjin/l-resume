# backend-agent-fastapi

[中文](./README.md)

简流 AI Agent service (**Python FastAPI**) for `backend-resume-nest` — resume parse/optimize, workflow nodes, global assistant (RAG + Skills).

- Port: **5001**
- ASGI: **uvicorn**
- Nest calls via `MULTIAGENT_SERVICE_URL` (proxy still `/api/multiagent/*`)
- **API paths & JSON contracts unchanged** from the Flask version — Nest needs no code changes

## Quick start

```bash
cd backend-agent-fastapi
pip install -r requirements.txt
cp .env.example .env
# set ZHIPU_API_KEY
python src/main.py --dev
```

## Config

| Item | Where | Notes |
|------|------|------|
| Models, API URL, QPS, timeouts | `backend-resume-nest/config/llm-models.json` | Single source of truth |
| API key | `backend-agent-fastapi/.env` → `ZHIPU_API_KEY` | Not stored in DB |
| Agent base URL | `backend-resume-nest/.env` → `MULTIAGENT_SERVICE_URL` | Nest proxy target |
| Local port | `backend-agent-fastapi/.env` → `API_PORT` | Deploy only |

```bash
MULTIAGENT_SERVICE_URL=http://127.0.0.1:5001
```

## Main APIs (Nest-compatible)

| Method | Path | Description |
|------|------|------|
| GET | `/health` | Health (`service=backend-agent-fastapi`) |
| GET | `/api/agents/capabilities` | Capabilities |
| POST | `/api/agents/optimize` | Optimize |
| POST | `/api/agents/generate-versions` | Multi-version generate |
| POST | `/api/agents/analyze-match` | JD match |
| POST | `/api/agents/parse-resume` | Parse |
| POST | `/api/agents/translate` | Translate |
| POST | `/api/agents/resume-chat-edit` | Chat edit |
| GET | `/api/agents/assistant-skills` | Skills |
| POST | `/api/agents/assistant-chat/stream` | Assistant SSE |
| POST | `/api/agents/run-node` | Single workflow node |

## Migration (Flask → FastAPI)

- Flask + Waitress → **FastAPI + uvicorn**
- Same routes / methods / payload field names
- `asyncio.run(...)` → `await orchestrator....` inside async routes
- SSE via `StreamingResponse`

## Related

- [Root README](../README.md)
- [Nest API](../backend-resume-nest/README.md)
- [Web](../frontend-resume-nuxt/README.md)
