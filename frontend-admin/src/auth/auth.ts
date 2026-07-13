export const API_BASE = import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:8088';

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
    data?: { accessToken: string };
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
