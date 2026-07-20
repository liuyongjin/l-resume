<script setup lang="ts">
import { computed } from 'vue'
import { renderAiMarkdown } from '~/utils/ai-markdown'

const props = withDefaults(
  defineProps<{
    content: string
    streaming?: boolean
    placeholder?: string
  }>(),
  {
    streaming: false,
    placeholder: '…',
  },
)

const html = computed(() => {
  const text = props.content || ''
  if (!text.trim()) {
    if (!props.streaming) return ''
    // 占位文案与闪烁光标分离，避免塞进窄光标导致竖排
    return `<span class="ai-md__thinking">${escapeText(props.placeholder)}</span><span class="ai-md__cursor" aria-hidden="true"></span>`
  }
  const rendered = renderAiMarkdown(text)
  return props.streaming
    ? `${rendered}<span class="ai-md__cursor" aria-hidden="true"></span>`
    : rendered
})

function escapeText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<template>
  <div class="ai-md" v-html="html" />
</template>

<style scoped>
.ai-md {
  font-size: inherit;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.ai-md :deep(.ai-md__thinking) {
  display: inline;
  white-space: nowrap;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.02em;
}

.ai-md :deep(.ai-md__cursor) {
  display: inline-block;
  width: 0.45em;
  height: 1em;
  margin-left: 0.2em;
  vertical-align: -0.12em;
  background: hsl(var(--primary));
  border-radius: 1px;
  animation: ai-md-blink 1s step-end infinite;
}

.ai-md :deep(.ai-md__p) {
  margin: 0.35em 0;
}

.ai-md :deep(.ai-md__p:first-child) {
  margin-top: 0;
}

.ai-md :deep(.ai-md__p:last-child) {
  margin-bottom: 0;
}

.ai-md :deep(.ai-md__h) {
  margin: 0.55em 0 0.3em;
  font-weight: 650;
  line-height: 1.35;
}

.ai-md :deep(.ai-md__h1) {
  font-size: 1.05em;
}
.ai-md :deep(.ai-md__h2) {
  font-size: 1em;
}
.ai-md :deep(.ai-md__h3),
.ai-md :deep(.ai-md__h4) {
  font-size: 0.95em;
}

.ai-md :deep(.ai-md__ul),
.ai-md :deep(.ai-md__ol) {
  margin: 0.35em 0;
  padding-left: 1.2em;
}

.ai-md :deep(.ai-md__ul) {
  list-style: disc;
}

.ai-md :deep(.ai-md__ol) {
  list-style: decimal;
}

.ai-md :deep(li) {
  margin: 0.15em 0;
}

.ai-md :deep(.ai-md__quote) {
  margin: 0.45em 0;
  padding: 0.35em 0.65em;
  border-left: 3px solid hsl(var(--primary) / 0.45);
  background: hsl(var(--muted) / 0.45);
  border-radius: 0 0.4rem 0.4rem 0;
  color: hsl(var(--muted-foreground));
}

.ai-md :deep(.ai-md__hr) {
  margin: 0.65em 0;
  border: 0;
  border-top: 1px solid hsl(var(--border));
}

.ai-md :deep(.ai-md__a) {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
}

.ai-md :deep(.ai-md__code) {
  padding: 0.1em 0.35em;
  border-radius: 0.3rem;
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.ai-md :deep(.ai-md__pre-wrap) {
  position: relative;
  margin: 0.5em 0;
  border-radius: 0.55rem;
  border: 1px solid hsl(var(--border));
  background: hsl(222 22% 12%);
  color: hsl(210 20% 96%);
  overflow: hidden;
}

.ai-md :deep(.ai-md__lang) {
  display: block;
  padding: 0.3rem 0.65rem 0;
  font-size: 0.65rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: hsl(215 15% 70%);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.ai-md :deep(.ai-md__pre) {
  margin: 0;
  padding: 0.55rem 0.7rem 0.7rem;
  overflow-x: auto;
  max-width: 100%;
}

.ai-md :deep(.ai-md__pre-code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre;
  background: transparent;
  color: inherit;
  padding: 0;
}

.ai-md :deep(.ai-md__table-wrap) {
  margin: 0.45em 0;
  overflow-x: auto;
  border-radius: 0.45rem;
  border: 1px solid hsl(var(--border));
}

.ai-md :deep(.ai-md__table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78em;
}

.ai-md :deep(.ai-md__table th),
.ai-md :deep(.ai-md__table td) {
  padding: 0.35em 0.5em;
  border-bottom: 1px solid hsl(var(--border));
  text-align: left;
  vertical-align: top;
}

.ai-md :deep(.ai-md__table th) {
  background: hsl(var(--muted) / 0.5);
  font-weight: 600;
}

.ai-md :deep(.ai-md__img) {
  max-width: 100%;
  border-radius: 0.4rem;
  margin: 0.35em 0;
}

@keyframes ai-md-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-md :deep(.ai-md__cursor) {
    animation: none;
  }
}

/* 用户气泡内：代码块用稍亮底色 */
:global(.ai-assistant-bubble.is-user) .ai-md :deep(.ai-md__pre-wrap) {
  background: hsl(0 0% 100% / 0.14);
  border-color: hsl(0 0% 100% / 0.22);
}

:global(.ai-assistant-bubble.is-user) .ai-md :deep(.ai-md__code) {
  background: hsl(0 0% 100% / 0.18);
  color: inherit;
}

:global(.ai-assistant-bubble.is-user) .ai-md :deep(.ai-md__a) {
  color: inherit;
  text-decoration-color: hsl(0 0% 100% / 0.55);
}
</style>
