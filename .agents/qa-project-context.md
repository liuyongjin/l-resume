# l-resume QA project context

Use this file with `visual-testing`, `mobile-visual-qa`, and related skills. Skip rediscovery when these answers already cover the task.

## Apps

| App | Path | Dev command | URL |
|-----|------|-------------|-----|
| Nuxt (brand baseline) | `frontend-resume-nuxt/` | `npm run dev` | http://localhost:3000 |
| Expo mobile | `frontend-mobile-expo/` | `npx expo start --web` | http://localhost:8081 |
| Flutter mobile | `frontend-mobile-flutter/` | `flutter run -d chrome --web-port=8082` | http://localhost:8082 |

## Brand tokens

| Token | Value |
|-------|-------|
| primary | `#7C3AED` |
| primaryLight | `#A78BFA` |
| background | `#F8FAFC` |
| surface | `#FFFFFF` |
| text | `#111827` |
| textMuted | `#6B7280` |
| border | `#E5E7EB` |

## Critical Nuxt routes

- `/` home
- `/login`
- `/resume`
- `/editor/:id`
- `/preview/:id`
- `/templates`
- `/workflow/designer`
- `/workflow/execution`
- `/workflow/executions`

## Tooling defaults

- Visual regression: Playwright `toHaveScreenshot` when installed; otherwise agent screenshot QA
- Mobile viewport: `375×667`
- Desktop viewport: `1280×720`
- Screenshot temp: `frontend-resume-nuxt/tmp/visual/`, `tmp/visual/mobile/`
- Pair design clone skills (`screenshot-to-html` / `screenshot-to-code` / `image-to-html`) with a visual pass before done
