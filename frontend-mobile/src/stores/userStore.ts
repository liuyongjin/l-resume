import { create } from 'zustand'
import { authApi } from '@/api/auth'
import { setToken, clearToken, getToken, setUnauthorizedHandler } from '@/api/client'

export interface User {
  username: string
  email: string
  createdAt: string
}

interface UserState {
  user: User | null
  isLoading: boolean
  isLoggedIn: boolean
  isReady: boolean
  bootstrap: () => Promise<void>
  login: (phone: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  clearSession: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  isLoggedIn: false,
  isReady: false,

  clearSession: async () => {
    await clearToken()
    set({ user: null, isLoggedIn: false })
  },

  bootstrap: async () => {
    setUnauthorizedHandler(() => {
      void get().clearSession()
    })

    const token = await getToken()
    if (!token) {
      set({ isReady: true, isLoggedIn: false, user: null })
      return
    }

    try {
      const res = await authApi.profile()
      if (res.success && res.data) {
        set({ user: res.data, isLoggedIn: true, isReady: true })
        return
      }
    } catch {
      await get().clearSession()
    }
    set({ isReady: true, isLoggedIn: false, user: null })
  },

  login: async (phone, password) => {
    set({ isLoading: true })
    try {
      const res = await authApi.login(phone, password)
      if (res.success && res.data) {
        await setToken(res.data.token)
        set({ user: res.data.user, isLoggedIn: true, isLoading: false })
        return { success: true, message: '登录成功' }
      }
      set({ isLoading: false })
      return { success: false, message: '登录失败' }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, message: err instanceof Error ? err.message : '登录失败' }
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true })
    try {
      const res = await authApi.register(username, email, password)
      if (res.success && res.data) {
        await setToken(res.data.token)
        set({ user: res.data.user, isLoggedIn: true, isLoading: false })
        return { success: true, message: '注册成功' }
      }
      set({ isLoading: false })
      return { success: false, message: '注册失败' }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, message: err instanceof Error ? err.message : '注册失败' }
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    await get().clearSession()
    set({ isLoading: false })
  },
}))
