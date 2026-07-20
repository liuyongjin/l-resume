<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogScrollContent
      class="max-w-2xl w-[calc(100vw-2rem)] gap-0 p-0 overflow-hidden flex flex-col max-h-[min(88vh,760px)]"
    >
      <DialogHeader class="shrink-0 px-4 pt-4 pb-3 border-b border-border/60 space-y-3 text-left">
        <div class="flex items-start justify-between gap-3 pr-8">
          <div class="min-w-0">
            <DialogTitle class="text-base">{{ title }}</DialogTitle>
            <DialogDescription v-if="subtitle" class="mt-1">{{ subtitle }}</DialogDescription>
          </div>
          <Badge v-if="status !== 'idle'" :variant="statusBadgeVariant" class="text-[10px] shrink-0">
            {{ statusLabel }}
          </Badge>
        </div>

        <div v-if="showProgress" class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-muted-foreground">{{ progressHint }}</span>
            <span class="font-medium text-foreground">{{ progress }}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <p v-if="errorMessage && isTerminal" class="text-xs text-destructive leading-relaxed">
          {{ errorMessage }}
        </p>
      </DialogHeader>

      <ExecutionFlowPanel
        :steps="steps"
        :empty-hint="emptyHint"
        embedded
        class="flex-1 min-h-[280px] max-h-[52vh]"
      />

      <DialogFooter class="shrink-0 px-4 py-3 border-t border-border/60 gap-2 sm:justify-between">
        <Button
          v-if="executionGroupId"
          variant="outline"
          size="sm"
          class="h-8 text-xs"
          @click="openHistory"
        >
          查看历史执行流程
        </Button>
        <div v-else class="flex-1" />
        <Button
          size="sm"
          class="h-8 text-xs"
          :disabled="blockingClose"
          @click="handleOpenChange(false)"
        >
          {{ blockingClose ? '执行中…' : '关闭' }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { navigateTo } from 'nuxt/app'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog'
import ExecutionFlowPanel from '~/components/workflow/ExecutionFlowPanel.vue'
import {
  useWorkflowExecutionPoll,
  type WorkflowExecutionPollResult,
} from '~/composables/useWorkflowExecutionPoll'

const props = withDefaults(
  defineProps<{
    open: boolean
    executionGroupId?: string | null
    title?: string
    subtitle?: string
    emptyHint?: string
    /** 关闭弹窗时是否仍然后台轮询（默认停止） */
    keepPollingOnClose?: boolean
    /** 执行未完成时禁止关闭 */
    lockWhileRunning?: boolean
  }>(),
  {
    executionGroupId: null,
    title: '执行流程',
    subtitle: '',
    emptyHint: '执行开始后将逐步展示每步输入输出',
    keepPollingOnClose: false,
    lockWhileRunning: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  finished: [result: WorkflowExecutionPollResult]
}>()

const {
  steps,
  progress,
  status,
  errorMessage,
  reset,
  stopPolling,
  startPolling,
} = useWorkflowExecutionPoll()

const pollPromise = ref<Promise<WorkflowExecutionPollResult> | null>(null)

const isTerminal = computed(() =>
  ['completed', 'failed', 'cancelled'].includes(status.value),
)

const showProgress = computed(() => props.open && status.value !== 'idle')

const blockingClose = computed(
  () => props.lockWhileRunning && status.value === 'running' && Boolean(props.executionGroupId),
)

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    idle: '等待中',
    running: '执行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已终止',
  }
  return map[status.value] || status.value
})

const statusBadgeVariant = computed(() => {
  if (status.value === 'completed') return 'default' as const
  if (status.value === 'failed') return 'destructive' as const
  if (status.value === 'cancelled') return 'secondary' as const
  if (status.value === 'running') return 'outline' as const
  return 'secondary' as const
})

const progressHint = computed(() => {
  if (status.value === 'completed') return '执行完成'
  if (status.value === 'failed') return '执行失败'
  if (status.value === 'cancelled') return '执行已终止'
  if (steps.value.length === 0) return '正在启动…'
  return `已完成 ${steps.value.filter((step) => step.status === 'completed').length} / ${steps.value.length} 步`
})

const beginPolling = async (groupId: string) => {
  pollPromise.value = startPolling(groupId)
  const result = await pollPromise.value
  emit('finished', result)
}

watch(
  () => [props.open, props.executionGroupId] as const,
  ([open, groupId]) => {
    if (!open) {
      if (!props.keepPollingOnClose) stopPolling()
      return
    }
    if (!groupId) {
      reset()
      status.value = 'running'
      return
    }
    void beginPolling(groupId)
  },
  { immediate: true },
)

const handleOpenChange = (value: boolean) => {
  if (!value && blockingClose.value) return
  emit('update:open', value)
  if (!value && !props.keepPollingOnClose) {
    stopPolling()
    reset()
  }
}

const openHistory = () => {
  const query = props.executionGroupId
    ? `?group=${encodeURIComponent(props.executionGroupId)}`
    : ''
  emit('update:open', false)
  void navigateTo(`/workflow/executions${query}`)
}
</script>
