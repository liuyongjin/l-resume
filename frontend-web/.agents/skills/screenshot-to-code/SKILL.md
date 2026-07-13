---
name: screenshot-to-code
description: Convert UI screenshots into working Vue/Nuxt + shadcn-vue + Tailwind code for this resume builder project. Detects design patterns, components, and generates responsive layouts. Use when users provide screenshots, mockups, or UI designs and want code implementation.
---

# Screenshot to Code

Convert UI screenshots into production-ready code with accurate styling and structure.

## Project defaults (l-resume frontend)

When working in this repository, **do not ask which framework** unless the user explicitly wants something else.

| Item | Default |
|------|---------|
| Framework | **Vue 3 + Nuxt 4** |
| UI library | **shadcn-vue** (`Button`, `Card`, `Badge`, `Input`, etc.) |
| Styling | **Tailwind CSS** + design tokens (`primary`, `muted-foreground`, `border`, …) |
| Pages | `frontend-web/src/pages/` |
| Components | `frontend-web/src/components/` |
| Utils | `@/lib/utils` (`cn()` helper) |

Read `frontend-web/.agents/skills/shadcn-vue/SKILL.md` when adding or wiring UI components.

## How This Works

Given a screenshot of a UI design:
1. Analyze the visual design thoroughly
2. Generate clean, modern code that recreates it
3. Provide complete, runnable implementation

## Instructions

### 1. Analyze the Screenshot

Examine the image carefully and identify:
- **Layout structure**: Grid, flexbox, or custom positioning
- **Components**: Buttons, inputs, cards, navigation, modals, etc.
- **Visual details**: Colors, fonts, spacing, borders, shadows, border-radius
- **Responsive considerations**: Mobile vs. desktop layout cues

### 2. Determine the Framework

Only ask if the user wants a different stack. Otherwise use **Vue 3 + Nuxt + shadcn-vue + Tailwind**.

Supported alternatives when requested:
- Plain HTML/CSS (standalone prototype)
- React / Next.js

### 3. Generate Complete Code

Create the implementation:

**For Vue/Nuxt (default):**
- Place pages in `frontend-web/src/pages/`; reusable blocks in `frontend-web/src/components/`
- Prefer existing shadcn-vue components over raw HTML buttons/cards
- Use `<script setup lang="ts">`, `navigateTo` from `nuxt/app` for routing
- Use semantic HTML + Tailwind utility classes aligned with project tokens
- Break into logical Vue SFCs when the UI has distinct sections

**For HTML/CSS prototypes:**
- Use semantic HTML5 structure
- Write clean, organized CSS; prefer Tailwind CDN only for throwaway demos

**Critical requirements:**
- Match colors closely (map to project tokens when integrating into l-resume)
- Match spacing and proportions as closely as possible
- Use appropriate semantic elements (header, nav, main, section, etc.)
- Include accessibility attributes (alt text, ARIA labels where needed)

### 4. Make It Responsive

- Use responsive units (rem, em, %, vw/vh) and Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- Add breakpoints for mobile, tablet, desktop if the design suggests it
- Use `clamp()` for fluid typography where appropriate

### 5. Deliver Complete Implementation

Provide:
1. **Complete code** (all files needed, fully functional)
2. **File structure** (explain what each file does)
3. **Usage instructions** (how to run: `npm run dev` in `frontend-web/`)
4. **Notes on design decisions** (any assumptions or interpretations)

## Output Format

Structure Vue + shadcn-vue output like this:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <section class="...">
    <Card>
      <CardHeader>
        <CardTitle>Section title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  </section>
</template>
```

Always include:
- All necessary imports
- Clear comments for complex sections
- Suggestions for improvements or next steps

## Best Practices

- **Accuracy**: Match the design as closely as possible
- **Reuse**: Prefer shadcn-vue components already in `frontend-web/src/components/ui/`
- **Accessibility**: Include ARIA labels, alt text, semantic HTML
- **Maintainability**: Write clean, well-organized code; avoid magic-number absolute layouts
- **Responsiveness**: Design mobile-first when possible

## Common Patterns

**Navigation Bars**: Flexbox with space-between, sticky positioning
**Card Grids**: CSS Grid with auto-fit/auto-fill for responsiveness
**Hero Sections**: Full-height with centered content, background gradients
**Forms**: shadcn-vue `Input`, `Label`, `Textarea`, `Select`
**Modals**: shadcn-vue `Dialog` or `Sheet`

## Handling Unclear Screenshots

When the screenshot is unclear or ambiguous:
- Make reasonable assumptions based on common UI patterns
- Note the chosen interpretation in comments
- Suggest alternatives that might be preferred
- Ask for clarification on critical decisions

## Related skills

- **screenshot-to-html** — high-fidelity standalone HTML replica with render → compare → refine loop (use for pixel-perfect mockups before porting to Vue)
- **shadcn-vue** — component APIs, theming, and CLI usage for this project

---

Aim to produce code so clean and accurate that it could be deployed immediately with minimal modifications.
