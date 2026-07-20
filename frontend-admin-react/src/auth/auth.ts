export const API_BASE = resolveApiBase();

function resolveApiBase(): string {
  const raw = import.meta.env.VITE_ADMIN_API_URL;
  // 空字符串：同源 + Vite 代理到 Java；未配置时直连本机 Java
  if (raw === '') return '';
  if (raw == null) return 'http://127.0.0.1:8088';
  return String(raw).replace(/\/$/, '');
}

const STORAGE_KEY = 'jianflow_admin_access_token';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function loginWithPassword(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json() as {
    success?: boolean;
    data?: { accessToken: string; expiresIn?: number };
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message || `登录失败 (${res.status})`);
  }

  if (!json.success || !json.data?.accessToken) {
    throw new Error('登录响应无效');
  }

  setAccessToken(json.data.accessToken);
}
