import { request } from './client'
import type { Resume, ResumeData, ResumeListResponse, ResumeStyle } from './types'

export const resumesApi = {
  list: (page = 1, limit = 20) =>
    request<ResumeListResponse>(`/resumes?page=${page}&limit=${limit}`),

  get: (id: number) => request<Resume>(`/resumes/${id}`),

  create: (data: { title: string; data: ResumeData; style?: ResumeStyle; templateId?: string; source?: string }) =>
    request<Resume>('/resumes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: { title?: string; data?: ResumeData; style?: ResumeStyle; templateId?: string; expectedUpdatedAt?: string }) =>
    request<Resume>(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) => request(`/resumes/${id}`, { method: 'DELETE' }),

  duplicate: (id: number) => request<Resume>(`/resumes/${id}/duplicate`, { method: 'POST' }),
}
