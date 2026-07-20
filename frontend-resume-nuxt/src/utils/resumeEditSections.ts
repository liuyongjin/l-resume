import type { Component } from 'vue'

/** 预览区 componentId ↔ 编辑器侧栏 section key */
export const PREVIEW_TO_EDITOR: Record<string, string> = {
  basicInfo: 'basicInfo',
  summary: 'summary',
  experience: 'workExperience',
  education: 'education',
  skills: 'skills',
  projects: 'projectExperience',
  certificates: 'certificates',
  campusActivity: 'campusActivity',
  portfolio: 'portfolio',
  dataProjects: 'dataProjects',
  productAchievements: 'productAchievements',
  publications: 'publications',
  openSource: 'openSource',
  other: 'other',
}

export const EDITOR_TO_PREVIEW: Record<string, string> = Object.fromEntries(
  Object.entries(PREVIEW_TO_EDITOR).map(([preview, editor]) => [editor, preview])
)

/** 编辑器 section key ↔ resumes.style.layout.mainSection 存储键 */
export const EDITOR_TO_STORE: Record<string, string> = {
  summary: 'professionalSummary',
  workExperience: 'workExperience',
  education: 'education',
  projectExperience: 'projectExperience',
  skills: 'skills',
  certificates: 'certificates',
  campusActivity: 'campusActivity',
  portfolio: 'portfolio',
  dataProjects: 'dataProjects',
  productAchievements: 'productAchievements',
  publications: 'publications',
  openSource: 'openSourceProject',
  other: 'otherTags',
}

export const STORE_TO_EDITOR: Record<string, string> = Object.fromEntries(
  Object.entries(EDITOR_TO_STORE).map(([editor, store]) => [store, editor])
)
STORE_TO_EDITOR.basicInfo = 'basicInfo'

export const STORE_TO_PREVIEW: Record<string, string> = {
  basicInfo: 'basicInfo',
  professionalSummary: 'summary',
  workExperience: 'experience',
  projectExperience: 'projects',
  education: 'education',
  skills: 'skills',
  certificates: 'certificates',
  campusActivity: 'campusActivity',
  portfolio: 'portfolio',
  dataProjects: 'dataProjects',
  productAchievements: 'productAchievements',
  publications: 'publications',
  openSourceProject: 'openSource',
  otherTags: 'other',
}

export interface EditorSectionMeta {
  key: string
  label: string
  icon: Component
}

export function previewSectionToEditor(previewId: string): string | undefined {
  return PREVIEW_TO_EDITOR[previewId]
}

export function editorSectionToPreview(editorId: string): string {
  return EDITOR_TO_PREVIEW[editorId] || editorId
}

export function editorKeyToStoreKey(editorKey: string): string {
  if (editorKey === 'basicInfo') return 'basicInfo'
  return EDITOR_TO_STORE[editorKey] || editorKey
}

export function storeKeyToEditorKey(storeKey: string): string {
  return STORE_TO_EDITOR[storeKey] || storeKey
}

export function editorOrderToPreviewSectionOrder(editorKeys: string[]): Array<{ key: string }> {
  return editorKeys.map((key) => ({ key: editorSectionToPreview(key) }))
}

export function editorOrderToLayoutMainSection(editorKeys: string[]): string[] {
  return editorKeys.map((key) => editorKeyToStoreKey(key))
}

export function storeLayoutToPreviewSectionOrder(mainSection: string[]): Array<{ key: string }> {
  return mainSection.map((key) => ({ key: STORE_TO_PREVIEW[key] || key }))
}

/** 将模板 components（预览 id）转为 layout.mainSection 存储键顺序 */
export function themeComponentsToLayoutMainSection(componentIds: string[]): string[] {
  return componentIds.map((id) => {
    const editorKey = previewSectionToEditor(id) || storeKeyToEditorKey(id) || id
    return editorKeyToStoreKey(editorKey)
  })
}

/** 预览顺序中补全 basicInfo（兼容旧数据未包含 personal header 的情况） */
export function ensureBasicInfoInPreviewOrder(
  keys: string[],
  options?: { themeComponents?: string[]; hiddenSections?: string[] },
): string[] {
  const themeComponents = options?.themeComponents || []
  const hidden = options?.hiddenSections || []
  if (!themeComponents.includes('basicInfo') || hidden.includes('basicInfo')) {
    return keys
  }
  if (keys.includes('basicInfo')) return keys
  return ['basicInfo', ...keys]
}

/** 将模板中已展示（未隐藏）但 sectionOrder 未包含的区块补入预览顺序 */
export function ensureVisibleThemeSectionsInPreviewOrder(
  keys: string[],
  options?: { themeComponents?: string[]; hiddenSections?: string[] },
): string[] {
  const themeComponents = options?.themeComponents || []
  const hidden = new Set(options?.hiddenSections || [])
  if (!themeComponents.length) return keys

  const result = [...keys]
  const seen = new Set(result)
  for (const id of themeComponents) {
    if (hidden.has(id) || seen.has(id)) continue
    result.push(id)
    seen.add(id)
  }
  return result
}

export function sortEditorSections(
  sections: EditorSectionMeta[],
  orderHint?: string[],
): EditorSectionMeta[] {
  if (!orderHint?.length) return [...sections]

  const rank = new Map<string, number>()
  orderHint.forEach((key, index) => {
    rank.set(key, index)
    rank.set(storeKeyToEditorKey(key), index)
    const editorFromPreview = previewSectionToEditor(key)
    if (editorFromPreview) rank.set(editorFromPreview, index)
    const storeKey = editorKeyToStoreKey(key)
    if (storeKey) rank.set(storeKey, index)
  })

  const sorted = [...sections].sort((a, b) => {
    const rankA = rank.get(a.key) ?? (a.key === 'basicInfo' ? -0.5 : 999)
    const rankB = rank.get(b.key) ?? (b.key === 'basicInfo' ? -0.5 : 999)
    return rankA - rankB
  })

  const seen = new Set(sorted.map((section) => section.key))
  for (const section of sections) {
    if (!seen.has(section.key)) sorted.push(section)
  }
  return sorted
}

export function editZoneClass(interactive: boolean, isActive: boolean): string {
  if (!interactive) return ''
  if (isActive) return 'resume-edit-zone resume-edit-zone--active'
  return 'resume-edit-zone'
}
