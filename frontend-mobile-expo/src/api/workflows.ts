import { request } from './client'
import type { Workflow } from './types'

export const workflowsApi = {
  list: () => request<Workflow[]>('/workflows'),

  getDefault: () => request<Workflow>('/workflows/default'),

  get: (id: number) => request<Workflow>(`/workflows/${id}`),

  getGraph: (id: number) => request<Workflow>(`/workflows/${id}/graph`),

  update: (id: number, data: { name?: string; description?: string; nodes?: unknown; connections?: unknown; config?: unknown }) =>
    request<Workflow>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  execute: (id: number, data: {
    resumeData?: unknown
    rawText?: string
    resumeId?: number
    targetRole?: string
    templateId?: string
    templateIds?: string[]
    outputLanguages?: ('zh' | 'en')[]
    saveToDatabase?: boolean
    idempotencyKey?: string
  }) =>
    request(`/workflows/${id}/execute`, { method: 'POST', body: JSON.stringify(data) }),

  getExecutionLogs: (groupId: string) => request(`/workflows/executions/${groupId}`),

  cancelExecution: (groupId: string) =>
    request(`/workflows/executions/${groupId}/cancel`, { method: 'POST' }),

  listExecutions: (params?: { page?: number; limit?: number; runType?: string }) => {
    const search = new URLSearchParams()
    if (params?.page != null) search.set('page', String(params.page))
    if (params?.limit != null) search.set('limit', String(params.limit))
    if (params?.runType) search.set('runType', params.runType)
    const query = search.toString()
    return request(`/workflows/executions${query ? `?${query}` : ''}`)
  },

  getNodeLibrary: () => request('/workflows/node-library'),
}
