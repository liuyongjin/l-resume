import { workflowsApi } from '@/api/workflows'

export interface SavedResumeSummary {
  id: number
  title: string
  templateId: string
  lang: string
}

export interface WorkflowStepLog {
  stepKey: string
  status: string
  message?: string
}

export interface WorkflowPollResult {
  status: 'completed' | 'failed'
  savedResumes: SavedResumeSummary[]
  errorMessage?: string
  stepLogs: WorkflowStepLog[]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function pollWorkflowExecution(
  groupId: string,
  onProgress?: (stepLogs: WorkflowStepLog[], progress?: number) => void,
): Promise<WorkflowPollResult> {
  const maxAttempts = 600

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await workflowsApi.getExecutionLogs(groupId)
    const data = res.data as {
      status?: string
      savedResumes?: SavedResumeSummary[]
      errorMessage?: string
      stepLogs?: WorkflowStepLog[]
      progress?: number
    } | undefined

    if (data?.stepLogs) {
      onProgress?.(data.stepLogs, data.progress)
    }

    if (data?.status === 'completed') {
      return {
        status: 'completed',
        savedResumes: data.savedResumes ?? [],
        stepLogs: data.stepLogs ?? [],
      }
    }

    if (data?.status === 'failed') {
      return {
        status: 'failed',
        savedResumes: [],
        errorMessage: data.errorMessage ?? '执行失败',
        stepLogs: data.stepLogs ?? [],
      }
    }

    await sleep(2000)
  }

  throw new Error('执行超时，请稍后在执行记录中查看结果')
}
