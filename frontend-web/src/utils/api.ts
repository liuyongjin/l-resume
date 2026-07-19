// API 客户端 - 统一封装后端请求
import {
  clearAuthSession,
  getAuthToken,
  isPublicPath,
  isUnauthorizedStatus,
  redirectToLogin,
} from '~/utils/auth-session'

const API_BASE = '/api'

export interface AssistantSkillAction {
  id: string
  name: string
  action: string
  label: string
  description?: string
  payload?: {
    path?: string
    templateHint?: string
    templateNameHint?: string
    autoCreate?: boolean
    query?: Record<string, string>
  }
}

interface RequestOptions {
  /** 退出登录等场景：401 时不触发跳转登录页 */
  skipAuthRedirect?: boolean
}

async function parseResponseBody(res: Response): Promise<{
  json: Record<string, unknown>
  rawText: string
}> {
  const rawText = await res.text()
  if (!rawText.trim()) {
    if (!res.ok) {
      throw new Error(`请求失败 (${res.status})，服务器未返回内容`)
    }
    return { json: {}, rawText: '' }
  }

  try {
    const json = JSON.parse(rawText) as Record<string, unknown>
    return { json, rawText }
  } catch {
    throw new Error(`服务器响应格式错误 (${res.status})`)
  }
}

async function request<T = any>(
  url: string,
  options: RequestInit = {},
  requestOptions: RequestOptions = {},
): Promise<{ success: boolean; data?: T; message?: string; error?: { code: number; message: string } }> {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // 非 FormData 请求默认使用 JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${url}`, {
      ...options,
      cache: 'no-store',
      headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '网络请求失败'
    if (/aborted|timeout|timed out/i.test(message)) {
      throw new Error('请求超时，AI 处理耗时较长，请稍后重试')
    }
    throw new Error('网络连接失败，请确认后端服务已启动')
  }

  const { json } = await parseResponseBody(res)
  const errorPayload = json.error as { code?: number; message?: string } | undefined

  if (!res.ok) {
    if (isUnauthorizedStatus(res.status, errorPayload?.code)) {
      if (!requestOptions.skipAuthRedirect) {
        clearAuthSession()
        if (import.meta.client && !isPublicPath(window.location.pathname)) {
          redirectToLogin()
        }
      }
    }
    throw new Error(errorPayload?.message || `请求失败 (${res.status})`)
  }

  return json as { success: boolean; data?: T; message?: string; error?: { code: number; message: string } }
}

export const api = {
  // 认证
  auth: {
    login: (phone: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      }),
    register: (username: string, email: string, password: string) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),
    profile: () => request('/auth/profile'),
    logout: () => request('/auth/logout', { method: 'POST' }, { skipAuthRedirect: true }),
  },

  // 简历
  resumes: {
    list: (page = 1, limit = 10) =>
      request(`/resumes?page=${page}&limit=${limit}`),
    get: (id: number) => request(`/resumes/${id}`),
    create: (data: { title: string; data: any; style?: any; templateId?: string; source?: string }) =>
      request('/resumes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: {
      title?: string
      data?: any
      style?: any
      templateId?: string
      expectedUpdatedAt?: string
    }) =>
      request(`/resumes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/resumes/${id}`, { method: 'DELETE' }),
    batchDelete: (ids: number[]) =>
      request('/resumes/batch/delete', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    duplicate: (id: number) =>
      request(`/resumes/${id}/duplicate`, { method: 'POST' }),
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('file', file, file.name)
      formData.append('fileName', file.name)
      return request<{
        filePath: string
        fileName: string
        fileSize: number
        mimeType: string
        uploadedAt: string
      }>('/resumes/upload', {
        method: 'POST',
        body: formData,
      })
    },
    uploadAvatar: (file: File) => {
      const formData = new FormData()
      formData.append('file', file, file.name)
      return request<{
        filePath: string
        fileName: string
        fileSize: number
        mimeType: string
        uploadedAt: string
        url: string
      }>('/resumes/avatar/upload', {
        method: 'POST',
        body: formData,
      })
    },
  },

  // 模板
  templates: {
    list: (page = 1, limit = 10, isActive?: boolean) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (isActive !== undefined) params.set('isActive', String(isActive))
      return request(`/templates?${params.toString()}`)
    },
    get: (id: string) => request(`/templates/${id}`),
  },

  // AI 功能
  ai: {
    optimize: (data: { resumeId?: number; section: string; content: string }) =>
      request('/ai/optimize', { method: 'POST', body: JSON.stringify(data) }),
    check: (data: { resumeId?: number }) =>
      request('/ai/check', { method: 'POST', body: JSON.stringify(data) }),
    rewrite: (data: { resumeId?: number; section: string; style?: string }) =>
      request('/ai/rewrite', { method: 'POST', body: JSON.stringify(data) }),
    generate: (data: { section: string; context?: Record<string, unknown> }) =>
      request('/ai/generate', { method: 'POST', body: JSON.stringify(data) }),
    analyze: (data: { resumeId?: number }) =>
      request('/ai/analyze', { method: 'POST', body: JSON.stringify(data) }),
    match: (data: { resumeId: number; jobDescription: string }) =>
      request('/ai/match', { method: 'POST', body: JSON.stringify(data) }),
    resumeChat: (data: {
      resumeId: number
      sessionId?: string
      message: string
      modelId?: string
      actionType?: 'chat' | 'translate' | 'translate_en' | 'translate_zh'
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
      resumeData?: Record<string, unknown>
      style?: Record<string, unknown>
    }) =>
      request('/ai/resume-chat', { method: 'POST', body: JSON.stringify(data) }),
    chatPrompts: (count = 6) => request(`/ai/chat-prompts?count=${count}`),
    listChatSessions: (resumeId: number) =>
      request(`/ai/chat-sessions?resumeId=${resumeId}`),
    createChatSession: (data: { resumeId: number; modelId?: string; title?: string }) =>
      request('/ai/chat-sessions', { method: 'POST', body: JSON.stringify(data) }),
    getChatSession: (sessionId: string) => request(`/ai/chat-sessions/${sessionId}`),
    assistantChatStream: async (
      data: {
        message: string
        history?: Array<{ role: 'user' | 'assistant'; content: string }>
        modelId?: string
      },
      handlers: {
        onDelta: (delta: string) => void
        onSkills?: (skills: AssistantSkillAction[]) => void
        onError?: (message: string) => void
        signal?: AbortSignal
      },
    ) => {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/ai/assistant-chat/stream`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: handlers.signal,
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '')
        let message = `请求失败 (${res.status})`
        try {
          const json = JSON.parse(text)
          message = json?.error?.message || json?.message || message
        } catch {
          if (text) message = text
        }
        throw new Error(message)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n')
        buffer = chunks.pop() || ''
        for (const rawLine of chunks) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const event = JSON.parse(payload) as {
              type?: string
              skills?: AssistantSkillAction[]
              delta?: string
              error?: string
            }
            if (event.error) {
              handlers.onError?.(event.error)
              continue
            }
            if (event.type === 'skill' && Array.isArray(event.skills) && event.skills.length) {
              handlers.onSkills?.(event.skills)
              continue
            }
            if (event.delta) handlers.onDelta(event.delta)
          } catch {
            // ignore malformed chunks
          }
        }
      }
    },
  },

  // 多智能体
  multiagent: {
    capabilities: () => request('/multiagent/capabilities'),
    generateVersions: (data: {
      resumeData: any
      resumeId?: number
      targetRole?: string
      templateId?: string
      versionsCount?: number
      styles?: string[]
      generateEnglish?: boolean
      englishVersionsCount?: number
      industry?: string
      experienceLevel?: string
      workflowNodes?: any[]
      agentConfigs?: Record<string, any>
    }) =>
      request('/multiagent/generate-versions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    optimize: (data: { resumeData?: any; resumeId?: number; optimizationFocus?: string[]; agentConfigs?: Record<string, any> }) =>
      request('/multiagent/optimize', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    analyzeMatch: (data: { resumeData?: any; resumeId?: number; jobDescription: string; agentConfigs?: Record<string, any> }) =>
      request('/multiagent/analyze-match', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    translate: (data: { resumeData: any; targetLanguage?: string }) =>
      request('/multiagent/translate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // 工作流
  workflows: {
    health: () => request<{ multiagent: { available: boolean; url: string }; ready: boolean }>('/workflows/health'),
    list: () => request('/workflows'),
    getNodeLibrary: () => request('/workflows/node-library'),
    listLlmModels: () => request('/workflows/llm-models'),
    getDefault: (params?: { version?: number }) => {
      const query = params?.version != null ? `?version=${params.version}` : ''
      return request(`/workflows/default${query}`)
    },
    listVersions: () => request('/workflows/versions'),
    getVersion: (versionId: number) => request(`/workflows/versions/${versionId}`),
    getGraph: (id: number | string) => request(`/workflows/${id}/graph`),
    get: (id: number | string) => request(`/workflows/${id}`),
    publish: (data: {
      name: string
      description?: string
      nodes: any
      connections: any
      config?: any
    }) =>
      request('/workflows/publish', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    test: (data: {
      name?: string
      description?: string
      config?: Record<string, unknown>
      nodes: any
      connections: any
      workflowId?: number
      resumeData?: Record<string, unknown>
      rawText?: string
      targetRole?: string
      templateId?: string
      idempotencyKey?: string
    }) =>
      request('/workflows/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    restoreVersion: (versionId: number) =>
      request(`/workflows/versions/${versionId}/restore`, { method: 'POST' }),
    deleteVersion: (versionId: number) =>
      request(`/workflows/versions/${versionId}`, { method: 'DELETE' }),
    save: (data: { name: string; description?: string; nodes: any; connections: any; config?: any; isDefault?: boolean }) =>
      request('/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number | string, data: { name?: string; description?: string; nodes?: any; connections?: any; config?: any; isDefault?: boolean }) =>
      request(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    executeTool: (data: { type: string; config?: Record<string, unknown>; input?: unknown }) =>
      request('/workflows/tools/execute', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    execute: (id: number | string, data: {
      filePath?: string
      uploadFileName?: string
      resumeData?: any
      rawText?: string
      resumeId?: number
      targetRole?: string
      templateId?: string
      templateIds?: string[]
      outputLanguages?: ('zh' | 'en')[]
      saveToDatabase?: boolean
      versionsCount?: number
      styles?: string[]
      generateEnglish?: boolean
      englishVersionsCount?: number
      industry?: string
      experienceLevel?: string
      optimizationFocus?: string[]
      idempotencyKey?: string
    }) =>
      request(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request(`/workflows/${id}`, { method: 'DELETE' }),
  },
}
