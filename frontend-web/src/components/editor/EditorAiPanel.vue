<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Clock, Plus, ArrowUp, Languages } from 'lucide-vue-next'
import { api } from '~/utils/api'
import type { ResumeData } from '~/stores/resume'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/Textarea'
import { Select } from '~/components/ui/Select'
import {
  detectResumeLanguage,
  getOppositeLanguage,
  getTranslateButtonLabel,
  getTranslatePrompt,
} from '~/utils/resumeLanguage'
import { AppIcon } from '~/components/ui/icon'
import { getAuthToken } from '~/utils/auth-session'
import { onEditorPaneScroll } from '~/composables/useRevealScrollbar'

const props = defineProps<{
  resumeId: string | number
  formData: ResumeData
  styleSettings?: Record<string, unknown>
}>()

const emit = defineEmits<{
  'apply-resume': [data: ResumeData]
  'apply-title': [title: string]
  'apply-style': [style: Record<string, unknown>]
}>()

interface ChatMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  resumeData?: ResumeData
  title?: string
  style?: Record<string, unknown>
}

interface ChatSessionItem {
  id: string
  title: string
  modelId?: string | null
  messageCount: number
  updatedAt: string
}

interface LlmModelOption {
  label: string
  value: string
  isDefault?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const models = ref<LlmModelOption[]>([])
const selectedModelId = ref('')
const modelsLoading = ref(false)
const promptSuggestions = ref<string[]>([])
const sessions = ref<ChatSessionItem[]>([])
const currentSessionId = ref<string | null>(null)
const showHistory = ref(false)

const modelOptions = computed(() =>
  models.value.map((m) => ({ label: m.label, value: m.value })),
)

const hasMessages = computed(() => messages.value.length > 0)

const parsedResumeId = computed(() => {
  const id = Number(props.resumeId)
  return Number.isFinite(id) && id > 0 ? id : null
})

const detectedLanguage = computed(() => detectResumeLanguage(props.formData))
const translateTargetLanguage = computed(() => getOppositeLanguage(detectedLanguage.value))
const translateButtonLabel = computed(() => getTranslateButtonLabel(translateTargetLanguage.value))

async function loadModels() {
  modelsLoading.value = true
  try {
    const res = await api.workflows.listLlmModels()
    const list = (res.data?.models || []) as LlmModelOption[]
    models.value = list
    if (!selectedModelId.value) {
      selectedModelId.value =
        res.data?.defaultModelId || list.find((m) => m.isDefault)?.value || list[0]?.value || ''
    }
  } catch (err) {
    console.error('加载模型列表失败:', err)
    models.value = []
  } finally {
    modelsLoading.value = false
  }
}

async function loadPrompts() {
  try {
    const res = await api.ai.chatPrompts(6)
    promptSuggestions.value = (res.data?.prompts || []) as string[]
  } catch {
    promptSuggestions.value = [
      '从招聘方视角分析我的简历，并给出优化建议',
      '优化我的经历描述，突出成果和量化数据',
      '根据我的全部经历，生成一段个人总结',
    ]
  }
}

async function loadSessions() {
  if (!parsedResumeId.value) return
  try {
    const res = await api.ai.listChatSessions(parsedResumeId.value)
    sessions.value = (res.data?.sessions || []) as ChatSessionItem[]
  } catch (err) {
    console.error('加载会话列表失败:', err)
    sessions.value = []
  }
}

function mapSessionMessages(raw: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>): ChatMessage[] {
  return raw.map((m) => {
    const meta = (m.metadata || {}) as Record<string, unknown>
    return {
      role: m.role as 'user' | 'assistant',
      content: m.content,
      resumeData: meta.resumeData as ResumeData | undefined,
      title: meta.title as string | undefined,
      style: meta.style as Record<string, unknown> | undefined,
    }
  })
}

async function openSession(sessionId: string) {
  try {
    const res = await api.ai.getChatSession(sessionId)
    const session = res.data?.session
    if (!session) return
    currentSessionId.value = session.id
    if (session.modelId) selectedModelId.value = session.modelId
    messages.value = mapSessionMessages(session.messages || [])
    showHistory.value = false
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('加载会话失败:', err)
  }
}

async function createNewSession() {
  if (!parsedResumeId.value) return
  try {
    const res = await api.ai.createChatSession({
      resumeId: parsedResumeId.value,
      modelId: selectedModelId.value || undefined,
    })
    const session = res.data?.session
    if (!session) return
    currentSessionId.value = session.id
    messages.value = []
    showHistory.value = false
    await loadSessions()
    await loadPrompts()
  } catch (err) {
    console.error('创建会话失败:', err)
  }
}

onMounted(async () => {
  if (!getAuthToken()) {
    promptSuggestions.value = [
      '从招聘方视角分析我的简历，并给出优化建议',
      '优化我的经历描述，突出成果和量化数据',
      '根据我的全部经历，生成一段个人总结',
    ]
    return
  }
  if (!parsedResumeId.value) return
  await Promise.all([loadModels(), loadPrompts(), loadSessions()])
})

async function sendMessage(
  text?: string,
  options?: { actionType?: 'chat' | 'translate' | 'translate_en' | 'translate_zh' },
) {
  const content = (text ?? inputMessage.value).trim()
  if (!content || isTyping.value) return
  if (!parsedResumeId.value) {
    messages.value.push({ role: 'assistant', content: '简历 ID 无效，请从「我的简历」重新进入编辑页' })
    return
  }
  if (!getAuthToken()) {
    messages.value.push({ role: 'assistant', content: '登录已失效，请重新登录后再使用 AI 编辑' })
    return
  }

  messages.value.push({ role: 'user', content })
  inputMessage.value = ''
  isTyping.value = true

  await nextTick()
  scrollToBottom()

  try {
    const res = await api.ai.resumeChat({
      resumeId: parsedResumeId.value,
      sessionId: currentSessionId.value || undefined,
      message: content,
      modelId: selectedModelId.value || undefined,
      actionType: options?.actionType || 'chat',
      resumeData: props.formData as Record<string, unknown>,
      style: props.styleSettings,
    })

    const data = res.data as {
      sessionId?: string
      message?: string
      resumeData?: ResumeData
      title?: string
      style?: Record<string, unknown>
    }

    if (data?.sessionId) {
      currentSessionId.value = data.sessionId
      await loadSessions()
    }

    messages.value.push({
      role: 'assistant',
      content: data?.message || '已完成处理。',
      resumeData: data?.resumeData,
      title: data?.title,
      style: data?.style,
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: err instanceof Error ? err.message : 'AI 请求失败，请稍后重试',
    })
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

function usePrompt(prompt: string) {
  inputMessage.value = prompt
}

function translateResume() {
  if (isTyping.value) return
  const target = translateTargetLanguage.value
  sendMessage(getTranslatePrompt(target), { actionType: 'translate' })
}

function applyAssistantMessage(msg: ChatMessage) {
  if (msg.resumeData) emit('apply-resume', msg.resumeData)
  if (msg.title) emit('apply-title', msg.title)
  if (msg.style) emit('apply-style', msg.style)
  messages.value.push({
    role: 'assistant',
    content: '已将修改应用到当前简历预览，记得保存。',
  })
  nextTick(() => scrollToBottom())
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatSessionTime(value: string) {
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 bg-muted/30">
    <!-- 顶栏 -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-background">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-foreground">AI 编辑</h3>
        <p class="text-xs text-muted-foreground truncate">对话修改简历，支持多模型</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          class="h-8 text-xs gap-1.5 text-muted-foreground"
          @click="showHistory = !showHistory; loadSessions()"
        >
          <AppIcon :icon="Clock" size="sm" />
          历史记录
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs gap-1"
          @click="createNewSession"
        >
          <AppIcon :icon="Plus" size="sm" />
          新建会话
        </Button>
      </div>
    </div>

    <!-- 历史会话面板 -->
    <div
      v-if="showHistory"
      class="shrink-0 border-b border-border bg-background max-h-48 overflow-y-auto"
    >
      <div v-if="!sessions.length" class="px-4 py-6 text-center text-xs text-muted-foreground">
        暂无历史会话
      </div>
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="w-full text-left px-4 py-2.5 hover:bg-muted/60 border-b border-border/50 last:border-0 transition-colors"
        :class="currentSessionId === session.id ? 'bg-primary/5' : ''"
        @click="openSession(session.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm truncate font-medium">{{ session.title }}</span>
          <span class="text-[10px] text-muted-foreground shrink-0">{{ formatSessionTime(session.updatedAt) }}</span>
        </div>
        <p class="text-[11px] text-muted-foreground mt-0.5">{{ session.messageCount }} 条消息</p>
      </button>
    </div>

    <!-- 对话区 -->
    <div
      ref="messagesContainer"
      class="editor-pane-scroll flex-1 px-4 py-4 min-h-0"
      @scroll="onEditorPaneScroll"
    >
      <!-- 空状态：推荐问题 -->
      <div v-if="!hasMessages" class="flex flex-col items-center justify-center min-h-full py-6">
        <p class="text-sm text-muted-foreground text-center mb-1">
          我可以帮你优化简历并解答各种求职问题
        </p>
        <p class="text-xs text-muted-foreground/80 mb-5">你可以这样问</p>
        <div class="w-full max-w-md space-y-2.5">
          <button
            v-for="(prompt, idx) in promptSuggestions"
            :key="idx"
            type="button"
            class="w-full text-left text-sm px-4 py-3 rounded-full border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-colors text-foreground/90"
            @click="usePrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="space-y-4 pb-2">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '']"
        >
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
              msg.role === 'user' ? 'bg-primary/15 text-primary' : 'bg-foreground text-background',
            ]"
          >
            {{ msg.role === 'user' ? '我' : 'AI' }}
          </div>
          <div :class="['max-w-[88%] space-y-2', msg.role === 'user' ? 'text-right' : '']">
            <div
              :class="[
                'rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap text-left leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border shadow-sm',
              ]"
            >
              {{ msg.content }}
            </div>
            <Button
              v-if="msg.role === 'assistant' && (msg.resumeData || msg.title || msg.style)"
              size="sm"
              variant="outline"
              class="text-xs h-7"
              @click="applyAssistantMessage(msg)"
            >
              应用到简历
            </Button>
          </div>
        </div>

        <div v-if="isTyping" class="flex gap-2.5">
          <div class="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
            AI
          </div>
          <div class="rounded-2xl px-3.5 py-2.5 bg-background border border-border shadow-sm">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay: 150ms" />
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="shrink-0 px-4 pb-4 pt-2 bg-muted/30">
      <div class="rounded-2xl border border-border bg-background shadow-sm">
        <Textarea
          v-model="inputMessage"
          rows="2"
          placeholder="描述你想修改的内容..."
          class="text-sm resize-none border-0 shadow-none focus-visible:ring-0 min-h-[4.5rem] px-4 pt-3 pb-2"
          @keydown.enter.exact.prevent="sendMessage()"
        />

        <!-- 快捷操作：仅简历翻译 -->
        <div class="px-3 pb-1">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            :disabled="isTyping"
            @click="translateResume"
          >
            <AppIcon :icon="Languages" size="sm" class="opacity-70" />
            {{ translateButtonLabel }}
          </button>
        </div>

        <!-- 模型 + 发送 -->
        <div class="flex items-center gap-2 px-3 pb-3">
          <Select
            v-model="selectedModelId"
            :options="modelOptions"
            :placeholder="modelsLoading ? '加载模型...' : '选择大模型'"
            :disabled="modelsLoading || modelOptions.length === 0"
            menu-placement="top"
            class="text-xs h-8 flex-1 min-w-0 border-0 bg-muted/40 rounded-lg"
          />
          <Button
            size="icon"
            class="h-9 w-9 rounded-full shrink-0"
            :disabled="!inputMessage.trim() || isTyping"
            @click="sendMessage()"
          >
            <AppIcon :icon="ArrowUp" size="sm" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
