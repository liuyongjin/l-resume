import { create } from 'zustand'
import { resumesApi } from '@/api/resumes'
import type { Resume, ResumeData, ResumeStyle } from '@/api/types'
import { defaultResumeStyle, emptyResumeData } from '@/utils/resumeTransform'

interface ResumeState {
  resumes: Resume[]
  total: number
  isLoading: boolean
  error: string | null
  current: Resume | null
  fetchList: (page?: number) => Promise<void>
  fetchOne: (id: number) => Promise<Resume | null>
  create: (title: string, templateId?: string) => Promise<Resume | null>
  update: (id: number, patch: {
      title?: string
      data?: ResumeData
      style?: ResumeStyle
      templateId?: string
      expectedUpdatedAt?: string
    }) => Promise<boolean>
  remove: (id: number) => Promise<boolean>
  setCurrent: (resume: Resume | null) => void
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  total: 0,
  isLoading: false,
  error: null,
  current: null,

  fetchList: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const res = await resumesApi.list(page, 50)
      const data = res.data
      const items = Array.isArray(data) ? data : (data?.items ?? [])
      const total = Array.isArray(data) ? items.length : (data?.total ?? items.length)
      set({ resumes: items as Resume[], total, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '加载失败' })
    }
  },

  fetchOne: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const res = await resumesApi.get(id)
      const resume = res.data as Resume
      set({ current: resume, isLoading: false })
      return resume
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '加载失败' })
      return null
    }
  },

  create: async (title, templateId) => {
    try {
      const res = await resumesApi.create({
        title,
        data: emptyResumeData(),
        style: defaultResumeStyle(),
        templateId,
        source: 'manual',
      })
      const resume = res.data as Resume
      if (resume) {
        set({ resumes: [resume, ...get().resumes] })
      }
      return resume ?? null
    } catch {
      return null
    }
  },

  update: async (id, patch) => {
    try {
      const res = await resumesApi.update(id, patch)
      const updated = res.data as Resume
      if (updated) {
        set({
          current: get().current?.id === id ? updated : get().current,
          resumes: get().resumes.map((r) => (r.id === id ? updated : r)),
        })
      }
      return true
    } catch {
      return false
    }
  },

  remove: async (id) => {
    try {
      await resumesApi.delete(id)
      set({ resumes: get().resumes.filter((r) => r.id !== id) })
      return true
    } catch {
      return false
    }
  },

  setCurrent: (resume) => set({ current: resume }),
}))
