export const PAPER_SPECS = {
  A4: { width: '210mm', height: '297mm', label: 'A4', sublabel: '210 × 297 mm' },
  Letter: { width: '215.9mm', height: '279.4mm', label: 'Letter', sublabel: '8.5 × 11 in' },
  A5: { width: '148mm', height: '210mm', label: 'A5', sublabel: '148 × 210 mm' },
} as const

export type PaperSizeKey = keyof typeof PAPER_SPECS

export const PAPER_SIZE_OPTIONS: Array<{ value: PaperSizeKey; label: string; sublabel: string }> = [
  { value: 'A4', label: PAPER_SPECS.A4.label, sublabel: PAPER_SPECS.A4.sublabel },
  { value: 'Letter', label: PAPER_SPECS.Letter.label, sublabel: PAPER_SPECS.Letter.sublabel },
  { value: 'A5', label: PAPER_SPECS.A5.label, sublabel: PAPER_SPECS.A5.sublabel },
]

export function normalizePaperSize(value?: string | null): PaperSizeKey {
  if (value && value in PAPER_SPECS) return value as PaperSizeKey
  return 'A4'
}

export function getPaperWidth(paperSize?: string | null): string {
  return PAPER_SPECS[normalizePaperSize(paperSize)].width
}

export function getPaperMaxWidthStyle(paperSize?: string | null, embedded = false): string {
  const width = getPaperWidth(paperSize)
  return embedded ? `min(100%, ${width})` : width
}
