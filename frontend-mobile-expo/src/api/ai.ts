import { request } from './client'

export const aiApi = {
  optimize: (data: { resumeId?: number; section: string; content: string }) =>
    request('/ai/optimize', { method: 'POST', body: JSON.stringify(data) }),

  resumeChat: (data: {
    resumeId: number
    message: string
    sessionId?: string
    resumeData?: Record<string, unknown>
  }) => request('/ai/resume-chat', { method: 'POST', body: JSON.stringify(data) }),

  match: (data: { resumeId: number; jobDescription: string }) =>
    request('/ai/match', { method: 'POST', body: JSON.stringify(data) }),
}
