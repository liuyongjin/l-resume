const TOKEN_KEY = 'resume-token'
const USER_KEY = 'resume-user'
const TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7

export const PUBLIC_PATHS = new Set(['/', '/login'])

function readTokenFromDocumentCookie(): string | null {
  if (!import.meta.client) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`))
  if (!match?.[1]) return null
  try {
    const decoded = decodeURIComponent(match[1])
    return decoded.trim() || null
  } catch {
    return match[1].trim() || null
  }
}

export function isPublicPath(path: string): boolean {
  const normalized = !path || path === '/index'
    ? '/'
    : (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path)
  return PUBLIC_PATHS.has(normalized)
}

export function getAuthToken(): string | null {
  if (import.meta.client) {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored?.trim()) return stored
    return readTokenFromDocumentCookie()
  }

  const cookie = useCookie<string | null>(TOKEN_KEY, { default: () => null })
  const value = cookie.value
  return value?.trim() ? value : null
}

export function persistAuthToken(token: string): void {
  const cookie = useCookie<string | null>(TOKEN_KEY, {
    default: () => null,
    maxAge: TOKEN_MAX_AGE_SEC,
    path: '/',
    sameSite: 'lax',
  })
  cookie.value = token
  if (import.meta.client) {
    localStorage.setItem(TOKEN_KEY, token)
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SEC}; SameSite=Lax`
  }
}

export function clearAuthSession(): void {
  if (import.meta.client) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
  }

  try {
    const cookie = useCookie<string | null>(TOKEN_KEY, { default: () => null })
    cookie.value = null
  } catch {
    // 非 Nuxt 上下文时仅依赖 localStorage / document.cookie 清理
  }
}

export function redirectToLogin(returnPath?: string): void {
  if (!import.meta.client) return

  const currentPath = window.location.pathname
  if (isPublicPath(currentPath)) return

  const path = returnPath || currentPath + window.location.search
  const loginUrl = `/login?redirect=${encodeURIComponent(path)}`
  if (window.location.pathname !== '/login') {
    window.location.href = loginUrl
  }
}

export function isUnauthorizedStatus(status: number, errorCode?: number): boolean {
  return status === 401 || errorCode === 2001 || errorCode === 2002 || errorCode === 2003
}
