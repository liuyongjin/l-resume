---
name: expo-native-ui
description: >-
  Build native-feeling Expo screens with HIG styling, semantic colors, safe areas,
  flex gap, continuous border curves, and boxShadow. Use when designing or fixing
  Expo/React Native UI, NativeWind layouts, or mobile visual polish.
---

# Expo Native UI (local install)

Network install of `expo/skills` failed; this is a condensed local copy for l-resume mobile work.

## Non-negotiables

- Prefer `react-native-safe-area-context` SafeAreaView / edges
- Prefer flex `gap` over stacked margins
- Use `{ borderCurve: 'continuous' }` on rounded cards (native)
- Prefer `boxShadow` CSS-style shadows over legacy elevation/shadowColor stacks
- Account for top **and** bottom safe area (tabs, FABs, sticky footers)
- Keep brand primary `#7C3AED` aligned with Nuxt / Flutter

## Quick checklist for style QA

- [ ] Screens use slate-50 / white surfaces consistently (`#F8FAFC` / `#FFFFFF`)
- [ ] Primary actions are rounded-full violet buttons
- [ ] Cards: white, 16–24 radius, light border `#E5E7EB`, no heavy Material elevation
- [ ] Tab bar height includes home-indicator inset
- [ ] Hero uses gradient or rich primary block matching Flutter
- [ ] Empty states: icon + title + CTA, centered, muted text

## Pair with

- Project skill: `mobile-visual-qa` for screenshot / Playwright capture of Expo web + Flutter web
- Project skill: `visual-testing` for Nuxt Playwright baselines
- Project context: `.agents/qa-project-context.md`
