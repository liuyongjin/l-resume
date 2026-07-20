export default defineNuxtPlugin((nuxtApp) => {
  const loadingStore = useLoadingStore()
  const themeStore = useThemeStore()
  const langStore = useLanguageStore()
  const userStore = useUserStore()

  langStore.loadLocale()

  nuxtApp.hook('app:mounted', () => {
    Promise.all([
      themeStore.loadTheme(),
      userStore.loadUser(),
    ]).finally(() => {
      window.setTimeout(() => loadingStore.finishBoot(), 150)
    })
  })
})
