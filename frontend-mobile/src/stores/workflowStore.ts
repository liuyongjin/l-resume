import { create } from 'zustand'
import { workflowsApi } from '@/api/workflows'
import type { Workflow } from '@/api/types'

interface WorkflowState {
  workflows: Workflow[]
  current: Workflow | null
  isLoading: boolean
  executionResult: Record<string, unknown> | null
  fetchList: () => Promise<void>
  fetchDefault: () => Promise<Workflow | null>
  fetchOne: (id: number) => Promise<Workflow | null>
  execute: (id: number, payload: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  updateWorkflow: (id: number, data: Partial<Workflow>) => Promise<boolean>
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  current: null,
  isLoading: false,
  executionResult: null,

  fetchList: async () => {
    set({ isLoading: true })
    try {
      const res = await workflowsApi.list()
      const list = (res.data ?? []) as Workflow[]
      set({ workflows: list, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchDefault: async () => {
    set({ isLoading: true })
    try {
      const res = await workflowsApi.getDefault()
      const wf = res.data as Workflow
      set({ current: wf, isLoading: false })
      return wf
    } catch {
      set({ isLoading: false })
      return null
    }
  },

  fetchOne: async (id) => {
    set({ isLoading: true })
    try {
      const res = await workflowsApi.getGraph(id)
      const wf = res.data as Workflow
      set({ current: wf, isLoading: false })
      return wf
    } catch {
      set({ isLoading: false })
      return null
    }
  },

  execute: async (id, payload) => {
    set({ isLoading: true, executionResult: null })
    try {
      const res = await workflowsApi.execute(id, payload)
      const result = (res.data ?? {}) as Record<string, unknown>
      set({ executionResult: result, isLoading: false })
      return result
    } catch {
      set({ isLoading: false })
      return null
    }
  },

  updateWorkflow: async (id, data) => {
    try {
      const res = await workflowsApi.update(id, data)
      const wf = res.data as Workflow
      if (wf) set({ current: wf })
      return true
    } catch {
      return false
    }
  },
}))
