import { onUnmounted, ref } from 'vue'
import { api } from '~/utils/api'
import {
  mapStepLogsToFlowSteps,
  type ExecutionFlowStep,
  type ExecutionStepLog,
} from '~/utils/executionStepDisplay'

export type WorkflowExecutionPollStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowExecutionPollResult {
  status: 'completed' | 'failed' | 'cancelled'
  stepCount: number
  errorMessage?: string
  savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>
}

const syncProgressFromLogs = (
  stepLogs: ExecutionStepLog[],
  serverProgress: number | undefined,
  progress: { value: number },
) => {
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

export function useWorkflowExecutionPoll() {
  const steps = ref<ExecutionFlowStep[]>([])
  const progress = ref(0)
  const status = ref<WorkflowExecutionPollStatus>('idle')
  const errorMessage = ref<string>()
  const savedResumes = ref<Array<{ id: number; title: string; templateId: string; lang: string }>>([])

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let activeGroupId: string | null = null

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    activeGroupId = null
  }

  const reset = () => {
    stopPolling()
    steps.value = []
    progress.value = 0
    status.value = 'idle'
    errorMessage.value = undefined
    savedResumes.value = []
  }

  const applyPollResponse = (data: {
    status?: string
    progress?: number
    errorMessage?: string | null
    stepLogs?: ExecutionStepLog[]
    savedResumes?: Array<{ id: number; title: string; templateId: string; lang: string }>
  }) => {
    const stepLogs = (data.stepLogs || []) as ExecutionStepLog[]
    steps.value = mapStepLogsToFlowSteps(stepLogs)
    syncProgressFromLogs(stepLogs, data.progress, progress)
    savedResumes.value = (data.savedResumes || []) as typeof savedResumes.value

    if (data.status === 'completed') {
      status.value = 'completed'
      progress.value = 100
      return 'completed' as const
    }
    if (data.status === 'failed') {
      status.value = 'failed'
      errorMessage.value = data.errorMessage || '执行失败'
      return 'failed' as const
    }
    if (data.status === 'cancelled') {
      status.value = 'cancelled'
      errorMessage.value = data.errorMessage || '执行已终止'
      return 'cancelled' as const
    }

    status.value = 'running'
    return 'running' as const
  }

  const startPolling = (groupId: string) =>
    new Promise<WorkflowExecutionPollResult>((resolve) => {
      stopPolling()
      activeGroupId = groupId
      status.value = 'running'
      progress.value = 0
      errorMessage.value = undefined

      let attempts = 0
      const maxAttempts = 600
      let settled = false

      const finish = (result: WorkflowExecutionPollResult) => {
        if (settled) return
        settled = true
        stopPolling()
        resolve(result)
      }

      const tick = async () => {
        if (activeGroupId !== groupId) return
        attempts += 1
        try {
          const res = await api.workflows.getExecutionLogs(groupId)
          if (!res.success || !res.data) {
            if (attempts >= maxAttempts) {
              status.value = 'failed'
              errorMessage.value = '轮询执行状态超时'
              finish({
                status: 'failed',
                stepCount: steps.value.length,
                errorMessage: errorMessage.value,
                savedResumes: [],
              })
            }
            return
          }

          const pollStatus = applyPollResponse(res.data)
          if (pollStatus === 'completed') {
            finish({
              status: 'completed',
              stepCount: steps.value.length,
              savedResumes: savedResumes.value,
            })
            return
          }
          if (pollStatus === 'failed' || pollStatus === 'cancelled') {
            finish({
              status: pollStatus,
              stepCount: steps.value.length,
              errorMessage: errorMessage.value,
              savedResumes: [],
            })
            return
          }

          if (attempts >= maxAttempts) {
            status.value = 'failed'
            errorMessage.value = '执行超时，请稍后在历史执行流程中查看结果'
            finish({
              status: 'failed',
              stepCount: steps.value.length,
              errorMessage: errorMessage.value,
              savedResumes: [],
            })
          }
        } catch (err) {
          if (attempts >= maxAttempts) {
            status.value = 'failed'
            errorMessage.value = err instanceof Error ? err.message : '轮询执行状态失败'
            finish({
              status: 'failed',
              stepCount: steps.value.length,
              errorMessage: errorMessage.value,
              savedResumes: [],
            })
          }
        }
      }

      pollTimer = setInterval(tick, 1200)
      void tick()
    })

  onUnmounted(stopPolling)

  return {
    steps,
    progress,
    status,
    errorMessage,
    savedResumes,
    reset,
    stopPolling,
    startPolling,
    applyPollResponse,
  }
}
