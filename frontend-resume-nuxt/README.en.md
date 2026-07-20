# frontend-resume-nuxt

[中文](./README.md)

Jianliu web frontend (Nuxt 4 + Vue 3 + Tailwind + shadcn-vue + Vue Flow).

- Dev URL: http://localhost:3000
- API proxy: in development, `/api/*` → `backend-resume-nest` (default `http://127.0.0.1:3001`; avoids slow IPv6 `localhost` on Windows)

## Start

```bash
cd frontend-resume-nuxt
npm install
npm run dev
```

## Main routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/login` | Login |
| `/templates` | Template gallery |
| `/resume` | My resumes |
| `/editor/:id` | Visual editor |
| `/preview/:id` | Preview / export |
| `/workflow/execution` | Smart execution |
| `/workflow/designer` | Workflow designer |

## Features

- Multi-template creation with live preview
- Section editing, themes, and export
- Smart execution: upload → Agent workflow → multi-template / multi-language output
- Visual workflow design (Vue Flow) with versioning
- Chinese / English i18n and light / dark theme

## Dependencies

Before starting the web app, make sure:

1. `backend-resume-nest` is running (`:3001`)
2. For AI / workflow features, `backend-agent-fastapi` (FastAPI) is running (`:5001`)

## Related docs

- [Root README](../README.en.md)
- [Nest API](../backend-resume-nest/README.en.md)
- [Agent service](../backend-agent-fastapi/README.en.md)
