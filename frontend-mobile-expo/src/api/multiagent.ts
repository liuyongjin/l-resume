import { request } from './client'
import type { AiOptimizeResult, ResumeData } from './types'

export const multiagentApi = {
  capabilities: () => request('/multiagent/capabilities'),

  optimize: (data: {
    resumeId?: number
    resumeData?: ResumeData
    optimizationFocus?: string[]
    mode?: string
    targetLanguage?: string
  }) =>
    request<AiOptimizeResult>('/multiagent/optimize', { method: 'POST', body: JSON.stringify(data) }),

  analyzeMatch: (data: { resumeId?: number; resumeData?: ResumeData; jobDescription: string }) =>
    request('/multiagent/analyze-match', { method: 'POST', body: JSON.stringify(data) }),
}
