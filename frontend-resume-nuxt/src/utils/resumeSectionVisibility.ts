import { getTemplateSchemaByThemeKey } from '~/components/resume/schema/templates'
import { themes } from '~/components/resume/ThemeConfig'
import { editorSectionToPreview } from '~/utils/resumeEditSections'

/** 预览区区块 ID（与 sectionOrder / data-edit-section 一致） */
export type PreviewSectionKey = string

export function resolveDefaultHiddenSections(themeKey?: string | null): PreviewSectionKey[] {
  if (!themeKey) return []
  const fromSchema = getTemplateSchemaByThemeKey(themeKey)?.defaultHiddenSections
  if (fromSchema?.length) return [...fromSchema]
  const fromTheme = themes[themeKey]?.defaultHiddenSections
  if (fromTheme?.length) return [...fromTheme]
  return []
}

/** 从 resume.style 或模板默认值解析 hiddenSections */
export function normalizeHiddenSections(
  style: { hiddenSections?: unknown } | null | undefined,
  themeKey?: string | null,
): PreviewSectionKey[] {
  if (style && 'hiddenSections' in style && Array.isArray(style.hiddenSections)) {
    return style.hiddenSections.filter((k): k is string => typeof k === 'string' && k.length > 0)
  }
  return resolveDefaultHiddenSections(themeKey)
}

export function isPreviewSectionVisible(
  previewKey: PreviewSectionKey,
  hiddenSections: PreviewSectionKey[],
): boolean {
  return !hiddenSections.includes(previewKey)
}

export function isEditorSectionVisible(
  editorKey: string,
  hiddenSections: PreviewSectionKey[],
): boolean {
  return isPreviewSectionVisible(editorSectionToPreview(editorKey), hiddenSections)
}

export function toggleEditorSectionVisibility(
  hiddenSections: PreviewSectionKey[],
  editorKey: string,
): PreviewSectionKey[] {
  const previewKey = editorSectionToPreview(editorKey)
  const next = [...hiddenSections]
  const idx = next.indexOf(previewKey)
  if (idx >= 0) next.splice(idx, 1)
  else next.push(previewKey)
  return next
}
