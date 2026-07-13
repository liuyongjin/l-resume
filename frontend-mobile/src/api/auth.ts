import { request } from './client'

export interface AuthUser {
  username: string
  email: string
  createdAt: string
}

export const authApi = {
  login: (phone: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  profile: () => request<AuthUser>('/auth/profile'),

  logout: () => request('/auth/logout', { method: 'POST' }),
}
