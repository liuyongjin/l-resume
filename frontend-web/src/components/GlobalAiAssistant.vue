<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Send, Sparkles, X } from 'lucide-vue-next'
import { api, type AssistantSkillAction } from '~/utils/api'
import { getAuthToken } from '~/utils/auth-session'
import { Button } from '~/components/ui/button'
import { useLanguageStore } from '~/stores/language'
import { useResumeStore } from '~/stores/resume'
import { useTemplateStore } from '~/stores/template'

const POS_KEY = 'ai-assistant-fab-pos'
const TIP_KEY = 'ai-assistant-tip-seen'

const AVATAR = 56
const PANEL_W = 360
const PANEL_H = 480
const GAP = 12
const EDGE = 16

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  skills?: AssistantSkillAction[]
}

const langStore = useLanguageStore()
const resumeStore = useResumeStore()
const templateStore = useTemplateStore()
const isZh = computed(() => langStore.locale === 'zh')

const open = ref(false)
const tipVisible = ref(false)
const input = ref('')
const sending = ref(false)
const skillRunning = ref(false)
const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: isZh.value
      ? '你好，我是简流 AI 助手。可以问我简历制作、模板选择、工作流用法等问题。也可以说「用前端模板创建」或「打开智能执行」。'
      : 'Hi, I am the Jianliu AI assistant. Ask about resumes, templates, or workflows — try “create with frontend template” or “open smart execution”.',
    skills: [
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
    ],
  },
])
const listRef = ref<HTMLElement | null>(null)
const abortRef = ref<AbortController | null>(null)

const fabPos = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragMoved = ref(false)
let dragOrigin = { x: 0, y: 0, fabX: 0, fabY: 0 }

const tipText = computed(() =>
  isZh.value ? '有问题可以点我聊聊～' : 'Need help? Tap me anytime.',
)

const panelPos = computed(() => {
  if (!import.meta.client) return { left: 0, top: 0 }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { x, y } = fabPos.value

  // Prefer open to the left and above the avatar
  let left = x + AVATAR - PANEL_W
  let top = y - PANEL_H - GAP

  // If not enough space above, open below
  if (top < EDGE) {
    top = y + AVATAR + GAP
  }
  // If still overflowing bottom, clamp
  if (top + PANEL_H > vh - EDGE) {
    top = Math.max(EDGE, vh - PANEL_H - EDGE)
  }
  // Horizontal clamp
  if (left < EDGE) left = EDGE
  if (left + PANEL_W > vw - EDGE) left = Math.max(EDGE, vw - PANEL_W - EDGE)

  // Avoid covering the avatar as much as possible when clamped
  const overlapsAvatar =
    left < x + AVATAR &&
    left + PANEL_W > x &&
    top < y + AVATAR &&
    top + PANEL_H > y
  if (overlapsAvatar) {
    // Try right side of avatar
    const rightLeft = x + AVATAR + GAP
    if (rightLeft + PANEL_W <= vw - EDGE) {
      left = rightLeft
    } else {
      // Try left side of avatar
      const leftLeft = x - PANEL_W - GAP
      if (leftLeft >= EDGE) left = leftLeft
    }
  }

  return { left, top }
})

function defaultFabPos() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: Math.max(EDGE, vw - AVATAR - 24),
    y: Math.max(EDGE, vh - AVATAR - 24),
  }
}

function clampFab(x: number, y: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: Math.min(Math.max(EDGE, x), vw - AVATAR - EDGE),
    y: Math.min(Math.max(EDGE, y), vh - AVATAR - EDGE),
  }
}

function loadFabPos() {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) {
      fabPos.value = defaultFabPos()
      return
    }
    const parsed = JSON.parse(raw) as { x?: number; y?: number }
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      fabPos.value = clampFab(parsed.x, parsed.y)
      return
    }
  } catch {
    // ignore
  }
  fabPos.value = defaultFabPos()
}

function saveFabPos() {
  localStorage.setItem(POS_KEY, JSON.stringify(fabPos.value))
}

function showTipIfNeeded() {
  if (localStorage.getItem(TIP_KEY) === '1') return
  tipVisible.value = true
}

function dismissTip() {
  tipVisible.value = false
  localStorage.setItem(TIP_KEY, '1')
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
  sending.value = true
  await scrollToBottom()

  const history = messages.value
    .slice(0, -2)
    .filter((m) => m.content.trim())
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
          if (!messages.value[assistantIndex].content) {
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
    messages.value[assistantIndex].content = isZh.value
      ? `请求失败：${(err as Error).message || '请稍后重试'}`
      : `Request failed: ${(err as Error).message || 'Please retry'}`
  } finally {
    sending.value = false
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
  if (v) void scrollToBottom()
})

onMounted(() => {
  loadFabPos()
  showTipIfNeeded()
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  abortRef.value?.abort()
})
</script>

<template>
  <div class="ai-assistant-root">
    <!-- Chat panel -->
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
            :class="['ai-assistant-bubble', msg.role === 'user' ? 'is-user' : 'is-assistant']"
          >
            <p class="whitespace-pre-wrap break-words">{{ msg.content || (sending && idx === messages.length - 1 ? '…' : '') }}</p>
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
            :placeholder="isZh ? '输入问题，Enter 发送' : 'Ask anything, Enter to send'"
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

    <!-- Tip bubble -->
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

    <!-- Draggable FAB -->
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

.ai-assistant-panel__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.6rem;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  flex-shrink: 0;
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
  max-width: 88%;
  padding: 0.65rem 0.8rem;
  border-radius: 0.85rem;
  font-size: 0.8125rem;
  line-height: 1.5;
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
  padding: 0.45rem 0.7rem;
  border-radius: 0.75rem;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
  font-size: 0.75rem;
  line-height: 1.35;
  box-shadow: 0 8px 20px hsl(var(--foreground) / 0.2);
  cursor: pointer;
  white-space: nowrap;
}

.ai-assistant-tip__arrow {
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 10px;
  height: 10px;
  transform: translateX(-50%) rotate(45deg);
  background: hsl(var(--foreground));
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
