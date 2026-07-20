import { useThemeStore } from '~/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()

  return {
    theme: themeStore.theme,
    isDark: themeStore.isDark,
    applyTheme: themeStore.applyTheme,
    setPrimaryColor: themeStore.setPrimaryColor,
    setMode: themeStore.setMode,
    toggleMode: themeStore.toggleMode,
    setBorderRadius: themeStore.setBorderRadius,
    setFontFamily: themeStore.setFontFamily,
    setShadowIntensity: themeStore.setShadowIntensity,
    resetToDefault: themeStore.resetToDefault,
    loadTheme: themeStore.loadTheme
  }
}
