import { getStoredToken, setStoredToken, clearStoredToken } from '@/utils/tokenStorage'

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: { code: number; message: string }
}

const AUTH_ERROR_CODES = new Set([2001, 2002, 2003])

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api'

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function getToken(): Promise<string | null> {
  return getStoredToken()
}

export async function setToken(token: string): Promise<void> {
  await setStoredToken(token)
}

export async function clearToken(): Promise<void> {
  await clearStoredToken()
}

export async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getToken()

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${url}`, {
      ...options,
      cache: 'no-store',
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    })
  } catch {
    throw new ApiError('网络异常，请稍后重试')
  }

  let json: ApiResponse<T>
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(`请求失败 (${res.status})`, undefined, res.status)
  }

  if (!res.ok) {
    const code = json.error?.code
    if (res.status === 401 || (code !== undefined && AUTH_ERROR_CODES.has(code))) {
      await clearToken()
      unauthorizedHandler?.()
    }
    throw new ApiError(json.error?.message ?? `请求失败 (${res.status})`, code, res.status)
  }

  return json
}
