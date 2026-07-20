import { request } from './client'
import type { TemplateItem } from './types'

export const templatesApi = {
  list: (page = 1, limit = 20) =>
    request<{ items: TemplateItem[]; total: number }>(`/templates?page=${page}&limit=${limit}`),

  get: (id: string) => request<TemplateItem>(`/templates/${id}`),
}
