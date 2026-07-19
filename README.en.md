# Jianliu / l-resume

[中文](./README.md)

An intelligent resume workbench — parse, optimize, and export multi-template / multi-language resumes through visual workflows and multi-agent collaboration.

---

## Architecture

![System architecture](docs/screenshots/architecture.png)

**Request path**

1. Browser hits `frontend-web` (`:3000`)
2. Nuxt proxies `/api/*` to `backend-nest` (`:3001`)
3. Business data goes to PostgreSQL; AI calls are forwarded to the Agent (`:5001`)
4. The Agent loads model settings from `backend-nest/config/llm-models.json` and calls the LLM

---

## Repository layout

```
l-resume/
├── frontend-web/            # ✅ Web app (Nuxt 4)
├── backend-nest/            # ✅ Public API (NestJS)
├── backend-agent-python/    # ✅ AI Agent (Python Flask :5001)
├── backend-admin-java/      # 🚧 Admin API (in progress)
├── frontend-admin/          # 🚧 Admin Web (in progress)
├── frontend-mobile/         # 🚧 Mobile app (in progress)
├── docs/screenshots/        # README screenshots
└── docs/auth-admin/         # Admin auth docs
```

| Package | Port | Status |
|---------|------|--------|
| frontend-web | 3000 | ✅ Ready |
| backend-nest | 3001 | ✅ Ready |
| backend-agent-python | 5001 | ✅ Ready |
| backend-admin-java | 8088 | 🚧 In progress |
| frontend-admin | 5174 | 🚧 In progress |
| frontend-mobile | 8081 | 🚧 In progress |

---

## Quick start (Web + Nest + Agent)

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL (database `l_resume`)
- Zhipu API key in `backend-agent-python/.env`

### 1. Database

```bash
cd backend-nest
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, MULTIAGENT_SERVICE_URL
npm install
npm run prisma:init    # push schema + seed
```

### 2. Agent

```bash
cd backend-agent-python
pip install -r requirements.txt
cp .env.example .env   # set ZHIPU_API_KEY
python src/main.py --dev
```

### 3. Public API

```bash
cd backend-nest
npm run start:dev
# http://localhost:3001  ·  Swagger at /api-docs
```

### 4. Web app

```bash
cd frontend-web
npm install
npm run dev            # http://localhost:3000
```

### Test account

| Account | Password | Role |
|---------|----------|------|
| TestUser / 12345678900 | 123456 | Web user |

---

## Frontend (frontend-web)

Stack: **Nuxt 4 · Vue 3 · Tailwind · shadcn-vue · Vue Flow · Pinia**

### Highlights

- **Template gallery** — browse / filter templates and create a resume in one click
- **Visual editor** — section editing, themes, live A4 preview, export
- **Smart execution** — upload resume → pick templates/languages → Agent pipeline → multi-version output
- **Workflow designer** — drag-and-drop agents & tools, versioning and publish
- **Resume manager** — list, preview, edit, favorite, share
- **i18n / theme** — Chinese / English, light / dark

### Main routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/templates` | Template gallery |
| `/resume` | My resumes |
| `/editor/:id` | Resume editor |
| `/preview/:id` | Resume preview |
| `/workflow/execution` | Smart execution |
| `/workflow/designer` | Workflow designer |

### Screenshots

#### Home

![Home](docs/screenshots/home.png)

#### Templates

![Templates](docs/screenshots/templates.png)

#### My resumes

![My resumes](docs/screenshots/resume-list.png)

#### Editor

![Editor](docs/screenshots/editor.png)

#### Preview

![Preview](docs/screenshots/preview.png)

#### Website settings

![Website settings](docs/screenshots/settings.png)

#### Smart execution

![Smart execution](docs/screenshots/workflow-execution.png)

#### Workflow designer

![Workflow designer](docs/screenshots/workflow-designer.png)

---

## Agent (backend-agent-python)

Provides resume AI capabilities for Nest. **Browsers do not call it directly** — traffic goes through Nest `/api/multiagent/*`.

### Agent roles

| Agent | Responsibility |
|-------|----------------|
| Planner | Task planning |
| Analyzer | Resume / JD analysis |
| Writer | Content generation |
| Reviewer | Review & polish |
| Optimizer | Targeted optimization |
| Translator | Chinese ↔ English |

### Capabilities

| Capability | Endpoint (Agent) | Notes |
|------------|------------------|-------|
| Health | `GET /health` | Service status |
| Capabilities | `GET /api/agents/capabilities` | Agents / workflows catalog |
| Parse resume | `POST /api/agents/parse-resume` | File → structured data |
| Optimize | `POST /api/agents/optimize` | Copy optimization |
| JD match | `POST /api/agents/analyze-match` | Job match analysis |
| Multi-version | `POST /api/agents/generate-versions` | Multi-template / language |
| Translate | `POST /api/agents/translate` | Translation |
| Chat edit | `POST /api/agents/resume-chat-edit` | Conversational edits |
| Run node | `POST /api/agents/run-node` | Single workflow node |

### Configuration

| Config | Location | Notes |
|--------|----------|-------|
| Models, QPS, timeouts, node defaults | `backend-nest/config/llm-models.json` | Single source of truth |
| `ZHIPU_API_KEY` | `backend-agent-python/.env` | API key |
| `MULTIAGENT_SERVICE_URL` | `backend-nest/.env` | Default `http://localhost:5001` |

Frontend **Smart execution** and **Workflow designer** agent nodes ultimately map to these endpoints.

---

## Backend API summary (backend-nest)

| Module | Prefix | Purpose |
|--------|--------|---------|
| auth | `/api/auth` | Login / register / profile |
| resumes | `/api/resumes` | Resume CRUD, upload parse, share |
| templates | `/api/templates` | Template list & detail |
| workflows | `/api/workflows` | Workflow CRUD, run, versions |
| ai | `/api/ai` | Optimize, check, chat, etc. |
| multiagent | `/api/multiagent` | Proxy to Python Agent |

---

## Packages in progress

These are in the monorepo but not the current delivery focus:

- **frontend-admin** / **backend-admin-java** — admin console & admin login
- **frontend-mobile** — Expo mobile app

See [MODULES.md](./MODULES.md) for deeper module notes (if present).

---

## Docs

- [中文 README](./README.md)
- [Web frontend](./frontend-web/README.en.md) · [中文](./frontend-web/README.md)
- [Nest API](./backend-nest/README.en.md) · [中文](./backend-nest/README.md)
- [Agent service](./backend-agent-python/README.en.md) · [中文](./backend-agent-python/README.md)
