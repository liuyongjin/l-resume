export interface FontOption {
  value: string
  label: string
}

export const FONT_FAMILY_OPTIONS: FontOption[] = [
  { value: 'Microsoft YaHei, PingFang SC, sans-serif', label: '微软雅黑 / 苹方' },
  { value: 'SimSun, Songti SC, serif', label: '宋体' },
  { value: 'SimHei, Heiti SC, sans-serif', label: '黑体' },
  { value: 'KaiTi, Kaiti SC, serif', label: '楷体' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, Times New Roman, serif', label: 'Georgia / 衬线' },
  { value: 'system-ui, -apple-system, sans-serif', label: '系统默认' },
]

export const FONT_WEIGHT_OPTIONS: FontOption[] = [
  { value: 'normal', label: '常规 (400)' },
  { value: '500', label: '中等 (500)' },
  { value: '600', label: '半粗 (600)' },
  { value: '700', label: '粗体 (700)' },
]

export const FONT_STYLE_OPTIONS: FontOption[] = [
  { value: 'normal', label: '正常' },
  { value: 'italic', label: '斜体' },
]

const DOCX_FONT_ALIASES: Record<string, string> = {
  'system-ui': 'Microsoft YaHei',
  '-apple-system': 'Microsoft YaHei',
  'sans-serif': 'Microsoft YaHei',
  serif: 'SimSun',
  monospace: 'Consolas',
}

/** 从 font-family 栈中取 docx / Word 可用的主字体名 */
export function resolvePrimaryFontName(fontFamily?: string): string {
  const stack = (fontFamily || 'Microsoft YaHei, PingFang SC, sans-serif').split(',')
  for (const part of stack) {
    const raw = part.trim().replace(/['"]/g, '')
    if (!raw) continue
    const lower = raw.toLowerCase()
    if (DOCX_FONT_ALIASES[lower]) return DOCX_FONT_ALIASES[lower]
    if (!['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'].includes(lower)) {
      return raw
    }
  }
  return 'Microsoft YaHei'
}
