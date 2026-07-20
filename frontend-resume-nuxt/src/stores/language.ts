import { defineStore } from 'pinia'
import { computed } from 'vue'
import { zh, type LocaleMessages } from '~/locales/zh'
import { en } from '~/locales/en'

type Locale = 'zh' | 'en'

const messages: Record<Locale, LocaleMessages> = { zh, en }

export const useLanguageStore = defineStore('language', () => {
  const localeCookie = useCookie<Locale>('resume-locale', { default: () => 'zh' })

  const locale = computed({
    get: () => localeCookie.value,
    set: (newLocale: Locale) => {
      localeCookie.value = newLocale
      if (import.meta.client) {
        localStorage.setItem('resume-locale', newLocale)
      }
    },
  })

  const t = computed(() => messages[locale.value])

  const setLocale = (newLocale: Locale) => {
    locale.value = newLocale
  }

  const toggleLocale = () => {
    setLocale(locale.value === 'zh' ? 'en' : 'zh')
  }

  const loadLocale = () => {
    if (!import.meta.client) return
    const saved = localStorage.getItem('resume-locale') as Locale | null
    if (saved && (saved === 'zh' || saved === 'en') && saved !== localeCookie.value) {
      locale.value = saved
    }
  }

  return {
    locale,
    t,
    setLocale,
    toggleLocale,
    loadLocale,
  }
})
