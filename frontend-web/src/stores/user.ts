import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '~/utils/api'
import { clearAuthSession, getAuthToken, persistAuthToken } from '~/utils/auth-session'

export interface User {
  username: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

const USER_KEY = 'resume-user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getAuthToken())
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value && !!token.value)

  const persistSession = (userData: User, jwtToken: string) => {
    user.value = userData
    token.value = jwtToken
    persistAuthToken(jwtToken)
    if (import.meta.client) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    }
  }

  const clearSession = () => {
    user.value = null
    token.value = null
    clearAuthSession()
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    isLoading.value = true
    try {
      const res = await api.auth.login(email, password)
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data as any
        persistSession(
          {
            username: userData.username,
            email: userData.email,
            name: userData.username,
            avatar: '',
            createdAt: userData.createdAt,
          },
          jwtToken,
        )
        isLoading.value = false
        return { success: true, message: '登录成功' }
      }
      isLoading.value = false
      return { success: false, message: '登录失败' }
    } catch (err: any) {
      isLoading.value = false
      return { success: false, message: err.message || '登录失败，请稍后重试' }
    }
  }

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    isLoading.value = true
    try {
      const res = await api.auth.register(name, email, password)
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data as any
        persistSession(
          {
            username: userData.username,
            email: userData.email,
            name: userData.username,
            avatar: '',
            createdAt: userData.createdAt,
          },
          jwtToken,
        )
        isLoading.value = false
        return { success: true, message: '注册成功' }
      }
      isLoading.value = false
      return { success: false, message: '注册失败' }
    } catch (err: any) {
      isLoading.value = false
      return { success: false, message: err.message || '注册失败，请稍后重试' }
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (err) {
      console.error('退出登录接口调用失败', err)
    } finally {
      clearSession()
    }
  }

  const loadUser = () => {
    if (!import.meta.client) return
    const savedUser = localStorage.getItem(USER_KEY)
    const savedToken = getAuthToken()
    if (savedUser && savedToken) {
      try {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
        return
      } catch {
        clearSession()
      }
    }
    if (savedToken) {
      token.value = savedToken
    }
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    login,
    register,
    logout,
    loadUser,
  }
})
