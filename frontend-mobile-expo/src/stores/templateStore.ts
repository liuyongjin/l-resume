import { create } from 'zustand'
import { templatesApi } from '@/api/templates'
import type { TemplateItem } from '@/api/types'

interface TemplateState {
  templates: TemplateItem[]
  isLoading: boolean
  fetchList: () => Promise<void>
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  isLoading: false,

  fetchList: async () => {
    set({ isLoading: true })
    try {
      const res = await templatesApi.list(1, 50)
      const data = res.data
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      set({ templates: items as TemplateItem[], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
