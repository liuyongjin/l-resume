export interface ThemeTokenInput {
  primaryColor: string
  secondaryColor: string
  ctaColor: string
  mode: 'light' | 'dark'
  borderRadius: 'sm' | 'md' | 'lg' | 'xl'
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized

  const num = parseInt(full, 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function hsl(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`
}

export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.min(255, (num >> 16) + amt)
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amt)
  const b = Math.min(255, (num & 0x0000ff) + amt)
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, (num >> 16) - amt)
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amt)
  const b = Math.max(0, (num & 0x0000ff) - amt)
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const radiusRemMap = {
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem'
} as const

const radiusPxMap = {
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '24px'
} as const

export function buildThemeTokens(input: ThemeTokenInput): Record<string, string> {
  const primary = hexToHsl(input.primaryColor)
  const hue = primary.h
  const sat = Math.max(primary.s, 40)
  const primaryLightness = input.mode === 'dark'
    ? Math.min(primary.l + 10, 62)
    : primary.l

  const tokens: Record<string, string> = {
    '--color-primary': input.primaryColor,
    '--color-primary-light': lightenColor(input.primaryColor, 20),
    '--color-primary-dark': darkenColor(input.primaryColor, 15),
    '--color-secondary': input.secondaryColor,
    '--color-cta': input.ctaColor,
    '--color-cta-light': lightenColor(input.ctaColor, 15),

    '--primary': hsl(hue, sat, primaryLightness),
    '--primary-foreground': hsl(0, 0, 100),
    '--ring': hsl(hue, sat, primaryLightness),

    '--radius': radiusRemMap[input.borderRadius],
    '--radius-sm': '6px',
    '--radius-md': radiusPxMap[input.borderRadius],
    '--radius-lg': '12px',
    '--radius-xl': '16px'
  }

  if (input.mode === 'dark') {
    Object.assign(tokens, {
      '--background': hsl(222, 47, 7),
      '--foreground': hsl(210, 40, 98),
      '--card': hsl(222, 47, 9),
      '--card-foreground': hsl(210, 40, 98),
      '--popover': hsl(222, 47, 9),
      '--popover-foreground': hsl(210, 40, 98),
      '--secondary': hsl(217, 33, 17),
      '--secondary-foreground': hsl(210, 40, 98),
      '--muted': hsl(217, 33, 17),
      '--muted-foreground': hsl(215, 20, 65),
      '--accent': hsl(217, 33, 17),
      '--accent-foreground': hsl(210, 40, 98),
      '--destructive': hsl(0, 63, 31),
      '--destructive-foreground': hsl(210, 40, 98),
      '--border': hsl(217, 33, 17),
      '--input': hsl(217, 33, 17),

      '--color-background': '#0F172A',
      '--color-background-white': '#1E293B',
      '--color-background-gray': '#334155',
      '--color-surface': '#1A2332',
      '--color-text-primary': '#F8FAFC',
      '--color-text-secondary': '#CBD5E1',
      '--color-text-tertiary': '#94A3B8',
      '--color-border': '#334155',
      '--color-gray-50': '#1E293B',
      '--color-gray-100': '#334155',
      '--color-gray-200': '#475569',
      '--color-gray-300': '#64748B',
      '--color-gray-400': '#94A3B8',
      '--color-gray-500': '#CBD5E1',
      '--color-gray-600': '#E2E8F0',
      '--color-gray-700': '#F1F5F9',
      '--color-gray-800': '#F8FAFC',
      '--color-gray-900': '#FFFFFF'
    })
  } else {
    Object.assign(tokens, {
      '--background': hsl(0, 0, 100),
      '--foreground': hsl(0, 0, 13),
      '--card': hsl(0, 0, 100),
      '--card-foreground': hsl(0, 0, 13),
      '--popover': hsl(0, 0, 100),
      '--popover-foreground': hsl(0, 0, 13),
      '--secondary': hsl(0, 0, 96),
      '--secondary-foreground': hsl(0, 0, 13),
      '--muted': hsl(0, 0, 96),
      '--muted-foreground': hsl(0, 0, 45),
      '--accent': hsl(0, 0, 96),
      '--accent-foreground': hsl(0, 0, 13),
      '--destructive': hsl(0, 84, 60),
      '--destructive-foreground': hsl(0, 0, 100),
      '--border': hsl(0, 0, 91),
      '--input': hsl(0, 0, 91),

      '--color-background': '#FFFFFF',
      '--color-background-white': '#FFFFFF',
      '--color-background-gray': '#F6F6F6',
      '--color-surface': '#F6F6F6',
      '--color-text-primary': '#1A1A1A',
      '--color-text-secondary': '#666666',
      '--color-text-tertiary': '#999999',
      '--color-border': '#E8E8E8',
      '--color-gray-50': '#F6F6F6',
      '--color-gray-100': '#F6F6F6',
      '--color-gray-200': '#E8E8E8',
      '--color-gray-300': '#D1D5DB',
      '--color-gray-400': '#9CA3AF',
      '--color-gray-500': '#6B7280',
      '--color-gray-600': '#4B5563',
      '--color-gray-700': '#374151',
      '--color-gray-800': '#1F2937',
      '--color-gray-900': '#111827'
    })
  }

  return tokens
}

export const DEFAULT_PRIMARY_COLOR = '#0EA5E9'
