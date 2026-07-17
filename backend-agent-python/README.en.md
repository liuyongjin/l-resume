# backend-agent-python

[中文](./README.md)

Jianliu AI Agent service (Python Flask). Provides resume parsing, optimization, and workflow node execution for `backend-nest`.

- Port: **5001**
- Called by Nest via `MULTIAGENT_SERVICE_URL` (HTTP proxy path remains `/api/multiagent/*`)

## Quick start

```bash
cd backend-agent-python
pip install -r requirements.txt
cp .env.example .env
# set ZHIPU_API_KEY in .env
python src/main.py --dev
```

## Configuration

| Item | Location | Notes |
|------|----------|-------|
| Models, API URL, QPS, timeouts, workflow node defaults | `backend-nest/config/llm-models.json` | **Single source of truth** |
| API key | `backend-agent-python/.env` → `ZHIPU_API_KEY` | Not stored in DB |
| Agent base URL | `backend-nest/.env` → `MULTIAGENT_SERVICE_URL` | Nest proxy target |
| Local Agent port | `backend-agent-python/.env` → `API_PORT`, etc. | Deploy-only |

Agent `.env` only needs the API key and local port. **No mock mode** — a valid API key is required.

Nest config:

```bash
MULTIAGENT_SERVICE_URL=http://localhost:5001
```

## Agent roles

| Agent | Responsibility |
|-------|----------------|
| Planner | Task planning |
| Analyzer | Resume / JD analysis |
| Writer | Content generation |
| Reviewer | Review & polish |
| Optimizer | Targeted optimization |
| Translator | Chinese ↔ English |

## Main APIs (direct Agent endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/capabilities` | Capabilities catalog |
| POST | `/api/agents/optimize` | Resume optimization |
| POST | `/api/agents/generate-versions` | Multi-version generation |
| POST | `/api/agents/analyze-match` | JD match analysis |
| POST | `/api/agents/parse-resume` | Resume parsing |
| POST | `/api/agents/translate` | Translation |
| POST | `/api/agents/resume-chat-edit` | Conversational edit |
| POST | `/api/agents/run-node` | Single workflow node run |

Clients should go through Nest `/api/multiagent/*` instead of calling this service directly from the browser.

## Related docs

- [Root README](../README.en.md)
- [Nest API](../backend-nest/README.en.md)
- [Web frontend](../frontend-web/README.en.md)
