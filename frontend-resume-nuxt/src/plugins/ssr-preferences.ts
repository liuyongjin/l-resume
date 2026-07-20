export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()
  const langStore = useLanguageStore()

  useHead({
    htmlAttrs: {
      class: computed(() => (themeStore.theme.mode === 'dark' ? 'dark' : '')),
      lang: computed(() => (langStore.locale === 'zh' ? 'zh-CN' : 'en')),
    },
  })
})
