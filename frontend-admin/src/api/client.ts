import { getAccessToken, clearTokens } from '../auth/auth';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_ADMIN_API_URL ?? 'http://localhost:8088';
  const token = getAccessToken();

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });

  if (res.status === 401) {
    clearTokens();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
