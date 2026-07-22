---
name: image-to-html
description: Analyze an image, generate pixel-accurate vanilla HTML and CSS only (no frameworks or libraries unless requested), then iterate on the layout in the browser until it matches the design.
---

# Image to HTML

## Trigger

The user runs `/image-to-html` or provides an image and asks to convert it to HTML, build the layout, or turn the design into markup.

## Stack constraint (mandatory)

- **Output only HTML and CSS.** No JavaScript unless the user explicitly asks for interactivity.
- **Do not use any CSS library or framework** (e.g. Tailwind, Bootstrap, Bulma, Material CSS, Foundation) unless the user explicitly requests one.
- **Do not use any frontend/JS framework** (e.g. React, Vue, Svelte, Angular) unless the user explicitly requests one.
- **Default is vanilla only:** plain HTML files and plain CSS (no preprocessors like Sass/Less unless the user asks). When in doubt, generate standalone HTML + CSS that runs in any browser with no build step.

## Principle

**Minimal user input.** Infer all layout, spacing, colors, and typography from the image. Do not ask the user for viewport, colors, or measurements. Commit to specific values and document them in comments if needed.

## Pixel-perfect UI: skills and discipline

To make the output match the image as closely as possible:

- **Measure everything.** Infer numeric values from the image: padding, margin, gap, font-size, line-height, border-width, border-radius, icon/content sizes. Use a consistent unit (px for the reference viewport, or rem with 16px base). Never guess with round numbers that don’t reflect the design — approximate proportions (e.g. "padding looks ~1.5× the text size") and convert to px/rem.
- **Stick to a spacing scale.** Use a small set of values (e.g. 4px, 8px, 12px, 16px, 24px, 32px, 48px) so spacing is consistent. Prefer 4px or 8px as the base unit; avoid arbitrary values like 13px or 19px unless the design clearly shows them.
- **Align to a grid.** At the chosen viewport width, align columns and gutters to a grid (e.g. 8px or 12px). Use explicit `max-width` + `margin: 0 auto` for the page, and consistent padding on the sides so content lines up vertically.
- **Typography:** Match font family, size, weight, line-height, and letter-spacing. Use a type scale (e.g. 12, 14, 16, 18, 24, 32px) and set `line-height` per element (e.g. 1.2–1.5) so text doesn’t look loose or cramped. Use `font-weight: 400/500/600/700` as needed; avoid generic "bold".
- **Colors:** Use exact hex (or rgba if transparency is visible). Sample the dominant background, text, borders, and accents; no approximate names (e.g. "light gray") or single hex for multiple shades — differentiate #f5f5f5 vs #e0e0e0 if the design does.
- **Borders and shadows:** If the image shows borders, set exact `border-width`, `border-color`, and `border-radius`. For shadows, approximate `box-shadow: h v blur spread color` (and multiple shadows if layered). Use subtle, realistic values; avoid heavy or decorative shadows unless the design shows them.
- **Sizing and proportions:** Preserve width/height ratios for cards, images, and icons. Use `aspect-ratio` or explicit dimensions where the design implies fixed proportions. For full-width sections, use 100% or 100vw only when the design is edge-to-edge.
- **Iteration checklist:** When the user reports mismatches, fix by: (1) spacing (padding/margin/gap), (2) alignment (flex/grid, text-align), (3) typography (size, weight, line-height), (4) colors and borders, (5) breakpoints or container width if things look too wide/narrow.

## Workflow

### 1. Analyze the image

- **Structure:** Identify layout (header, sections, columns, cards, lists, footer), visual hierarchy, and nesting. Note alignment (left/center/right), column counts, and approximate proportions.
- **Viewport:** From aspect ratio and content, choose a reference width (e.g. 1440px desktop or 375px mobile). State it in a comment.
- **Spacing:** Infer padding, margin, and gap in px using a consistent scale (e.g. 4px or 8px base). Preserve relative proportions between sections.
- **Typography:** Infer font sizes (heading scale, body, small text), weight, and line-height. Use px or rem (16px base). Pick the closest common web font if ambiguous; note in a comment.
- **Colors:** Extract dominant background, text, accent, and border colors as hex. No placeholder colors (e.g. no "gray" or "blue" — use actual hex).
- **Effects:** Infer border-radius, box-shadow, and borders; output exact values in CSS.

### 2. Generate exact HTML and CSS

- **HTML:** Emit semantic HTML (header, main, nav, section, article, aside, footer, etc.) that mirrors the visual structure. Use one-to-one correspondence between visible regions and elements. No extra wrapper divs unless needed for layout. Use appropriate heading levels (h1–h6) and lists (ul/ol) where the design shows hierarchy or lists.
- **CSS:** Use only plain CSS. Apply the **pixel-perfect UI** discipline above: explicit spacing (padding, margin, gap from your scale), aligned layout (flexbox/grid with concrete values), exact typography (font-size, line-height, weight), and exact colors/borders/shadows. Use flexbox or grid with explicit `gap`, `align-items`, `justify-content`, and widths so the result is pixel-accurate at the chosen viewport.
- **Design tokens:** Optionally use CSS custom properties (e.g. `--color-primary`, `--spacing-unit`) for colors and spacing; document the reference width and token summary in a "Design notes" comment block.
- **Accessibility:** Include meaningful `alt` text for any images; ensure sufficient color contrast; use landmarks and headings so the page is navigable.
- **No placeholders:** Use inferred values only. No lorem ipsum unless the image clearly shows placeholder text; no "TODO" colors or sizes.

### 3. Open in browser

- Tell the user to open the generated file (e.g. "Open `index.html` in your browser" or "Use **Live Preview** / your project's preview"). If a browser or preview tool is available, suggest using it.
- The task is not complete after the first generation. The workflow continues with iteration.

### 4. Iterate until it matches

- Ask the user to describe what's off (spacing, alignment, colors, typography, proportions).
- Apply edits using the **iteration checklist** (spacing → alignment → typography → colors/borders → container width). Change only HTML/CSS; no frameworks unless the user asks. Repeat until the user confirms the layout matches the design or has no further changes.
- If the user does not give feedback after opening in browser, ask once: "Open the file in your browser and tell me what you'd like adjusted."

## Guardrails

- **Vanilla only by default:** Do not use any CSS library, UI framework, or frontend framework unless the user explicitly asks for one. Default output is HTML + CSS only.
- Do not consider the task done after the first generation. Completion means the user has previewed and confirmed (or explicitly said they're done).
- Do not ask the user for viewport, colors, or measurements; infer from the image. If ambiguous, pick a reasonable value and document it in a comment.
- Prefer one HTML file with embedded or linked CSS for simplicity unless the user or project structure requires otherwise.
- If the layout clearly looks like a single breakpoint (e.g. mobile or desktop), generate for that; otherwise default to a desktop reference width and note it in the design comments.
- Keep the output self-contained: no external stylesheets or scripts unless the user explicitly requests them.

## Output

- Generated `index.html` (and optional `styles.css`) with design-notes comment, vanilla HTML and CSS only.
- Clear instruction to open in browser.
- Willingness to iterate on feedback until the layout matches the design.
