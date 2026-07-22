---
name: mobile-visual-qa
description: >-
  Visual QA for l-resume Expo and Flutter clients against Nuxt brand tokens.
  Captures mobile/web screenshots, checks layout overflow, color parity, tab/FAB
  safe-area, and card density. Use when user asks for mobile visual testing,
  Expo/Flutter style fixes, screenshot QA, or UI polish on frontend-mobile-*.
---

# Mobile Visual QA (l-resume)

## Brand tokens (source of truth)

| Token | Value |
|-------|-------|
| primary | `#7C3AED` |
| primaryLight | `#A78BFA` |
| background | `#F8FAFC` |
| surface | `#FFFFFF` |
| text | `#111827` |
| textMuted | `#6B7280` |
| border | `#E5E7EB` |

Nuxt baseline: `frontend-resume-nuxt` @ `http://localhost:3000`  
Expo web: `frontend-mobile-expo` `npx expo start --web` (often `:8081`)  
Flutter web: `frontend-mobile-flutter` `flutter run -d chrome --web-port=8082`

## Agent workflow

1. Start Expo web and/or Flutter web
2. Capture mobile viewport **375×667** screenshots to `tmp/visual/mobile/{app}-{route}.png`
3. Compare against checklist below; fix code, re-capture
4. Prefer fixing **both** Expo and Flutter when the issue is brand parity

## Checklist

- Auth: branded logo mark, soft violet blobs, card form, primary CTA
- Home: greeting + notification chip, gradient/primary hero, 4 quick actions
- Resumes: search field, list cards with icon tile, violet FAB
- Tabs: active tint primary, inactive muted, bottom safe inset
- No raw `Colors.grey` / Material default purple avatars leaking brand
- Preview/export actions use full-width rounded primary buttons

## Playwright quick capture (Expo web)

```bash
cd frontend-mobile-expo
npx expo start --web
# then from repo root or expo folder:
npx playwright screenshot --viewport-size=375,667 http://localhost:8081/login tmp/visual/mobile/expo-login.png
```

## Done when

- Critical routes captured at 375×667
- Checklist items fixed in both apps (or documented as intentional)
- Unit tests still pass (`npm test` / `flutter test`)
