# backend-nest

[中文](./README.md)

Public API for Jianliu (`NestJS` + Prisma + PostgreSQL). Serves auth, resumes, templates, workflows, and AI proxy endpoints for `frontend-web` / `frontend-mobile`.

- Port: **3001**
- API prefix: `/api`
- Swagger: http://localhost:3001/api-docs
- Agent proxy: `/api/multiagent/*` → `MULTIAGENT_SERVICE_URL` (default `http://localhost:5001`)

## Quick start

```bash
cd backend-nest
cp .env.example .env
# set DATABASE_URL, JWT_SECRET, MULTIAGENT_SERVICE_URL
npm install
npm run prisma:init    # push schema + seed
npm run start:dev
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token TTL (default `7d`) |
| `PORT` | Service port (default `3001`) |
| `BASE_URL` | Public base URL (uploads, etc.) |
| `MULTIAGENT_SERVICE_URL` | Python Agent base URL |

Model catalog, QPS, timeouts, and workflow node defaults live in `config/llm-models.json` (shared with Agent).

## Modules

| Module | Prefix | Purpose |
|--------|--------|---------|
| auth | `/api/auth` | Register, login, profile, password, logout |
| resumes | `/api/resumes` | Resume CRUD, upload/parse, avatar, favorite, share |
| templates | `/api/templates` | Template list & detail |
| workflows | `/api/workflows` | Workflow CRUD, execution, versions, health |
| ai | `/api/ai` | Optimize, check, rewrite, match, resume chat |
| multiagent | `/api/multiagent` | Proxy to Python Agent |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev mode (watch) |
| `npm run build` | Compile |
| `npm run prisma:push` | Sync schema |
| `npm run prisma:seed` | Seed data |
| `npm run prisma:init` | push + seed |
| `npm run prisma:reset` | Rebuild DB + reseed |
| `npm run prisma:studio` | Prisma Studio |

## Test account

| Account | Password | Role |
|---------|----------|------|
| TestUser / 12345678900 | 123456 | USER |

## Related docs

- [Root README](../README.en.md)
- [Agent service](../backend-agent-python/README.en.md)
- [Web frontend](../frontend-web/README.en.md)
