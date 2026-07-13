<template>
  <section
    :class="[
      'execution-flow-panel flex flex-col flex-1 min-w-0 min-h-0 h-full',
      !embedded && 'border-r border-border xl:border-r-0',
    ]"
  >
    <div class="shrink-0 px-4 pt-4 pb-3 border-b border-border/60">
      <h2 class="text-sm font-semibold text-foreground">执行流程</h2>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto execution-scroll px-4 py-4 flex flex-col">
      <div
        v-if="steps.length === 0"
        class="execution-flow-empty flex flex-1 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/15 px-6 py-10 text-center"
      >
        <div class="mb-3 flex size-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <ListTree class="size-5" />
        </div>
        <p class="text-sm text-muted-foreground">{{ emptyHint }}</p>
      </div>

      <div v-else class="relative w-full space-y-0">
      <div
        v-for="(step, idx) in steps"
        :key="step.id"
        class="relative flex gap-4 pb-5"
      >
        <div
          v-if="idx < steps.length - 1"
          class="absolute left-[15px] top-8 bottom-0 w-px border-l border-dashed border-border"
        />

        <div
          :class="[
            'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border-2',
            stepStatusClass(step.status),
          ]"
        >
          <Spinner v-if="step.status === 'running'" class="size-3.5 text-primary-foreground" />
          <template v-else>
            <Check
              v-if="step.status === 'completed'"
              class="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-emerald-500 text-white p-0.5"
            />
            <X
              v-else-if="step.status === 'failed'"
              class="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-destructive text-destructive-foreground p-0.5"
            />
            <span>{{ step.stepOrder }}</span>
          </template>
        </div>

        <div
          :class="[
            'flex-1 min-w-0 p-4 rounded-xl border transition-all',
            step.status === 'running' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card',
            step.status === 'failed' ? 'border-destructive/40 bg-destructive/5' : '',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-medium text-foreground leading-snug">
                <span class="text-muted-foreground mr-1.5">步骤 {{ step.stepOrder }}</span>
                {{ step.stepName }}
              </h3>
              <p class="text-[11px] text-muted-foreground mt-0.5 font-mono truncate" :title="step.stepKey">
                {{ step.stepKey }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <Badge :variant="getBadgeVariant(step.status)" class="text-[10px]">
                {{ getStepStatusLabel(step.status) }}
              </Badge>
              <span v-if="formatStepDuration(step.durationMs)" class="text-[10px] text-muted-foreground">
                {{ formatStepDuration(step.durationMs) }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline" class="text-[10px] font-normal">
              {{ getStepCategoryLabel(step.stepCategory) }}
            </Badge>
            <span v-if="step.nodeId" class="text-[10px] text-muted-foreground font-mono">
              node: {{ step.nodeId }}
            </span>
          </div>

          <div class="mt-3 space-y-1.5">
            <button
              type="button"
              class="w-full text-left rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-default disabled:hover:border-border/70 disabled:hover:bg-muted/20"
              :disabled="!hasStepData(step.inputData)"
              @click="openDetail(step, 'input')"
            >
              <span class="text-muted-foreground">输入：</span>
              <span :class="hasStepData(step.inputData) ? 'text-foreground' : 'text-muted-foreground'">
                {{ summarizeStepInput(step) }}
              </span>
            </button>

            <button
              type="button"
              class="w-full text-left rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-default disabled:hover:border-border/70 disabled:hover:bg-muted/20"
              :disabled="!hasStepData(step.outputData)"
              @click="openDetail(step, 'output')"
            >
              <span class="text-muted-foreground">输出：</span>
              <span :class="hasStepData(step.outputData) ? 'text-foreground' : 'text-muted-foreground'">
                {{ summarizeStepOutput(step) }}
              </span>
            </button>
          </div>

          <p v-if="step.error" class="mt-2 text-xs text-destructive leading-relaxed">
            {{ step.error }}
          </p>
        </div>
      </div>
      </div>
    </div>

    <Dialog :open="detailOpen" @update:open="detailOpen = $event">
      <DialogScrollContent class="max-w-3xl w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{{ detailTitle }}</DialogTitle>
          <DialogDescription class="font-mono text-xs break-all">
            {{ detailStepKey }}
          </DialogDescription>
        </DialogHeader>
        <pre class="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed whitespace-pre-wrap break-words">{{ detailJson }}</pre>
      </DialogScrollContent>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, X, ListTree } from 'lucide-vue-next'
import { Badge } from '~/components/ui/Badge'
import { Spinner } from '~/components/ui/spinner'
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog'
import {
  type ExecutionFlowStep,
  formatStepDataJson,
  formatStepDuration,
  getStepCategoryLabel,
  getStepStatusLabel,
  summarizeStepInput,
  summarizeStepOutput,
} from '~/utils/executionStepDisplay'

const props = withDefaults(
  defineProps<{
    steps: ExecutionFlowStep[]
    /** 空状态提示文案 */
    emptyHint?: string
    /** 嵌入弹窗/侧栏时去掉外边框 */
    embedded?: boolean
  }>(),
  {
    emptyHint: '点击「开始执行」后将展示每步输入输出',
    embedded: false,
  },
)

const detailOpen = ref(false)
const detailStep = ref<ExecutionFlowStep | null>(null)
const detailDirection = ref<'input' | 'output'>('input')

const detailTitle = computed(() => {
  if (!detailStep.value) return ''
  const label = detailDirection.value === 'input' ? '输入' : '输出'
  return `步骤 ${detailStep.value.stepOrder} · ${detailStep.value.stepName} · ${label}`
})

const detailStepKey = computed(() => detailStep.value?.stepKey ?? '')

const detailJson = computed(() => {
  if (!detailStep.value) return ''
  const data = detailDirection.value === 'input'
    ? detailStep.value.inputData
    : detailStep.value.outputData
  return formatStepDataJson(data ?? undefined)
})

const hasStepData = (data: Record<string, unknown> | null | undefined) =>
  Boolean(data && Object.keys(data).length > 0)

const openDetail = (step: ExecutionFlowStep, direction: 'input' | 'output') => {
  const data = direction === 'input' ? step.inputData : step.outputData
  if (!hasStepData(data)) return
  detailStep.value = step
  detailDirection.value = direction
  detailOpen.value = true
}

const stepStatusClass = (status: ExecutionFlowStep['status']) => {
  if (status === 'completed') return 'bg-emerald-500 border-emerald-500 text-white'
  if (status === 'running') return 'bg-primary border-primary text-primary-foreground'
  if (status === 'failed') return 'bg-destructive border-destructive text-destructive-foreground'
  return 'bg-muted border-border text-muted-foreground'
}

const getBadgeVariant = (status: ExecutionFlowStep['status']) => {
  switch (status) {
    case 'running': return 'outline' as const
    case 'completed': return 'default' as const
    case 'failed': return 'destructive' as const
    default: return 'secondary' as const
  }
}
</script>

<style scoped>
.execution-flow-panel {
  background: hsl(var(--background) / 0.35);
}

.execution-flow-empty {
  min-height: 100%;
}

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
