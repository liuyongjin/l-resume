<template>
  <div class="flex flex-col flex-1 min-h-0 bg-muted/30">
    <!-- 顶部操作栏 -->
    <div class="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border/60 glass-header">
      <div class="min-w-0">
        <h1 class="text-base font-semibold text-foreground tracking-tight">智能执行</h1>
        <p class="text-xs text-muted-foreground truncate mt-0.5">{{ workflowLabel }}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" class="h-9 text-xs hidden sm:inline-flex" @click="navigateTo('/workflow/executions')">
          查看历史执行流程
        </Button>
        <Button
          size="sm"
          class="h-9 min-w-[120px] shadow-sm"
          @click="executeWorkflow"
          :disabled="isExecuting || !canStartExecution || pageLoading"
        >
          <Spinner v-if="isExecuting" class="size-3.5 text-primary-foreground" />
          {{ isExecuting ? '执行中...' : '开始执行' }}
        </Button>
      </div>
    </div>

    <LoadingState v-if="pageLoading" class="flex-1 min-h-[20rem]" text="加载智能执行..." />

    <!-- 三栏布局：小屏整页滚动，大屏各栏独立滚动 -->
    <div v-else class="flex flex-1 min-h-0 flex-col xl:flex-row gap-0 overflow-y-auto xl:overflow-hidden">
      <!-- 左栏：执行配置 -->
      <aside class="xl:w-[260px] shrink-0 border-r border-border bg-card p-4 space-y-4 xl:min-h-0 xl:overflow-y-auto execution-scroll">
        <div>
          <h2 class="text-base font-semibold text-foreground">执行配置</h2>
          <p class="text-xs text-muted-foreground mt-0.5">配置本次智能执行的参数</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <Label class="text-sm shrink-0">工作流版本</Label>
            <span v-if="versionsLoading || workflowVersionLoading" class="text-[11px] text-muted-foreground">加载中...</span>
          </div>
          <p class="text-xs text-muted-foreground -mt-1">切换后将重新加载对应版本的智能体流程</p>
          <Select
            v-if="workflowVersions.length > 0"
            :model-value="selectedVersionId ?? ''"
            :options="versionOptions"
            placeholder="选择工作流版本"
            :disabled="isExecuting || versionsLoading || workflowVersionLoading"
            @update:model-value="onVersionSelect"
          />
          <p v-else-if="!versionsLoading" class="text-xs text-muted-foreground py-1">
            暂无版本记录
          </p>
        </div>

        <Separator />

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <Label class="text-sm shrink-0">输出模板</Label>
            <span class="text-[11px] text-muted-foreground">已选 {{ selectedTemplateIds.length }}/{{ MAX_TEMPLATE_SELECTION }}</span>
          </div>
          <p class="text-xs text-muted-foreground -mt-1">最多同时选择 {{ MAX_TEMPLATE_SELECTION }} 种模板</p>
          <MultiSelect
            v-model="selectedTemplateIds"
            :options="templateOptions"
            :max="MAX_TEMPLATE_SELECTION"
            placeholder="选择输出模板"
            :disabled="isExecuting"
            @max-exceeded="onTemplateMaxExceeded"
          />
        </div>

        <div class="space-y-2">
          <Label class="text-sm">输出语言</Label>
          <p class="text-xs text-muted-foreground -mt-1">至少选择中文或英文其中一种</p>
          <div
            :class="[
              'flex gap-4 rounded-lg border px-3 py-2.5 transition-colors',
              !hasSelectedLanguage ? 'border-destructive/50 bg-destructive/5' : 'border-transparent'
            ]"
          >
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                class="rounded border-border text-primary"
                :checked="langChinese"
                @change="toggleLanguage('zh', ($event.target as HTMLInputElement).checked, $event)"
              />
              中文
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                class="rounded border-border text-primary"
                :checked="langEnglish"
                @change="toggleLanguage('en', ($event.target as HTMLInputElement).checked, $event)"
              />
              英文
            </label>
          </div>
          <p v-if="!hasSelectedLanguage" class="text-xs text-destructive">
            请至少选择一种输出语言（中文或英文）
          </p>
        </div>

        <div class="space-y-2">
          <Label class="text-sm">基础信息来源</Label>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf,.doc,.docx,.txt,.md"
            @change="handleFileUpload"
          />

          <!-- 未上传：显示上传按钮 -->
          <Button
            v-if="!uploadedFile"
            type="button"
            variant="outline"
            class="w-full h-auto flex-col gap-2 p-5 border-dashed"
            :disabled="isUploading"
            @click="triggerFileUpload"
          >
            <Spinner v-if="isUploading" class="size-6 text-primary" />
            <Upload v-else class="size-6 text-muted-foreground" />
            <span class="text-sm font-medium text-foreground">
              {{ isUploading ? '上传中...' : langStore.t.execution.attachmentPlaceholder }}
            </span>
            <span class="text-xs text-muted-foreground font-normal">{{ langStore.t.execution.attachmentFormat }}</span>
          </Button>

          <!-- 已上传：显示文件信息 -->
          <div
            v-else
            class="p-3 rounded-lg border border-border bg-muted/30"
          >
            <div class="flex items-start gap-2">
              <FileText class="size-5 text-primary shrink-0 mt-0.5" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-foreground truncate">{{ uploadedFile.fileName }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ formatFileSize(uploadedFile.fileSize) }} · {{ formatUploadDate(uploadedFile.uploadedAt) }}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                :disabled="isUploading"
                @click="clearFiles"
              >
                <X class="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="w-full mt-2 h-7 text-xs"
              :disabled="isUploading"
              @click="triggerFileUpload"
            >
              {{ langStore.t.execution.attachmentReplace }}
            </Button>
          </div>
        </div>

        <p class="text-[11px] text-muted-foreground text-center">预计耗时 1-2 分钟 · 点击顶部「开始执行」</p>
      </aside>

      <!-- 中栏：execute 接口完整执行流程 -->
      <ExecutionFlowPanel :steps="executionSteps" />

      <!-- 右栏：进度与输出 -->
      <aside class="xl:w-[300px] shrink-0 border-l border-border bg-card xl:min-h-0 xl:overflow-y-auto execution-scroll">
        <div class="p-4 space-y-4">
          <div class="space-y-3">
            <h2 class="text-base font-semibold text-foreground">执行进度</h2>
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">{{ currentAgentLabel }}</span>
                <span class="font-medium text-foreground">{{ progress }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-500" :style="{ width: progress + '%' }" />
              </div>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold text-foreground">输出结果</h3>
            <p class="text-xs text-muted-foreground">将生成 {{ totalOutputs }} 份简历（{{ selectedTemplateIds.length }} 模板 × {{ langCount }} 语言）</p>
          </div>

          <div class="flex gap-1 border-b border-border">
            <Button
              v-for="tab in outputTabs"
              :key="tab.key"
              variant="ghost"
              size="sm"
              class="h-8 px-3 text-xs rounded-none border-b-2 -mb-px"
              :class="outputTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'"
              @click="outputTab = tab.key"
            >
              {{ tab.label }} ({{ tab.count }})
            </Button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="preview in filteredPreviews"
              :key="preview.id"
              class="aspect-[3/4] rounded-lg border border-border bg-muted/30 overflow-hidden relative group"
            >
              <div class="absolute inset-x-0 top-0 z-10 px-1.5 py-1 bg-card/90 border-b border-border/50">
                <p class="text-[11px] font-medium text-foreground truncate leading-snug" :title="getTemplateName(preview.templateId)">
                  {{ getTemplateName(preview.templateId) }}
                </p>
                <p class="text-[9px] text-muted-foreground">{{ preview.lang === 'zh' ? '中文' : '英文' }}</p>
              </div>
              <div class="absolute inset-0 p-2 flex flex-col">
                <div class="flex-1 bg-card rounded shadow-sm p-2 space-y-1">
                  <div class="h-2 bg-foreground/20 rounded w-2/3" />
                  <div class="h-1 bg-muted-foreground/20 rounded w-full" />
                  <div class="h-1 bg-muted-foreground/20 rounded w-4/5" />
                  <div class="h-1.5 bg-foreground/15 rounded w-1/3 mt-2" />
                  <div class="h-1 bg-muted-foreground/20 rounded w-full" />
                </div>
              </div>
              <div
                :class="[
                  'absolute inset-0 flex items-center justify-center text-xs font-medium',
                  preview.status === 'generating' ? 'bg-primary/10 text-primary' : '',
                  preview.status === 'waiting' ? 'bg-muted/60 text-muted-foreground' : '',
                  preview.status === 'done'
                    ? 'opacity-0 group-hover:opacity-100 bg-black/40 text-white transition-opacity cursor-pointer hover:bg-black/50'
                    : ''
                ]"
                @click="openOutputPreview(preview)"
              >
                {{ previewStatusText(preview.status) }}
              </div>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            生成完成后，您可以在 <a href="/resume" class="text-primary hover:underline">简历管理</a> 中查看和下载
          </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', ssr: false })

import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useLanguageStore } from '~/stores/language'
import { useTemplateStore } from '~/stores/template'
import { api } from '~/utils/api'
import { FileText, Upload, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/Label'
import { Separator } from '~/components/ui/Separator'
import ExecutionFlowPanel from '~/components/workflow/ExecutionFlowPanel.vue'
import LoadingState from '~/components/ui/LoadingState.vue'
import {
  mapStepLogsToFlowSteps,
  type ExecutionFlowStep,
  type ExecutionStepLog,
} from '~/utils/executionStepDisplay'
import { Spinner } from '~/components/ui/spinner'
import { Select } from '~/components/ui/Select'
import { MultiSelect } from '~/components/ui/MultiSelect'
import {
  fetchLatestWorkflow,
  parseWorkflowExecutionNodes,
  type WorkflowExecutionNodeItem,
  type WorkflowVersionListItem,
} from '~/utils/defaultWorkflow'
import { useResumeStore } from '~/stores/resume'
import { useAppToast } from '~/composables/useAppToast'

const MAX_TEMPLATE_SELECTION = 3

const langStore = useLanguageStore()
const templateStore = useTemplateStore()
const toast = useAppToast()
const resumeStore = useResumeStore()

const pageLoading = ref(true)

const currentWorkflow = ref<any>(null)
const currentWorkflowId = ref<number | null>(null)
const selectedVersionId = ref<number | null>(null)
const workflowVersions = ref<WorkflowVersionListItem[]>([])
const versionsLoading = ref(false)
const workflowVersionLoading = ref(false)

const workflowLabel = computed(() => {
  const name = currentWorkflow.value?.name || '简历优化工作流'
  const version = currentWorkflow.value?.version
  return version ? `${name} v${version}` : name
})

const applyWorkflowToPage = (workflow: Record<string, unknown>) => {
  currentWorkflow.value = workflow
  currentWorkflowId.value = workflow.id as number
  selectedVersionId.value = workflow.id as number
  workflowAgents.value = parseWorkflowExecutionNodes(workflow.nodes, workflow.connections)
}

const loadWorkflowGraphByVersionId = async (versionId: number) => {
  workflowVersionLoading.value = true
  try {
    const graphResult = await api.workflows.getGraph(versionId)
    if (graphResult.success && graphResult.data) {
      const versionMeta = workflowVersions.value.find((item) => item.id === versionId)
      applyWorkflowToPage({
        id: graphResult.data.workflowId,
        version: graphResult.data.version ?? versionMeta?.version,
        name: graphResult.data.name,
        nodes: graphResult.data.nodes,
        connections: graphResult.data.connections,
      })
      return true
    }

    const detailResult = await api.workflows.getVersion(versionId)
    if (detailResult.success && detailResult.data) {
      applyWorkflowToPage(detailResult.data as Record<string, unknown>)
      return true
    }

    toast.error('加载工作流版本失败')
    return false
  } catch (error) {
    console.error('加载工作流版本失败:', error)
    toast.error('加载工作流版本失败')
    return false
  } finally {
    workflowVersionLoading.value = false
  }
}

const loadInitialWorkflow = async () => {
  versionsLoading.value = true
  try {
    const { versions, workflow } = await fetchLatestWorkflow(
      () => api.workflows.listVersions(),
      (versionId) => api.workflows.getVersion(versionId),
    )
    workflowVersions.value = versions
    const latestId = versions[0]?.id
    if (latestId) {
      await loadWorkflowGraphByVersionId(latestId)
    } else if (workflow) {
      applyWorkflowToPage(workflow)
    }
  } catch (error) {
    console.error('加载工作流失败:', error)
  } finally {
    versionsLoading.value = false
  }
}

const versionOptions = computed(() =>
  workflowVersions.value.map((item) => ({
    label: `v${item.version}${item.isDefault ? ' (当前)' : ''}`,
    value: item.id,
  })),
)

const onVersionSelect = async (value: string | number) => {
  const id = Number(value)
  if (!Number.isFinite(id) || id === selectedVersionId.value || isExecuting.value) return
  const item = workflowVersions.value.find((v) => v.id === id)
  if (!item) return
  const ok = await loadWorkflowGraphByVersionId(item.id)
  if (ok) {
    toast.success(`已切换至工作流 v${item.version}`)
  }
}

const onTemplateMaxExceeded = () => {
  toast.warning(`最多同时选择 ${MAX_TEMPLATE_SELECTION} 个模板，请先取消已选模板后再添加`)
}

onMounted(async () => {
  pageLoading.value = true
  try {
    await templateStore.fetchTemplates()
    if (templateStore.templateListItems.length > 0) {
      selectedTemplateIds.value = [templateStore.templateListItems[0].id]
    }
    await loadInitialWorkflow()
    initOutputPreviews()
  } finally {
    pageLoading.value = false
  }
})

const isExecuting = ref(false)
const isUploading = ref(false)
const progress = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

interface UploadedResumeFile {
  fileName: string
  fileSize: number
  uploadedAt: string
  filePath: string
}

const uploadedFile = ref<UploadedResumeFile | null>(null)
const outputTab = ref<'all' | 'zh' | 'en'>('all')
const selectedTemplateIds = ref<string[]>([])
const langChinese = ref(true)
const langEnglish = ref(false)

const hasSelectedLanguage = computed(() => langChinese.value || langEnglish.value)

const canStartExecution = computed(() =>
  Boolean(currentWorkflowId.value)
  && Boolean(uploadedFile.value)
  && selectedTemplateIds.value.length > 0
  && selectedTemplateIds.value.length <= MAX_TEMPLATE_SELECTION
  && hasSelectedLanguage.value
)

const toggleLanguage = (lang: 'zh' | 'en', checked: boolean, event?: Event) => {
  const otherSelected = lang === 'zh' ? langEnglish.value : langChinese.value
  if (!checked && !otherSelected) {
    if (event?.target instanceof HTMLInputElement) {
      event.target.checked = true
    }
    toast.warning('请至少选择一种输出语言（中文或英文）')
    return
  }
  if (lang === 'zh') langChinese.value = checked
  else langEnglish.value = checked
}

const styleOptions = computed(() =>
  templateStore.templateListItems.map((t) => ({
    id: t.id,
    name: t.name,
    primaryColor: t.primaryColor,
  })),
)

const templateOptions = computed(() =>
  styleOptions.value.map((style) => ({
    label: style.name,
    value: style.id,
    primaryColor: style.primaryColor,
  })),
)

const config = reactive({
  targetPosition: '',
  industry: 'tech',
  experience: 'mid',
})

/** 同一配置下重复点击「开始执行」共用此 key，防止重复生成 */
const executionIdempotencyKey = ref<string | null>(null)

const buildExecutionIdempotencyKey = () => {
  const filePath = uploadedFile.value?.filePath ?? 'none'
  const templates = selectedTemplateIds.value.join(',')
  const langs = [langChinese.value && 'zh', langEnglish.value && 'en'].filter(Boolean).join(',')
  return `exec-${filePath}-${templates}-${langs}-${config.targetPosition}-${config.industry}-${config.experience}`
}

watch([uploadedFile, selectedTemplateIds, langChinese, langEnglish, () => config.targetPosition, () => config.industry, () => config.experience], () => {
  executionIdempotencyKey.value = null
})

const getTemplateName = (templateId: string) => templateStore.getTemplateName(templateId)

watch([langChinese, langEnglish, selectedTemplateIds], () => {
  initOutputPreviews()
}, { deep: true })

const workflowAgents = ref<WorkflowExecutionNodeItem[]>([])
const executionSteps = ref<ExecutionFlowStep[]>([])

interface OutputPreview {
  id: string
  templateId: string
  lang: 'zh' | 'en'
  status: 'waiting' | 'generating' | 'done'
  resumeId?: number
}

const outputPreviews = ref<OutputPreview[]>([])

const langCount = computed(() => (langChinese.value ? 1 : 0) + (langEnglish.value ? 1 : 0))

const initOutputPreviews = () => {
  const items: OutputPreview[] = []
  for (const templateId of selectedTemplateIds.value) {
    if (langChinese.value) {
      items.push({ id: `${templateId}-zh`, templateId, lang: 'zh', status: 'waiting' })
    }
    if (langEnglish.value) {
      items.push({ id: `${templateId}-en`, templateId, lang: 'en', status: 'waiting' })
    }
  }
  outputPreviews.value = items
}

const setPreviewDone = (templateId: string, lang: 'zh' | 'en', resumeId?: number) => {
  const preview = outputPreviews.value.find((p) => p.templateId === templateId && p.lang === lang)
  if (!preview) return
  preview.status = 'done'
  if (resumeId != null) preview.resumeId = resumeId
}

initOutputPreviews()

const totalOutputs = computed(() => outputPreviews.value.length)
const zhCount = computed(() => outputPreviews.value.filter(p => p.lang === 'zh').length)
const enCount = computed(() => outputPreviews.value.filter(p => p.lang === 'en').length)

const outputTabs = computed(() => [
  { key: 'all' as const, label: '全部', count: totalOutputs.value },
  { key: 'zh' as const, label: '中文', count: zhCount.value },
  { key: 'en' as const, label: '英文', count: enCount.value }
])

const filteredPreviews = computed(() => {
  if (outputTab.value === 'all') return outputPreviews.value
  return outputPreviews.value.filter(p => p.lang === (outputTab.value === 'zh' ? 'zh' : 'en'))
})

const currentAgentLabel = computed(() => {
  if (progress.value >= 100 && !isExecuting.value) return '执行完成'
  const active = workflowAgents.value.find(a => a.status === 'active')
  if (active) return `执行中：${active.name}`
  if (currentRunningStep.value) return `执行中：${currentRunningStep.value}`
  if (progress.value >= 100) return '执行完成'
  return '等待开始'
})

const previewStatusText = (status: string) => {
  if (status === 'generating') return '生成中...'
  if (status === 'done') return '预览'
  return '等待中'
}

const openOutputPreview = (preview: OutputPreview) => {
  if (preview.status !== 'done') return
  if (!preview.resumeId) {
    toast.warning('简历尚未保存完成，请稍后再试')
    return
  }
  navigateTo(`/preview/${preview.resumeId}`)
}

const showAlert = (message: string, variant: 'warning' | 'error' = 'warning') => {
  if (variant === 'error') toast.error(message)
  else toast.warning(message)
}

const validateConfig = () => {
  if (!uploadedFile.value) {
    showAlert('请先上传简历文件')
    return false
  }
  if (selectedTemplateIds.value.length === 0) {
    showAlert('请至少选择一个输出模板')
    return false
  }
  if (selectedTemplateIds.value.length > MAX_TEMPLATE_SELECTION) {
    showAlert(`最多同时选择 ${MAX_TEMPLATE_SELECTION} 个模板`)
    return false
  }
  if (!hasSelectedLanguage.value) {
    showAlert('请至少选择一种输出语言（中文或英文）')
    return false
  }
  return true
}

const logs = ref<any[]>([])

const triggerFileUpload = () => {
  if (!isUploading.value) fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const result = await api.resumes.upload(file)
    if (result.success && result.data) {
      uploadedFile.value = {
        fileName: file.name || result.data.fileName,
        fileSize: result.data.fileSize ?? file.size,
        uploadedAt: result.data.uploadedAt,
        filePath: result.data.filePath,
      }
    } else {
      showAlert(result.error?.message || result.message || '上传失败', 'error')
    }
  } catch (err: any) {
    showAlert(err.message || '上传失败', 'error')
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const clearFiles = () => {
  uploadedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatUploadDate = (iso: string) => {
  const date = new Date(iso)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const addLog = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.push({ time, message, type })
}

const callApi = async (
  apiCall: () => Promise<any>,
  errorMsg: string,
  successMsg?: string
): Promise<{ success: boolean; data: any; message?: string }> => {
  try {
    const result = await apiCall()
    if (result?.success) {
      if (result.data !== undefined && result.data !== null) {
        if (successMsg) addLog(successMsg, 'success')
        return { success: true, data: result.data, message: result.message }
      }
    }
    const detail = result?.error?.message || result?.message || errorMsg
    addLog(`${errorMsg}: ${detail}`, 'error')
    toast.error(detail)
    return { success: false, data: null, message: detail }
  } catch (err: any) {
    const detail = err.message || '未知错误'
    addLog(`${errorMsg}: ${detail}`, 'error')
    toast.error(detail)
    return { success: false, data: null, message: detail }
  }
}

const seenStepLogLines = ref(new Set<number>())
/** 已处理的 stepLog id → 最近 status，允许 running → completed 再次处理 */
const processedStepStates = ref(new Map<number, string>())
const currentRunningStep = ref<string>('')

const applySingleStepLog = (log: ExecutionStepLog) => {
  if (log.id != null) {
    const prevStatus = processedStepStates.value.get(log.id)
    if (prevStatus === log.status) return
    processedStepStates.value.set(log.id, log.status)
  }

  const shouldAppendLog = log.id == null || !seenStepLogLines.value.has(log.id)
  if (log.id != null && shouldAppendLog) seenStepLogLines.value.add(log.id)

  if (shouldAppendLog) {
    const type = log.status === 'failed' ? 'error' : log.status === 'completed' ? 'success' : 'info'
    const duration = typeof log.durationMs === 'number' ? `${log.durationMs}ms` : '-'
    addLog(`[${log.stepCategory}] ${log.stepName} · ${log.status} · ${duration}`, type)

    const promptPreview = log.inputData?.systemPromptPreview
    if (log.stepCategory === 'agent' && typeof promptPreview === 'string' && promptPreview.trim()) {
      addLog(`提示词: ${promptPreview}${promptPreview.length >= 160 ? '…' : ''}`, 'info')
    }

    if (log.error) addLog(log.error, 'error')

    const outputTitle = log.outputData?.resumeTitle
    if (log.stepCategory === 'agent' && log.status === 'completed' && typeof outputTitle === 'string' && outputTitle.trim()) {
      addLog(`文档名称: ${outputTitle}`, 'success')
    }

    if (log.status === 'completed') {
      if (log.stepKey === 'api.parse_resume') {
        const parseTitle = log.outputData?.resumeTitle
        if (typeof parseTitle === 'string' && parseTitle.trim()) {
          addLog(`文档名称: ${parseTitle}`, 'info')
        }
      } else if (log.stepKey?.startsWith('save:')) {
        const saveTitle = log.outputData?.title
        if (typeof saveTitle === 'string' && saveTitle.trim()) {
          addLog(`简历名称: ${saveTitle}`, 'success')
        }
      } else if (log.stepKey === 'execute.complete') {
        const saved = log.outputData?.savedResumes as Array<{ title?: string }> | undefined
        saved?.forEach((item) => {
          if (typeof item.title === 'string' && item.title.trim()) {
            addLog(`简历名称: ${item.title}`, 'success')
          }
        })
      } else if (typeof outputTitle === 'string' && outputTitle.trim() && log.stepCategory !== 'agent') {
        addLog(`文档名称: ${outputTitle}`, 'info')
      }
    }
  }

  if (log.status === 'running') {
    currentRunningStep.value = log.stepName
  } else if (log.status === 'completed' || log.status === 'failed') {
    if (currentRunningStep.value === log.stepName) {
      currentRunningStep.value = ''
    }
  }

  if (log.nodeId) {
    if (log.status === 'running') {
      updateWorkflowAgent(log.nodeId, 'active')
    } else if (log.status === 'completed') {
      updateWorkflowAgent(log.nodeId, 'completed')
    } else if (log.status === 'failed') {
      updateWorkflowAgent(log.nodeId, 'error')
    }
  }

  const saveMatch = log.stepKey?.match(/^save:([^:]+):(zh|en)$/)
  if (saveMatch && log.status === 'completed') {
    const resumeId = typeof log.outputData?.resumeId === 'number' ? log.outputData.resumeId : undefined
    const templateId = typeof log.outputData?.templateId === 'string'
      ? log.outputData.templateId
      : saveMatch[1]
    setPreviewDone(templateId, saveMatch[2] as 'zh' | 'en', resumeId)
  }
}

/** 每轮轮询后根据全部步骤日志同步智能体节点状态（避免 running 被跳过后卡在 active） */
const syncAgentsFromStepLogs = (stepLogs: ExecutionStepLog[]) => {
  const nodeStatus = new Map<string, 'pending' | 'active' | 'completed' | 'error'>()

  for (const log of stepLogs) {
    if (!log.nodeId) continue
    if (log.status === 'failed') {
      nodeStatus.set(log.nodeId, 'error')
    } else if (log.status === 'completed') {
      nodeStatus.set(log.nodeId, 'completed')
    } else if (log.status === 'running') {
      const current = nodeStatus.get(log.nodeId)
      if (current !== 'completed' && current !== 'error') {
        nodeStatus.set(log.nodeId, 'active')
      }
    }
  }

  for (const agent of workflowAgents.value) {
    const synced = nodeStatus.get(agent.id)
    if (synced) agent.status = synced
  }
}

const finalizeExecutionAgents = (failed = false) => {
  currentRunningStep.value = ''
  workflowAgents.value.forEach((agent) => {
    if (failed) {
      if (agent.status === 'active') agent.status = 'error'
    } else if (agent.status === 'active' || agent.status === 'pending') {
      agent.status = 'completed'
    }
  })
}

const syncExecutionStepsFromLogs = (stepLogs: ExecutionStepLog[]) => {
  executionSteps.value = mapStepLogsToFlowSteps(stepLogs)
}

const syncProgressFromPoll = (stepLogs: ExecutionStepLog[], serverProgress?: number) => {
  if (typeof serverProgress === 'number') {
    progress.value = serverProgress
    return
  }
  if (stepLogs.length === 0) return

  const initLog = stepLogs.find((log) => log.stepKey === 'execute.init')
  const plannedTotal =
    typeof initLog?.outputData?.expectedStepCount === 'number'
      ? initLog.outputData.expectedStepCount
      : typeof initLog?.inputData?.expectedStepCount === 'number'
        ? initLog.inputData.expectedStepCount
        : stepLogs.length
  const completed = stepLogs.filter((log) => log.status === 'completed').length
  const runningBonus = stepLogs.some((log) => log.status === 'running') ? 0.5 : 0
  const denominator = Math.max(plannedTotal, stepLogs.length, 1)
  progress.value = Math.min(99, Math.round(((completed + runningBonus) / denominator) * 100))
}

const pollExecutionUntilDone = (groupId: string) =>
  new Promise<{
    status: 'completed' | 'failed' | 'cancelled'
    savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>
    errorMessage?: string
  }>((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 600
    let settled = false

    const finish = (result: {
      status: 'completed' | 'failed' | 'cancelled'
      savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>
      errorMessage?: string
    }) => {
      if (settled) return
      settled = true
      clearInterval(interval)
      resolve(result)
    }

    const tick = async () => {
      attempts += 1
      try {
        const res = await api.workflows.getExecutionLogs(groupId)
        if (!res.success || !res.data) {
          if (attempts >= maxAttempts) finish({ status: 'failed', savedResumes: [], errorMessage: '轮询执行状态超时' })
          return
        }

        const stepLogs = (res.data.stepLogs || []) as ExecutionStepLog[]
        for (const log of stepLogs) {
          applySingleStepLog(log)
        }
        syncExecutionStepsFromLogs(stepLogs)
        syncAgentsFromStepLogs(stepLogs)
        syncProgressFromPoll(stepLogs, res.data.progress)

        const savedResumes = (res.data.savedResumes || []) as Array<{
          id: number
          title: string
          templateId: string
          lang: string
        }>

        if (res.data.status === 'completed') {
          finish({ status: 'completed', savedResumes })
          return
        }

        if (res.data.status === 'failed') {
          finish({
            status: 'failed',
            savedResumes: [],
            errorMessage: res.data.errorMessage || '执行失败',
          })
          return
        }

        if (res.data.status === 'cancelled') {
          finish({
            status: 'cancelled',
            savedResumes: [],
            errorMessage: res.data.errorMessage || '执行已终止',
          })
          return
        }

        if (attempts >= maxAttempts) {
          finish({ status: 'failed', savedResumes: [], errorMessage: '执行超时，请稍后在执行日志中查看结果' })
        }
      } catch (err: any) {
        if (attempts >= maxAttempts) {
          finish({ status: 'failed', savedResumes: [], errorMessage: err?.message || '轮询执行状态失败' })
        }
      }
    }

    const interval = setInterval(tick, 1200)
    tick()
  })

const buildExecutionSuccessMessage = (
  savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>,
) => {
  const titleList = savedResumes.map((item) => item.title?.trim()).filter(Boolean).join('、')
  if (savedResumes.length === 0) return '智能执行完成'
  return `智能执行完成，已保存 ${savedResumes.length} 份简历${titleList ? `：${titleList}` : ''}`
}

const showExecutionSuccessToast = async (
  savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>,
) => {
  const message = buildExecutionSuccessMessage(savedResumes)
  addLog(message, 'success')
  await nextTick()
  toast.success(message, 6000)
}


const updateWorkflowAgent = (agentId: string, status: 'pending' | 'active' | 'completed' | 'error') => {
  const agent = workflowAgents.value.find(a => a.id === agentId)
  if (agent) agent.status = status
}

const executeWorkflow = async () => {
  if (!validateConfig()) return

  logs.value = []
  executionSteps.value = []
  seenStepLogLines.value = new Set()
  processedStepStates.value = new Map()
  currentRunningStep.value = ''
  isExecuting.value = true
  progress.value = 0
  workflowAgents.value.forEach(a => { a.status = 'pending' })
  outputPreviews.value.forEach((p) => {
    p.status = 'waiting'
    p.resumeId = undefined
  })

  addLog('='.repeat(40), 'info')
  addLog(langStore.t.execution.logStart, 'info')
  addLog(`输出模板: ${selectedTemplateIds.value.map(getTemplateName).join('、')}`, 'info')
  addLog(`输出语言: ${[langChinese.value && '中文', langEnglish.value && '英文'].filter(Boolean).join('、')}`, 'info')

  const outputLanguages: ('zh' | 'en')[] = []
  if (langChinese.value) outputLanguages.push('zh')
  if (langEnglish.value) outputLanguages.push('en')

  const executeWorkflowId = currentWorkflowId.value
  if (!executeWorkflowId) {
    toast.error('请先选择工作流版本')
    isExecuting.value = false
    return
  }

  addLog(`工作流版本: v${currentWorkflow.value?.version ?? '-'} (id=${executeWorkflowId})`, 'info')
  addLog(`调用 POST /api/workflows/${executeWorkflowId}/execute`, 'info')

  const uploadData = uploadedFile.value!.filePath

  if (!executionIdempotencyKey.value) {
    executionIdempotencyKey.value = buildExecutionIdempotencyKey()
  }

  try {
    const startResult = await callApi(
      () => api.workflows.execute(executeWorkflowId, {
        filePath: uploadData,
        uploadFileName: uploadedFile.value!.fileName,
        targetRole: config.targetPosition,
        templateIds: selectedTemplateIds.value,
        outputLanguages,
        saveToDatabase: true,
        versionsCount: 1,
        styles: ['专业版'],
        generateEnglish: false,
        industry: getIndustryLabel(config.industry),
        experienceLevel: config.experience,
        idempotencyKey: executionIdempotencyKey.value,
      }),
      '启动智能执行失败',
    )

    if (!startResult.success) {
      workflowAgents.value.forEach(a => { if (a.status === 'active') a.status = 'error' })
      return
    }

    const groupId = startResult.data?.executionGroupId as string | undefined
    if (!groupId) {
      toast.error('未获取到执行组 ID')
      return
    }

    addLog(`执行组 ID: ${groupId}，开始轮询进度…`, 'info')
    outputPreviews.value.forEach(p => { if (p.status === 'waiting') p.status = 'generating' })

    const pollResult = await pollExecutionUntilDone(groupId)

    if (pollResult.status === 'failed' || pollResult.status === 'cancelled') {
      addLog(pollResult.errorMessage || '智能执行失败', 'error')
      toast.error(pollResult.errorMessage || '智能执行失败')
      finalizeExecutionAgents(true)
      return
    }

    progress.value = 100
    finalizeExecutionAgents(false)
    const savedResumes = pollResult.savedResumes || []
    savedResumes.forEach((item) => {
      setPreviewDone(item.templateId, item.lang as 'zh' | 'en', item.id)
    })
    outputPreviews.value.forEach((p) => {
      if (p.status !== 'done') p.status = 'done'
    })

    await showExecutionSuccessToast(savedResumes)

    try {
      await Promise.all(
        savedResumes.map((item) => resumeStore.fetchResume(item.id)),
      )
    } catch (refreshError) {
      console.error('刷新已保存简历失败:', refreshError)
    }

    executionIdempotencyKey.value = null
  } catch (err: any) {
    const message = err?.message || '智能执行异常'
    addLog(message, 'error')
    toast.error(message)
    finalizeExecutionAgents(true)
  } finally {
    isExecuting.value = false
    if (progress.value >= 100) {
      currentRunningStep.value = ''
    }
  }
}

const getIndustryLabel = (industry: string) => {
  const map: Record<string, string> = {
    tech: langStore.t.execution.industryTech,
    finance: langStore.t.execution.industryFinance,
    education: langStore.t.execution.industryEducation,
    healthcare: langStore.t.execution.industryHealthcare,
    other: langStore.t.execution.industryOther
  }
  return map[industry] || industry
}
</script>

<style scoped>
.execution-scroll {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--primary) / 0.4) transparent;
}
.execution-scroll::-webkit-scrollbar {
  width: 6px;
}
.execution-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.execution-scroll::-webkit-scrollbar-thumb {
  background: hsl(var(--primary) / 0.35);
  border-radius: 999px;
}
.execution-scroll::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary) / 0.55);
}
</style>
