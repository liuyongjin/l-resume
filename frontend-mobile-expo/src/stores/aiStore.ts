import { create } from 'zustand'
import type { AiOptimizeResult, ResumeData } from '@/api/types'
import { multiagentApi } from '@/api/multiagent'

interface AiState {
  isLoading: boolean
  result: AiOptimizeResult | null
  error: string | null
  optimize: (resumeId: number, resumeData: ResumeData) => Promise<AiOptimizeResult | null>
  clear: () => void
}

export const useAiStore = create<AiState>((set) => ({
  isLoading: false,
  result: null,
  error: null,

  optimize: async (resumeId, resumeData) => {
    set({ isLoading: true, error: null, result: null })
    try {
      const res = await multiagentApi.optimize({ resumeId, resumeData })
      const result = res.data as AiOptimizeResult | undefined
      if (!result) {
        throw new Error('优化结果为空')
      }
      set({ result, isLoading: false })
      return result
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '优化失败' })
      return null
    }
  },

  clear: () => set({ result: null, error: null }),
}))
