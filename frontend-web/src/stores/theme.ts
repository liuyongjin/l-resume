import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import {
  buildThemeTokens,
  darkenColor,
  DEFAULT_PRIMARY_COLOR,
  lightenColor
} from '~/utils/theme-tokens'

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  ctaColor: string
  borderRadius: 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: string
  mode: 'light' | 'dark'
  shadowIntensity: 'none' | 'low' | 'medium' | 'high'
}

export const useThemeStore = defineStore('theme', () => {
  const themeModeCookie = useCookie<'light' | 'dark'>('resume-theme-mode', { default: () => 'light' })

  const theme = ref<ThemeConfig>({
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: '#BAE6FD',
    ctaColor: '#D946EF',
    borderRadius: 'md',
    fontFamily: 'Source Sans 3',
    mode: themeModeCookie.value,
    shadowIntensity: 'medium'
  })

  const borderRadiusValues: Record<ThemeConfig['borderRadius'], string> = {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }

  const shadowValues: Record<ThemeConfig['shadowIntensity'], string> = {
    none: 'none',
    low: '0 1px 2px rgba(15, 23, 42, 0.05)',
    medium: '0 4px 12px rgba(15, 23, 42, 0.08)',
    high: '0 8px 24px rgba(15, 23, 42, 0.12)'
  }

  const fontFamilies: Record<string, string> = {
    'Source Sans 3': "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    'Plus Jakarta Sans': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    Inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    Roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    'SF Pro Display': "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    'Microsoft YaHei': "'Microsoft YaHei', 'PingFang SC', sans-serif"
  }

  const isDark = computed(() => theme.value.mode === 'dark')

  const applyTheme = () => {
    if (!import.meta.client) {
      return
    }

    const root = document.documentElement
    const tokens = buildThemeTokens({
      primaryColor: theme.value.primaryColor,
      secondaryColor: theme.value.secondaryColor,
      ctaColor: theme.value.ctaColor,
      mode: theme.value.mode,
      borderRadius: theme.value.borderRadius
    })

    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value)
    }

    root.style.setProperty(
      '--font-family',
      fontFamilies[theme.value.fontFamily] || fontFamilies['Source Sans 3']
    )
    root.style.setProperty('--shadow-sm', shadowValues.low)
    root.style.setProperty(
      '--shadow-md',
      theme.value.mode === 'dark'
        ? {
            none: 'none',
            low: '0 1px 2px rgba(0,0,0,0.25)',
            medium: '0 4px 12px rgba(0,0,0,0.35)',
            high: '0 8px 24px rgba(0,0,0,0.45)'
          }[theme.value.shadowIntensity]
        : shadowValues[theme.value.shadowIntensity]
    )
    root.style.setProperty(
      '--shadow-lg',
      theme.value.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.45)' : shadowValues.high
    )

    root.classList.toggle('dark', theme.value.mode === 'dark')
    root.style.colorScheme = theme.value.mode

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme.value.mode === 'dark' ? '#0F172A' : theme.value.primaryColor
      )
    }
  }

  const setPrimaryColor = (color: string) => {
    theme.value.primaryColor = color
    theme.value.ctaColor = color
    theme.value.secondaryColor = lightenColor(color, 35)
  }

  const setMode = (mode: 'light' | 'dark') => {
    theme.value.mode = mode
    themeModeCookie.value = mode
  }

  const toggleMode = () => {
    setMode(theme.value.mode === 'light' ? 'dark' : 'light')
  }

  const setBorderRadius = (radius: ThemeConfig['borderRadius']) => {
    theme.value.borderRadius = radius
  }

  const setFontFamily = (fontFamily: string) => {
    theme.value.fontFamily = fontFamily
  }

  const setShadowIntensity = (intensity: ThemeConfig['shadowIntensity']) => {
    theme.value.shadowIntensity = intensity
  }

  const resetToDefault = () => {
    theme.value.primaryColor = DEFAULT_PRIMARY_COLOR
    theme.value.secondaryColor = '#BAE6FD'
    theme.value.ctaColor = '#D946EF'
    theme.value.borderRadius = 'md'
    theme.value.fontFamily = 'Source Sans 3'
    theme.value.mode = 'light'
    theme.value.shadowIntensity = 'medium'
    themeModeCookie.value = 'light'
  }

  const loadTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('resume-theme')
      if (saved) {
        try {
          const savedTheme = JSON.parse(saved) as Partial<ThemeConfig>
          theme.value = { ...theme.value, ...savedTheme }
          if (savedTheme.mode === 'light' || savedTheme.mode === 'dark') {
            themeModeCookie.value = savedTheme.mode
          }
        } catch {
          console.error('Failed to load theme from localStorage')
        }
      }
    }
    applyTheme()
  }

  watch(
    theme,
    () => {
      themeModeCookie.value = theme.value.mode
      applyTheme()
      if (import.meta.client) {
        localStorage.setItem('resume-theme', JSON.stringify(theme.value))
      }
    },
    { deep: true }
  )

  return {
    theme,
    isDark,
    applyTheme,
    setPrimaryColor,
    setMode,
    toggleMode,
    setBorderRadius,
    setFontFamily,
    setShadowIntensity,
    resetToDefault,
    loadTheme,
    borderRadiusValues,
    shadowValues,
    fontFamilies,
    lightenColor,
    darkenColor
  }
})
