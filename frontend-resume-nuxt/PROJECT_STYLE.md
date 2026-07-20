# 简流 - Project Style Guide

> **Purpose:** This document defines the visual and interaction design for the 简流 application.
> All agents should follow this guide when creating or modifying UI components.

---

## Design Vision

**Theme:** Modern Minimalist + Swiss Style
**Mood:** Clean, professional, spacious, and accessible
**Goal:** Remove AI-generated aesthetic, embrace human-centered design

### Core Philosophy

1. **Less is More** - Every element must earn its place
2. **Content First** - Design serves content, not competes with it
3. **Clarity** - Clear hierarchy, obvious affordances
4. **Speed** - Fast interactions, no waiting, no confusion
5. **Accessibility** - WCAG 2.1 AA minimum

---

## Color System

### Brand Colors

```css
:root {
  /* Primary - Sky */
  --color-primary: #0EA5E9;
  --color-primary-light: #38BDF8;
  --color-primary-dark: #0284C7;

  /* Secondary */
  --color-secondary: #BAE6FD;

  /* CTA - Fuchsia */
  --color-cta: #D946EF;
  --color-cta-light: #E879F9;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

### Gray Scale

```css
:root {
  --color-gray-50: #F9FAFB;   /* Background */
  --color-gray-100: #F3F4F6;  /* Borders */
  --color-gray-200: #E5E7EB;  /* Disabled */
  --color-gray-300: #D1D5DB;  /* Placeholder */
  --color-gray-400: #9CA3AF;  /* Muted */
  --color-gray-500: #6B7280;  /* Secondary */
  --color-gray-600: #4B5563;  /* Body */
  --color-gray-700: #374151;  /* Primary text */
  --color-gray-800: #1F2937;  /* Headings */
  --color-gray-900: #111827;  /* Dark text */
}
```

### Usage Guidelines

```vue
<!-- Backgrounds -->
<div class="bg-gray-50"></div>      <!-- Light sections -->
<div class="bg-white"></div>         <!-- Cards, modals -->
<div class="bg-gray-900"></div>      <!-- Dark sections -->

<!-- Text -->
<p class="text-gray-900"></p>       <!-- Headings -->
<p class="text-gray-700"></p>       <!-- Body text -->
<p class="text-gray-500"></p>       <!-- Muted text -->

<!-- Interactive -->
<button class="bg-primary text-white"></button>     <!-- Primary action -->
<button class="bg-cta text-white"></button>         <!-- CTA -->
<a class="text-primary hover:text-primary-dark"></a> <!-- Links -->
```

---

## Typography

### Font Stack

```css
font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| H1 | 2.5rem (40px) | Bold (700) | 1.2 | Gray 900 |
| H2 | 2rem (32px) | Semibold (600) | 1.25 | Gray 900 |
| H3 | 1.5rem (24px) | Semibold (600) | 1.3 | Gray 800 |
| H4 | 1.25rem (20px) | Medium (500) | 1.4 | Gray 800 |
| Body | 1rem (16px) | Normal (400) | 1.6 | Gray 700 |
| Small | 0.875rem (14px) | Normal (400) | 1.5 | Gray 600 |
| Caption | 0.75rem (12px) | Normal (400) | 1.4 | Gray 500 |

### Usage

```vue
<h1 class="text-4xl font-bold text-gray-900 leading-tight">Page Title</h1>
<h2 class="text-3xl font-semibold text-gray-900 leading-snug">Section Title</h2>
<h3 class="text-2xl font-semibold text-gray-800 leading-snug">Card Title</h3>
<p class="text-base text-gray-700 leading-relaxed">Body text with proper line height for readability.</p>
<p class="text-sm text-gray-600 leading-normal">Secondary information.</p>
<p class="text-xs text-gray-500 leading-relaxed">Muted or tertiary text.</p>
```

---

## Spacing System

Use Tailwind's 4-point spacing scale consistently:

```vue
<!-- Tight - Components -->
<div class="p-2 m-1"></div>

<!-- Standard - Cards -->
<div class="p-4 m-2"></div>

<!-- Relaxed - Sections -->
<div class="p-6 m-4"></div>

<!-- Spacious - Hero -->
<div class="p-8 m-6"></div>
```

### Spacing Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Icon gaps |
| `space-2` | 8px | Inline spacing |
| `space-3` | 12px | Form elements |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Section margins |
| `space-16` | 64px | Hero padding |

---

## Component Specifications

### Buttons

**Primary Button**
```vue
<button class="
  bg-primary
  hover:bg-primary-dark
  text-white
  px-6 py-3
  rounded-lg
  font-semibold
  transition-colors
  duration-200
  cursor-pointer
">
  Primary Action
</button>
```

**Secondary Button**
```vue
<button class="
  bg-white
  hover:bg-gray-50
  text-gray-700
  border border-gray-300
  px-6 py-3
  rounded-lg
  font-semibold
  transition-colors
  duration-200
  cursor-pointer
">
  Secondary
</button>
```

**Ghost Button**
```vue
<button class="
  hover:bg-gray-100
  text-gray-600
  px-4 py-2
  rounded-lg
  transition-colors
  duration-200
  cursor-pointer
">
  Text Button
</button>
```

**Icon Button**
```vue
<button class="
  p-2
  hover:bg-gray-100
  rounded-lg
  transition-colors
  duration-200
  cursor-pointer
" aria-label="Settings">
  <!-- SVG Icon -->
</button>
```

### Cards

**Standard Card**
```vue
<div class="
  bg-white
  rounded-xl
  border border-gray-200
  p-6
  shadow-sm
  hover:shadow-md
  transition-shadow
  duration-200
">
  <h3 class="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p class="text-gray-600">Card content with proper contrast.</p>
</div>
```

**Interactive Card**
```vue
<div class="
  bg-white
  rounded-xl
  border border-gray-200
  p-6
  shadow-sm
  hover:-translate-y-0.5 hover:shadow-lg
  transition-all duration-200
  cursor-pointer
">
  <!-- Content -->
</div>
```

### Forms

**Text Input**
```vue
<input
  type="text"
  placeholder="Enter text"
  class="
    w-full
    px-4 py-2
    border border-gray-300
    rounded-lg
    focus:ring-2 focus:ring-primary focus:border-transparent
    transition-all duration-200
    outline-none
  "
/>
```

**Textarea**
```vue
<textarea
  rows="4"
  placeholder="Enter description"
  class="
    w-full
    px-4 py-2
    border border-gray-300
    rounded-lg
    focus:ring-2 focus:ring-primary focus:border-transparent
    transition-all duration-200
    outline-none
    resize-none
  "
></textarea>
```

**Select**
```vue
<select class="
  w-full
  px-4 py-2
  border border-gray-300
  rounded-lg
  bg-white
  focus:ring-2 focus:ring-primary focus:border-transparent
  transition-all duration-200
  outline-none
  cursor-pointer
">
  <option value="">Select option</option>
</select>
```

### Navigation

**Horizontal Nav**
```vue
<nav class="flex items-center space-x-6">
  <router-link
    to="/"
    class="text-gray-600 hover:text-primary transition-colors duration-200"
  >
    Home
  </router-link>
  <router-link
    to="/workflow"
    class="text-primary font-medium"
  >
    Workflow
  </router-link>
</nav>
```

**Tab Nav**
```vue
<div class="flex border-b border-gray-200">
  <button class="
    px-4 py-2
    text-primary
    border-b-2 border-primary
    -mb-px
    font-medium
  ">
    Active Tab
  </button>
  <button class="
    px-4 py-2
    text-gray-500
    hover:text-gray-700
    transition-colors duration-200
  ">
    Inactive Tab
  </button>
</div>
```

**Breadcrumb**
```vue
<nav aria-label="Breadcrumb" class="flex items-center space-x-2 text-sm">
  <a href="/" class="text-gray-500 hover:text-primary transition-colors">Home</a>
  <span class="text-gray-300">/</span>
  <a href="/workflow" class="text-gray-500 hover:text-primary transition-colors">Workflow</a>
  <span class="text-gray-300">/</span>
  <span class="text-gray-900 font-medium">Current</span>
</nav>
```

### Modals & Overlays

**Modal**
```vue
<div class="fixed inset-0 z-50 flex items-center justify-center">
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

  <!-- Modal Content -->
  <div class="
    relative
    bg-white
    rounded-2xl
    shadow-xl
    max-w-lg
    w-full
    mx-4
    p-6
  ">
    <h3 class="text-xl font-semibold text-gray-900 mb-4">Modal Title</h3>
    <p class="text-gray-600 mb-6">Modal content goes here.</p>

    <div class="flex justify-end space-x-3">
      <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        Cancel
      </button>
      <button class="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Alerts & Notifications

**Success Alert**
```vue
<div class="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
  <div class="flex-shrink-0 text-green-500">
    <!-- Success Icon -->
  </div>
  <div class="flex-1">
    <h4 class="text-sm font-medium text-green-800">Success</h4>
    <p class="text-sm text-green-700 mt-1">Operation completed successfully.</p>
  </div>
</div>
```

**Error Alert**
```vue
<div class="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
  <div class="flex-shrink-0 text-red-500">
    <!-- Error Icon -->
  </div>
  <div class="flex-1">
    <h4 class="text-sm font-medium text-red-800">Error</h4>
    <p class="text-sm text-red-700 mt-1">Something went wrong. Please try again.</p>
  </div>
</div>
```

---

## Shadows & Elevation

### Shadow Scale

```css
.shadow-sm    /* 0 1px 2px rgba(0,0,0,0.05) - Subtle lift */
.shadow-md    /* 0 4px 6px rgba(0,0,0,0.1) - Cards, buttons */
.shadow-lg    /* 0 10px 15px rgba(0,0,0,0.1) - Modals, dropdowns */
.shadow-xl    /* 0 20px 25px rgba(0,0,0,0.15) - Hero images, featured */
```

### Usage

```vue
<!-- Cards -->
<div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"></div>

<!-- Dropdowns -->
<div class="bg-white rounded-lg shadow-lg"></div>

<!-- Modals -->
<div class="bg-white rounded-2xl shadow-xl"></div>

<!-- Floating elements -->
<div class="bg-white rounded-lg shadow-lg"></div>
```

---

## Animations & Transitions

### Duration

| Name | Duration | Use Case |
|------|----------|----------|
| Fast | 150ms | Hover states, small transitions |
| Normal | 200-300ms | Most UI transitions |
| Slow | 400-500ms | Page transitions, modals |

### Easing

```css
ease-out     /* Start fast, end slow - exiting */
ease-in      /* Start slow, end fast - entering */
ease-in-out  /* Start slow, end slow - smooth */
```

### Micro-interactions

```vue
<!-- Hover lift -->
<div class="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"></div>

<!-- Button press -->
<button class="active:scale-95 transition-transform duration-150"></button>

<!-- Focus ring -->
<input class="focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"></input>

<!-- Opacity change -->
<div class="hover:opacity-75 transition-opacity duration-200"></div>
```

---

## Layout Patterns

### Container

```vue
<!-- Narrow content -->
<div class="max-w-3xl mx-auto px-4 sm:px-6"></div>

<!-- Standard content -->
<div class="max-w-5xl mx-auto px-4 sm:px-6"></div>

<!-- Wide content -->
<div class="max-w-7xl mx-auto px-4 sm:px-6"></div>
```

### Grid System

```vue
<!-- 2 columns on mobile, 4 on desktop -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-6"></div>

<!-- Sidebar layout -->
<div class="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-6"></div>

<!-- Card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
```

### Flexbox Patterns

```vue
<!-- Centered -->
<div class="flex items-center justify-center"></div>

<!-- Space between -->
<div class="flex items-center justify-between"></div>

<!-- Stacked -->
<div class="flex flex-col space-y-4"></div>

<!-- Inline list -->
<div class="flex items-center space-x-4"></div>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| Mobile | < 640px | Phones |
| Tablet | 640px - 768px | Tablets |
| Desktop | 768px - 1024px | Laptops |
| Large Desktop | > 1024px | Desktops |

### Mobile-First

```vue
<!-- Base styles (mobile) -->
<div class="text-sm p-4">

<!-- Tablet+ -->
<div class="text-sm md:text-base md:p-6">

<!-- Desktop+ -->
<div class="text-sm md:text-base lg:text-lg md:p-6 lg:p-8">
```

### Responsive Navigation

```vue
<!-- Mobile: Hamburger menu -->
<button class="md:hidden p-2" @click="toggleMenu">
  <Icon name="heroicons:bars-3" />
</button>

<!-- Desktop: Horizontal nav -->
<nav class="hidden md:flex items-center space-x-6">
  <a href="/">Home</a>
  <a href="/workflow">Workflow</a>
</nav>
```

---

## Accessibility Requirements

### Color Contrast

- Text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

### Focus States

```vue
<!-- All interactive elements must have visible focus -->
<button class="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Action
</button>

<!-- Skip link for keyboard navigation -->
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0">
  Skip to main content
</a>
```

### Semantic HTML

```vue
<main id="main-content" role="main">
  <header role="banner">
    <nav aria-label="Main navigation">
      <ul role="menubar">
        <li role="menuitem"><a href="/">Home</a></li>
      </ul>
    </nav>
  </header>

  <section aria-labelledby="section-title">
    <h2 id="section-title">Section Title</h2>
    <p>Content</p>
  </section>

  <footer role="contentinfo"></footer>
</main>
```

### ARIA Labels

```vue
<!-- Icon buttons -->
<button aria-label="Close dialog">
  <Icon name="heroicons:x-mark" />
</button>

<!-- Form inputs -->
<label for="email">Email</label>
<input id="email" type="email" aria-describedby="email-help" />
<p id="email-help" class="text-sm text-gray-500">Enter your email address</p>
```

---

## Anti-Patterns

### Do NOT Use ❌

1. **Emojis as icons** - Use SVG icons (Lucide, Heroicons)
2. **Missing cursor:pointer** - All clickable elements must have cursor
3. **Layout-shifting hovers** - Avoid scale transforms that shift layout
4. **Low contrast text** - Maintain 4.5:1 minimum contrast
5. **Instant state changes** - Always use transitions (150-300ms)
6. **Invisible focus states** - Focus must be visible
7. **Horizontal scroll** - Never allow horizontal scroll on mobile
8. **Content behind nav** - Ensure content not hidden behind fixed elements
9. **Uniform spacing everywhere** - Vary spacing intentionally
10. **All caps text** - Hard to read, use sentence case

### DO Use ✅

1. SVG icons from consistent library
2. Smooth hover/focus transitions
3. High contrast text
4. Adequate white space
5. Consistent spacing system
6. Clear visual hierarchy
7. Mobile-first responsive design
8. Semantic HTML
9. Accessible interactions
10. Performance optimization

---

## Icons

**Library:** Lucide React / Heroicons

**Usage:**

```vue
<script setup>
import { Icon } from '#components'
</script>

<template>
  <!-- Menu -->
  <Icon name="heroicons:bars-3" class="w-5 h-5" />

  <!-- Close -->
  <Icon name="heroicons:x-mark" class="w-5 h-5" />

  <!-- Settings -->
  <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />

  <!-- Plus -->
  <Icon name="heroicons:plus" class="w-5 h-5" />

  <!-- Edit -->
  <Icon name="heroicons:pencil-square" class="w-5 h-5" />

  <!-- Delete -->
  <Icon name="heroicons:trash" class="w-5 h-5" />
</template>
```

---

## Code Examples

### Complete Page Layout

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-bold text-gray-900">简流</h1>
          <nav class="flex items-center space-x-4">
            <a href="/" class="text-gray-600 hover:text-primary transition-colors">Home</a>
            <a href="/workflow" class="text-primary font-medium">Workflow</a>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Page Title -->
        <div>
          <h2 class="text-3xl font-bold text-gray-900">Page Title</h2>
          <p class="mt-2 text-gray-600">Page description</p>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Card -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
            <p class="text-gray-600">Card description</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
```

---

## Performance Guidelines

### Image Optimization

```vue
<!-- Responsive images -->
<img
  :src="imageSrc"
  :srcset="`${imageSrc} 400w, ${imageSrcLarge} 800w`"
  sizes="(max-width: 640px) 400px, 800px"
  loading="lazy"
  alt="Description"
  class="w-full h-auto"
/>
```

### Lazy Loading

```vue
<!-- Components -->
<LazyHeavyComponent v-if="showComponent" />

<!-- Images -->
<img loading="lazy" src="/image.jpg" alt="Description" />
```

### Code Splitting

```vue
<script setup>
const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
</script>
```

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Lucide/Heroicons)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Semantic HTML structure
- [ ] ARIA labels on interactive elements
- [ ] Alt text on images
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers

---

## Additional Resources

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/
- **Heroicons:** https://heroicons.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated:** 2026-06-07
**Version:** 1.0
**Maintainer:** AI Development Team
