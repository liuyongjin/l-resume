import { create } from 'zustand'
import type { AiOptimizeResult, ResumeData } from '@/api/types'
import { multiagentApi } from '@/api/multiagent'
import { aiApi } from '@/api/ai'

export type AiMode = 'polish' | 'match' | 'complete' | 'translate'

interface OptimizeOptions {
  mode?: AiMode
  jobDescription?: string
}

interface AiState {
  isLoading: boolean
  result: AiOptimizeResult | null
  error: string | null
  lastMode: AiMode
  optimize: (
    resumeId: number,
    resumeData: ResumeData,
    options?: OptimizeOptions,
  ) => Promise<AiOptimizeResult | null>
  clear: () => void
}

function suggestionsFromMatch(match: Record<string, unknown>): AiOptimizeResult['suggestions'] {
  const raw = match.suggestions ?? match.gaps ?? match.improvements
  if (!Array.isArray(raw)) return []
  return raw.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `m-${index}`, section: 'match', before: '', after: item }
    }
    const row = item as Record<string, unknown>
    return {
      id: String(row.id ?? `m-${index}`),
      section: String(row.section ?? 'match'),
      before: String(row.before ?? ''),
      after: String(row.after ?? row.text ?? row.description ?? JSON.stringify(row)),
    }
  })
}

function focusForMode(mode: AiMode): string[] | undefined {
  switch (mode) {
    case 'polish':
      return ['wording', 'impact']
    case 'complete':
      return ['completeness', 'missing_sections']
    case 'translate':
      return ['language']
    default:
      return undefined
  }
}

export const useAiStore = create<AiState>((set) => ({
  isLoading: false,
  result: null,
  error: null,
  lastMode: 'polish',

  optimize: async (resumeId, resumeData, options = {}) => {
    const mode = options.mode ?? 'polish'
    set({ isLoading: true, error: null, result: null, lastMode: mode })
    try {
      if (mode === 'match') {
        const jd = options.jobDescription?.trim()
        if (!jd) throw new Error('岗位描述不能为空')
        try {
          const res = await aiApi.match({ resumeId, jobDescription: jd })
          const match = (res.data ?? {}) as Record<string, unknown>
          const result: AiOptimizeResult = {
            score: typeof match.score === 'number' ? match.score : Number(match.matchScore ?? 80),
            suggestions: suggestionsFromMatch(match),
            optimizedData: resumeData,
          }
          set({ result, isLoading: false })
          return result
        } catch {
          const res = await multiagentApi.analyzeMatch({
            resumeId,
            resumeData,
            jobDescription: jd,
          })
          const match = (res.data ?? {}) as Record<string, unknown>
          const result: AiOptimizeResult = {
            score: typeof match.score === 'number' ? match.score : Number(match.matchScore ?? 80),
            suggestions: suggestionsFromMatch(match),
            optimizedData: resumeData,
          }
          set({ result, isLoading: false })
          return result
        }
      }

      const res = await multiagentApi.optimize({
        resumeId,
        resumeData,
        mode,
        optimizationFocus: focusForMode(mode),
        targetLanguage: mode === 'translate' ? 'en' : undefined,
      })
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
