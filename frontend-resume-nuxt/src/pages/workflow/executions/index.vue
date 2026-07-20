<template>
  <div class="flex flex-col flex-1 min-h-0 bg-muted/30">
    <div class="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border/60 glass-header">
      <div class="min-w-0">
        <h1 class="text-base font-semibold text-foreground tracking-tight">历史执行流程</h1>
        <p class="text-xs text-muted-foreground truncate mt-0.5">查看过往智能执行的步骤与输入输出</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Button
          v-if="selectedExecution?.status === 'running'"
          variant="destructive"
          size="sm"
          class="h-9 text-xs"
          :disabled="cancelling"
          @click="handleCancelExecution"
        >
          {{ cancelling ? '终止中…' : '终止执行' }}
        </Button>
        <Button variant="outline" size="sm" class="h-9 text-xs" @click="navigateTo('/workflow/execution')">
          返回智能执行
        </Button>
      </div>
    </div>

    <LoadingState v-if="pageLoading" class="flex-1 min-h-[20rem]" text="加载历史执行流程..." />

    <div v-else class="flex flex-1 min-h-0 flex-col xl:flex-row overflow-hidden">
      <aside class="xl:w-[320px] shrink-0 border-r border-border bg-card flex flex-col min-h-0">
        <div class="shrink-0 px-4 py-3 border-b border-border/60">
          <p class="text-xs text-muted-foreground">
            共 {{ pagination.total }} 条记录
          </p>
        </div>

        <div
          v-if="items.length === 0"
          class="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        >
          <History class="size-8 text-muted-foreground mb-3" />
          <p class="text-sm text-muted-foreground">暂无历史执行记录</p>
        </div>

        <div v-else class="flex-1 min-h-0 overflow-y-auto execution-scroll">
          <button
            v-for="item in items"
            :key="item.executionGroupId"
            type="button"
            class="w-full text-left px-4 py-3 border-b border-border/60 transition-colors hover:bg-muted/40"
            :class="selectedId === item.executionGroupId ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'"
            @click="selectExecution(item.executionGroupId)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ item.workflowName || '智能执行' }}
                </p>
                <p class="text-[11px] text-muted-foreground mt-0.5">
                  {{ formatDateTime(item.startedAt) }}
                </p>
              </div>
              <Badge :variant="statusVariant(item.status)" class="text-[10px] shrink-0">
                {{ statusLabel(item.status) }}
              </Badge>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <span>{{ runTypeLabel(item.runType) }}</span>
              <span>· {{ item.stepCount }} 步</span>
              <span v-if="item.savedResumeCount > 0">· {{ item.savedResumeCount }} 份简历</span>
              <span v-if="item.savedResumeTitles?.length" class="truncate max-w-full">
                · {{ item.savedResumeTitles.join('、') }}
              </span>
              <span v-if="item.outputLanguages.length">· {{ formatLanguages(item.outputLanguages) }}</span>
            </div>
          </button>
        </div>

        <div v-if="pagination.totalPages > 1" class="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-border/60">
          <Button variant="outline" size="sm" class="h-8 text-xs" :disabled="pagination.page <= 1 || loading" @click="loadPage(pagination.page - 1)">
            上一页
          </Button>
          <span class="text-xs text-muted-foreground">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <Button variant="outline" size="sm" class="h-8 text-xs" :disabled="pagination.page >= pagination.totalPages || loading" @click="loadPage(pagination.page + 1)">
            下一页
          </Button>
        </div>
      </aside>

      <ExecutionFlowPanel :steps="selectedSteps" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', ssr: false })

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { navigateTo, useRoute } from 'nuxt/app'
import { History } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/Badge'
import LoadingState from '~/components/ui/LoadingState.vue'
import ExecutionFlowPanel from '~/components/workflow/ExecutionFlowPanel.vue'
import { api } from '~/utils/api'
import { useAppToast } from '~/composables/useAppToast'
import {
  mapStepLogsToFlowSteps,
  type ExecutionFlowStep,
  type ExecutionStepLog,
} from '~/utils/executionStepDisplay'

interface ExecutionHistoryItem {
  executionGroupId: string
  workflowId: number | null
  workflowName: string | null
  runType: string
  status: string
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
  stepCount: number
  savedResumeCount: number
  savedResumeTitles: string[]
  templateIds: string[]
  outputLanguages: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const toast = useAppToast()
const route = useRoute()

const pageLoading = ref(true)
const loading = ref(false)
const detailLoading = ref(false)
const cancelling = ref(false)
const items = ref<ExecutionHistoryItem[]>([])
const selectedId = ref<string | null>(null)
const selectedSteps = ref<ExecutionFlowStep[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
let pollTimer: ReturnType<typeof setInterval> | null = null

const selectedExecution = computed(() =>
  items.value.find((item) => item.executionGroupId === selectedId.value) ?? null,
)

const hasRunningExecution = computed(() => items.value.some((item) => item.status === 'running'))

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    running: '执行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已终止',
  }
  return map[status] || status
}

const statusVariant = (status: string) => {
  if (status === 'completed') return 'default' as const
  if (status === 'failed') return 'destructive' as const
  if (status === 'cancelled') return 'secondary' as const
  if (status === 'running') return 'outline' as const
  return 'secondary' as const
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const runTypeLabel = (runType: string) => (runType === 'test' ? '设计器测试' : '智能执行')

const formatLanguages = (langs: string[]) =>
  langs.map((lang) => (lang === 'zh' ? '中文' : lang === 'en' ? '英文' : lang)).join('、')

const selectExecutionByQuery = async () => {
  const group = typeof route.query.group === 'string' ? route.query.group.trim() : ''
  if (!group) return false

  const exists = items.value.some((item) => item.executionGroupId === group)
  if (exists) {
    await selectExecution(group)
    return true
  }

  selectedId.value = group
  await loadExecutionDetail(group)
  return true
}

const loadExecutionDetail = async (groupId: string) => {
  detailLoading.value = true
  try {
    const res = await api.workflows.getExecutionLogs(groupId)
    if (!res.success || !res.data) {
      toast.error('加载执行详情失败')
      selectedSteps.value = []
      return
    }
    selectedSteps.value = mapStepLogsToFlowSteps((res.data.stepLogs || []) as ExecutionStepLog[])
  } catch (error) {
    console.error('加载执行详情失败:', error)
    toast.error('加载执行详情失败')
    selectedSteps.value = []
  } finally {
    detailLoading.value = false
  }
}

const selectExecution = async (groupId: string) => {
  if (selectedId.value === groupId && selectedSteps.value.length > 0) return
  selectedId.value = groupId
  await loadExecutionDetail(groupId)
}

const loadPage = async (page: number, options: { silent?: boolean } = {}) => {
  if (!options.silent) loading.value = true
  try {
    const res = await api.workflows.listExecutions({ page, limit: pagination.value.limit, runType: 'all' })
    if (!res.success || !res.data) {
      if (!options.silent) toast.error('加载历史记录失败')
      return
    }
    items.value = res.data.items || []
    pagination.value = res.data.pagination || pagination.value

    if (items.value.length === 0) {
      selectedId.value = null
      selectedSteps.value = []
      return
    }

    const keepSelection = selectedId.value && items.value.some((item) => item.executionGroupId === selectedId.value)
    const queryGroup = typeof route.query.group === 'string' ? route.query.group.trim() : ''
    if (queryGroup) {
      await selectExecutionByQuery()
    } else if (!keepSelection) {
      await selectExecution(items.value[0].executionGroupId)
    } else if (selectedId.value) {
      await loadExecutionDetail(selectedId.value)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    if (!options.silent) toast.error('加载历史记录失败')
  } finally {
    if (!options.silent) loading.value = false
    pageLoading.value = false
    syncPollTimer()
  }
}

const handleCancelExecution = async () => {
  if (!selectedId.value || cancelling.value) return
  if (!window.confirm('确定要终止该工作流执行吗？当前步骤完成后将停止，已保存的简历将被回滚。')) return

  cancelling.value = true
  try {
    const res = await api.workflows.cancelExecution(selectedId.value)
    if (!res.success) {
      toast.error(res.message || '终止执行失败')
      return
    }
    toast.success(res.message || '已请求终止执行')
    await loadPage(pagination.value.page, { silent: true })
  } catch (error) {
    console.error('终止执行失败:', error)
    toast.error('终止执行失败')
  } finally {
    cancelling.value = false
  }
}

const syncPollTimer = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (hasRunningExecution.value) {
    pollTimer = setInterval(() => {
      void loadPage(pagination.value.page, { silent: true })
    }, 3000)
  }
}

onMounted(() => {
  void loadPage(1)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
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
</style>
