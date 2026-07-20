/** 非首页进入时清空 Pinia 中的列表/详情缓存，强制各页重新拉取接口 */
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return
  if (to.path === '/') return

  useResumeStore().clearCachedData()
  useTemplateStore().clearCachedData()
})
