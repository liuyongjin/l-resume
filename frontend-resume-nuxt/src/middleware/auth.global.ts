import { getAuthToken, isPublicPath, redirectToLogin } from '~/utils/auth-session'

export default defineNuxtRouteMiddleware((to) => {
  // 登录态保存在 localStorage，服务端无法读取；鉴权仅在客户端执行
  if (import.meta.server) return

  const path = to.path
  const token = getAuthToken()

  if (!token && !isPublicPath(path)) {
    if (import.meta.client) {
      redirectToLogin(to.fullPath)
      return abortNavigation()
    }
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (token && to.path === '/login') {
    return navigateTo('/')
  }
})
