<script setup lang="ts">
/**
 * 全局 AI 助手（公共组件）
 * - 可拖拽悬浮球 + 对话面板
 * - SSE 流式回复 + Skills 快捷操作
 * - Markdown / 代码块渲染
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Send, Sparkles, X } from 'lucide-vue-next'
import { api, type AssistantSkillAction } from '~/utils/api'
import { getAuthToken } from '~/utils/auth-session'
import { Button } from '~/components/ui/button'
import AiMarkdownContent from '~/components/ai-assistant/AiMarkdownContent.vue'
import { useLanguageStore } from '~/stores/language'
import { useResumeStore } from '~/stores/resume'
import { useTemplateStore } from '~/stores/template'

const POS_KEY = 'ai-assistant-fab-pos'
const TIP_LAST_SHOWN_KEY = 'ai-assistant-tip-last-shown'
/** 两次引导气泡最小间隔（页面切换也不刷太勤） */
const TIP_COOLDOWN_MS = 3 * 60 * 1000
/** 气泡自动收起 */
const TIP_AUTO_HIDE_MS = 4500
/** 进入页面后稍晚再弹出，避免抢首屏 */
const TIP_ENTER_DELAY_MS = 900

const AVATAR = 56
const PANEL_W = 380
const PANEL_H = 520
const GAP = 12
const EDGE = 16

const TIP_PHRASES_ZH = [
  '有疑问可以找我～',
  '不知道从哪开始？点我',
  '简历问题随时问我',
  '模板 / 工作流我都能答',
]

const TIP_PHRASES_EN = [
  'Got questions? Ask me',
  'Need a hand? Tap me',
  'Ask about resumes anytime',
  'Templates & workflows—ask away',
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  skills?: AssistantSkillAction[]
}

const langStore = useLanguageStore()
const resumeStore = useResumeStore()
const templateStore = useTemplateStore()
const isZh = computed(() => langStore.locale === 'zh')

function defaultSkills(): AssistantSkillAction[] {
  return [
    {
      id: 'create_resume_from_template',
      name: '根据模板创建简历',
      action: 'create_resume_from_template',
      label: isZh.value ? '打开模板中心创建' : 'Open templates',
      payload: { path: '/templates', autoCreate: false },
    },
    {
      id: 'start_smart_execution',
      name: '智能执行创建简历',
      action: 'start_smart_execution',
      label: isZh.value ? '打开智能执行' : 'Open smart execution',
      payload: { path: '/workflow/execution' },
    },
  ]
}

function welcomeText() {
  return isZh.value
    ? '你好，我是简流 AI 助手。可以问我简历制作、模板选择、工作流用法等问题。也可以说「用前端模板创建」或「打开智能执行」。'
    : 'Hi, I am the Jianliu AI assistant. Ask about resumes, templates, or workflows — try “create with frontend template” or “open smart execution”.'
}

const open = ref(false)
const tipVisible = ref(false)
const tipText = ref('')
const input = ref('')
const sending = ref(false)
const skillRunning = ref(false)
const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: welcomeText(),
    skills: defaultSkills(),
  },
])
const listRef = ref<HTMLElement | null>(null)
const abortRef = ref<AbortController | null>(null)
const streamingIndex = ref<number | null>(null)

const fabPos = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragMoved = ref(false)
let dragOrigin = { x: 0, y: 0, fabX: 0, fabY: 0 }
let tipHideTimer: ReturnType<typeof setTimeout> | null = null
let tipShowTimer: ReturnType<typeof setTimeout> | null = null
let tipPhraseIndex = 0
/** 本会话是否已展示过（首次进入可绕过冷却） */
let tipShownInSession = false

const route = useRoute()

const panelPos = computed(() => {
  if (!import.meta.client) return { left: 0, top: 0 }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { x, y } = fabPos.value

  let left = x + AVATAR - PANEL_W
  let top = y - PANEL_H - GAP

  if (top < EDGE) top = y + AVATAR + GAP
  if (top + PANEL_H > vh - EDGE) top = Math.max(EDGE, vh - PANEL_H - EDGE)
  if (left < EDGE) left = EDGE
  if (left + PANEL_W > vw - EDGE) left = Math.max(EDGE, vw - PANEL_W - EDGE)

  const overlapsAvatar =
    left < x + AVATAR &&
    left + PANEL_W > x &&
    top < y + AVATAR &&
    top + PANEL_H > y
  if (overlapsAvatar) {
    const rightLeft = x + AVATAR + GAP
    if (rightLeft + PANEL_W <= vw - EDGE) left = rightLeft
    else {
      const leftLeft = x - PANEL_W - GAP
      if (leftLeft >= EDGE) left = leftLeft
    }
  }

  return { left, top }
})

function defaultFabPos() {
  return {
    x: Math.max(EDGE, window.innerWidth - AVATAR - 24),
    y: Math.max(EDGE, window.innerHeight - AVATAR - 24),
  }
}

function clampFab(x: number, y: number) {
  return {
    x: Math.min(Math.max(EDGE, x), window.innerWidth - AVATAR - EDGE),
    y: Math.min(Math.max(EDGE, y), window.innerHeight - AVATAR - EDGE),
  }
}

function loadFabPos() {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { x?: number; y?: number }
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        fabPos.value = clampFab(parsed.x, parsed.y)
        return
      }
    }
  } catch {
    // ignore
  }
  fabPos.value = defaultFabPos()
}

function saveFabPos() {
  localStorage.setItem(POS_KEY, JSON.stringify(fabPos.value))
}

function clearTipTimers() {
  if (tipHideTimer) {
    clearTimeout(tipHideTimer)
    tipHideTimer = null
  }
  if (tipShowTimer) {
    clearTimeout(tipShowTimer)
    tipShowTimer = null
  }
}

function canShowTipByCooldown() {
  try {
    const raw = localStorage.getItem(TIP_LAST_SHOWN_KEY)
    const last = raw ? Number(raw) : 0
    if (!Number.isFinite(last) || last <= 0) return true
    return Date.now() - last >= TIP_COOLDOWN_MS
  } catch {
    return true
  }
}

function markTipShown() {
  try {
    localStorage.setItem(TIP_LAST_SHOWN_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

function nextTipPhrase() {
  const list = isZh.value ? TIP_PHRASES_ZH : TIP_PHRASES_EN
  const text = list[tipPhraseIndex % list.length]
  tipPhraseIndex += 1
  return text
}

/** 仅在面板关闭时展示；受冷却控制，避免打扰 */
function maybeShowTip(reason: 'enter' | 'route') {
  if (!import.meta.client) return
  if (open.value || dragging.value) return
  // 首次进入本会话可立即提示；之后仅路由切换且满足冷却
  if (reason === 'route' && !canShowTipByCooldown()) return
  if (reason === 'enter' && tipShownInSession && !canShowTipByCooldown()) return

  clearTipTimers()
  tipShowTimer = setTimeout(() => {
    tipShowTimer = null
    if (open.value || dragging.value) return
    if (reason === 'route' && !canShowTipByCooldown()) return

    tipText.value = nextTipPhrase()
    tipVisible.value = true
    tipShownInSession = true
    markTipShown()

    tipHideTimer = setTimeout(() => {
      tipVisible.value = false
      tipHideTimer = null
    }, TIP_AUTO_HIDE_MS)
  }, reason === 'enter' ? TIP_ENTER_DELAY_MS : 500)
}

function dismissTip() {
  clearTipTimers()
  tipVisible.value = false
  markTipShown()
}

function toggleOpen() {
  if (dragMoved.value) return
  open.value = !open.value
  if (open.value) dismissTip()
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  dragging.value = true
  dragMoved.value = false
  dragOrigin = { x: e.clientX, y: e.clientY, fabX: fabPos.value.x, fabY: fabPos.value.y }
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - dragOrigin.x
  const dy = e.clientY - dragOrigin.y
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved.value = true
  fabPos.value = clampFab(dragOrigin.fabX + dx, dragOrigin.fabY + dy)
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  if (dragMoved.value) saveFabPos()
}

function onWindowResize() {
  fabPos.value = clampFab(fabPos.value.x, fabPos.value.y)
}

async function scrollToBottom() {
  await nextTick()
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

function isFailedAssistantContent(content: string) {
  const t = content.trim()
  if (!t) return true
  return (
    /Internal Server Error/i.test(t) ||
    /请求失败|Request failed|出错了|Error:/i.test(t) ||
    /generated by l-resume-agent/i.test(t)
  )
}

async function runSkill(skill: AssistantSkillAction) {
  if (skillRunning.value) return
  skillRunning.value = true
  try {
    if (skill.action === 'start_smart_execution') {
      open.value = false
      await navigateTo(skill.payload?.path || '/workflow/execution')
      return
    }

    if (skill.action === 'create_resume_from_template') {
      const path = skill.payload?.path || '/templates'
      const autoCreate = Boolean(skill.payload?.autoCreate && skill.payload?.templateHint)

      if (!autoCreate) {
        open.value = false
        await navigateTo(path)
        return
      }

      if (!getAuthToken()) {
        open.value = false
        await navigateTo('/login')
        return
      }

      if (!templateStore.templates.length) {
        await templateStore.fetchTemplates()
      }

      const hint = skill.payload?.templateHint || ''
      const nameHint = skill.payload?.templateNameHint || ''
      const match =
        templateStore.templates.find(
          (t) =>
            t.themeKey === hint ||
            t.id === hint ||
            (nameHint && t.name.includes(nameHint)),
        ) || null

      if (!match) {
        open.value = false
        await navigateTo(path)
        return
      }

      const themeKey = templateStore.getThemeKey(match.id)
      const sampleData = templateStore.getSampleResumeData(match.id)
      const templateStyle = templateStore.getStyleForTemplate(match.id)
      const title = isZh.value ? `${match.name}模板简历` : `${match.name} Resume`
      const resume = await resumeStore.addResume(
        title,
        themeKey,
        sampleData,
        'template',
        templateStyle,
      )
      if (!resume) {
        messages.value.push({
          role: 'assistant',
          content: isZh.value
            ? '创建失败，请稍后重试或手动打开模板中心。'
            : 'Create failed. Please try again or open the template center.',
          skills: [
            {
              id: 'create_resume_from_template',
              name: '根据模板创建简历',
              action: 'create_resume_from_template',
              label: isZh.value ? '打开模板中心' : 'Open templates',
              payload: { path: '/templates', autoCreate: false },
            },
          ],
        })
        await scrollToBottom()
        return
      }

      resumeStore.setCurrentResumeId(String(resume.id))
      open.value = false
      await navigateTo(`/editor/${resume.id}`)
    }
  } finally {
    skillRunning.value = false
  }
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || sending.value) return

  dismissTip()
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  messages.value.push({ role: 'assistant', content: '', skills: [] })
  const assistantIndex = messages.value.length - 1
  streamingIndex.value = assistantIndex
  sending.value = true
  await scrollToBottom()

  const history = messages.value
    .slice(0, -2)
    .filter((m) => m.content.trim() && !isFailedAssistantContent(m.content))
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }))

  abortRef.value?.abort()
  const controller = new AbortController()
  abortRef.value = controller

  try {
    await api.ai.assistantChatStream(
      { message: text, history },
      {
        signal: controller.signal,
        onDelta: (delta) => {
          messages.value[assistantIndex].content += delta
          void scrollToBottom()
        },
        onSkills: (skills) => {
          messages.value[assistantIndex].skills = skills
          void scrollToBottom()
        },
        onError: (message) => {
          if (!messages.value[assistantIndex].content.trim()) {
            messages.value[assistantIndex].content = isZh.value
              ? `出错了：${message}`
              : `Error: ${message}`
          }
        },
      },
    )
    if (!messages.value[assistantIndex].content.trim()) {
      messages.value[assistantIndex].content = isZh.value
        ? '暂时没有收到回复，请稍后再试。'
        : 'No reply received. Please try again.'
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    const msg = ((err as Error).message || '').replace(/\s+/g, ' ').trim()
    messages.value[assistantIndex].content = isZh.value
      ? `请求失败：${msg || '请稍后重试'}`
      : `Request failed: ${msg || 'Please retry'}`
  } finally {
    sending.value = false
    streamingIndex.value = null
    abortRef.value = null
    await scrollToBottom()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}

watch(open, (v) => {
  if (v) {
    dismissTip()
    void scrollToBottom()
  }
})

watch(
  () => route.fullPath,
  (path, prev) => {
    if (!prev || path === prev) return
    maybeShowTip('route')
  },
)

onMounted(() => {
  loadFabPos()
  maybeShowTip('enter')
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  clearTipTimers()
  abortRef.value?.abort()
})
</script>

<template>
  <div class="ai-assistant-root">
    <Transition name="ai-panel">
      <div
        v-if="open"
        class="ai-assistant-panel"
        :style="{ left: `${panelPos.left}px`, top: `${panelPos.top}px`, width: `${PANEL_W}px`, height: `${PANEL_H}px` }"
        role="dialog"
        aria-label="AI Assistant"
      >
        <header class="ai-assistant-panel__header">
          <div class="flex items-center gap-2 min-w-0">
            <img
              src="/images/ai-assistant-avatar.png?v=2"
              alt=""
              class="ai-assistant-panel__avatar"
              width="28"
              height="28"
            />
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-foreground truncate">
                {{ isZh ? '简流 AI 助手' : 'Jianliu AI Assistant' }}
              </h3>
              <p class="text-[11px] text-muted-foreground truncate">
                {{ isZh ? 'RAG · Skills · 产品与简历' : 'RAG · Skills · Product & resume' }}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" class="size-8 shrink-0" @click="open = false">
            <X class="size-4" />
          </Button>
        </header>

        <div ref="listRef" class="ai-assistant-panel__messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="[
              'ai-assistant-bubble',
              msg.role === 'user' ? 'is-user' : 'is-assistant',
              msg.role === 'assistant' && sending && streamingIndex === idx && !msg.content.trim()
                ? 'is-streaming-empty'
                : '',
            ]"
          >
            <AiMarkdownContent
              :content="msg.content"
              :streaming="sending && streamingIndex === idx"
              :placeholder="isZh ? '思考中…' : 'Thinking…'"
            />
            <div v-if="msg.skills?.length" class="ai-assistant-skills">
              <button
                v-for="skill in msg.skills"
                :key="`${idx}-${skill.id}-${skill.label}`"
                type="button"
                class="ai-assistant-skill-btn"
                :disabled="skillRunning || sending"
                @click="runSkill(skill)"
              >
                <Sparkles class="size-3.5 shrink-0 opacity-80" />
                <span>{{ skill.label || skill.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <footer class="ai-assistant-panel__footer">
          <textarea
            v-model="input"
            rows="2"
            class="ai-assistant-input"
            :placeholder="isZh ? '输入问题，Enter 发送 · Shift+Enter 换行' : 'Ask anything · Enter to send'"
            :disabled="sending"
            @keydown="onKeydown"
          />
          <Button
            size="icon"
            class="size-9 shrink-0"
            :disabled="sending || !input.trim()"
            @click="sendMessage"
          >
            <Send class="size-4" />
          </Button>
        </footer>
      </div>
    </Transition>

    <Transition name="ai-tip">
      <div
        v-if="tipVisible && !open"
        class="ai-assistant-tip"
        :style="{ left: `${fabPos.x + AVATAR / 2}px`, top: `${fabPos.y - 8}px` }"
        @click="dismissTip"
      >
        <span>{{ tipText }}</span>
        <i class="ai-assistant-tip__arrow" />
      </div>
    </Transition>

    <button
      type="button"
      class="ai-assistant-fab"
      :class="{ 'is-dragging': dragging, 'is-open': open }"
      :style="{ left: `${fabPos.x}px`, top: `${fabPos.y}px`, width: `${AVATAR}px`, height: `${AVATAR}px` }"
      :aria-label="isZh ? '打开 AI 助手' : 'Open AI assistant'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="toggleOpen"
    >
      <img
        src="/images/ai-assistant-avatar.png?v=2"
        alt=""
        class="ai-assistant-fab__img"
        draggable="false"
      />
    </button>
  </div>
</template>

<style scoped>
.ai-assistant-root {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.ai-assistant-fab,
.ai-assistant-panel,
.ai-assistant-tip {
  pointer-events: auto;
}

.ai-assistant-fab {
  position: fixed;
  z-index: 82;
  border: 2px solid hsl(var(--background));
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  background: hsl(var(--primary) / 0.08);
  box-shadow:
    0 10px 28px -8px hsl(var(--primary) / 0.45),
    0 4px 12px hsl(var(--foreground) / 0.08);
  cursor: grab;
  touch-action: none;
  transition: box-shadow 0.18s ease;
  animation: ai-fab-float 2.8s ease-in-out infinite;
  will-change: transform;
}

.ai-assistant-fab__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.ai-assistant-fab:hover {
  animation-name: ai-fab-float-hover;
}

.ai-assistant-fab.is-dragging {
  cursor: grabbing;
  animation: none;
  transform: scale(1.08);
}

.ai-assistant-fab.is-open {
  box-shadow:
    0 0 0 4px hsl(var(--primary) / 0.18),
    0 10px 28px -8px hsl(var(--primary) / 0.55);
}

@keyframes ai-fab-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes ai-fab-float-hover {
  0%,
  100% {
    transform: translateY(0) scale(1.05);
  }
  50% {
    transform: translateY(-7px) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-assistant-fab,
  .ai-assistant-fab:hover {
    animation: none;
  }
}

.ai-assistant-panel {
  position: fixed;
  z-index: 81;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  box-shadow:
    0 24px 48px -20px hsl(var(--foreground) / 0.28),
    0 8px 20px hsl(var(--foreground) / 0.06);
}

.ai-assistant-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.35);
}

.ai-assistant-panel__avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid hsl(var(--border));
}

.ai-assistant-panel__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: hsl(var(--muted) / 0.2);
}

.ai-assistant-bubble {
  max-width: 92%;
  min-width: 4.5rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.ai-assistant-bubble.is-user {
  align-self: flex-end;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-bottom-right-radius: 0.3rem;
}

.ai-assistant-bubble.is-assistant {
  align-self: flex-start;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-bottom-left-radius: 0.3rem;
}

.ai-assistant-bubble.is-assistant.is-streaming-empty {
  min-width: 6.5rem;
}

.ai-assistant-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.55rem;
}

.ai-assistant-skill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  padding: 0.3rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid hsl(var(--primary) / 0.35);
  background: hsl(var(--primary) / 0.08);
  color: hsl(var(--primary));
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.ai-assistant-skill-btn:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.14);
  border-color: hsl(var(--primary) / 0.55);
}

.ai-assistant-skill-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ai-assistant-panel__footer {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--background));
}

.ai-assistant-input {
  flex: 1;
  min-width: 0;
  resize: none;
  border-radius: 0.75rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.35);
  padding: 0.55rem 0.7rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: hsl(var(--foreground));
  outline: none;
}

.ai-assistant-input:focus {
  border-color: hsl(var(--primary) / 0.55);
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12);
}

.ai-assistant-tip {
  position: fixed;
  z-index: 83;
  transform: translate(-50%, -100%);
  max-width: 12rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid hsl(var(--primary) / 0.28);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  box-shadow:
    0 10px 28px -12px hsl(var(--primary) / 0.35),
    0 4px 12px hsl(var(--foreground) / 0.06);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  backdrop-filter: blur(8px);
}

.ai-assistant-tip:hover {
  border-color: hsl(var(--primary) / 0.45);
  background: hsl(var(--primary) / 0.06);
}

.ai-assistant-tip__arrow {
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  transform: translateX(-50%) rotate(45deg);
  background: hsl(var(--card));
  border-right: 1px solid hsl(var(--primary) / 0.28);
  border-bottom: 1px solid hsl(var(--primary) / 0.28);
  box-shadow: 2px 2px 4px hsl(var(--foreground) / 0.04);
}

.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.ai-tip-enter-active,
.ai-tip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ai-tip-enter-from,
.ai-tip-leave-to {
  opacity: 0;
  transform: translate(-50%, -90%) scale(0.96);
}
</style>
