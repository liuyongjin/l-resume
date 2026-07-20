import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '~/utils/api'
import { mapApiTemplateToListItem, resolveTemplateBrandColor, type TemplateListItem } from '~/utils/templateUi'
import { storeDataToPreviewData, emptyPreviewData, normalizeResumeData, type PreviewResumeData } from '~/utils/resumeTransform'
import { getThemeByTemplateId, applyBrandColorToTheme, type ThemeConfig } from '~/components/resume/ThemeConfig'
import type { ResumeData, ResumeStyle } from '~/stores/resume'
import { defaultStyle } from '~/stores/resume'
import { themeComponentsToLayoutMainSection } from '~/utils/resumeEditSections'

export interface TemplateConfigJson {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  layout?: string
  layoutPreset?: string
  themeKey?: string
  components?: string[]
  sampleData?: Record<string, unknown>
  defaultHiddenSections?: string[]
}

export interface ApiTemplate {
  id: string
  name: string
  description: string | null
  previewUrl: string | null
  data?: Record<string, unknown> | string
  style?: Record<string, unknown> | string
  config: TemplateConfigJson | string
  isActive: boolean
}

function parseConfig(config: TemplateConfigJson | string): TemplateConfigJson {
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as TemplateConfigJson
    } catch {
      return {}
    }
  }
  return config || {}
}

function parseTemplateStyle(style: unknown): Record<string, unknown> | null {
  if (!style) return null
  if (typeof style === 'string') {
    try {
      return JSON.parse(style) as Record<string, unknown>
    } catch {
      return null
    }
  }
  if (typeof style === 'object') return style as Record<string, unknown>
  return null
}

const DEDICATED_LAYOUTS = new Set(['frontendEngineer', 'developer', 'productManager', 'freshGraduate'])

/** 旧库 config.layout=composer 时，仍使用 ThemeConfig 中的专用布局 */
function resolveTemplateLayout(cfgLayout?: string, baseLayout?: string): string {
  if (cfgLayout && DEDICATED_LAYOUTS.has(cfgLayout)) return cfgLayout
  if (baseLayout && DEDICATED_LAYOUTS.has(baseLayout)) return baseLayout
  return cfgLayout || baseLayout || 'composer'
}

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<TemplateListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const previewDataMap = ref<Record<string, PreviewResumeData>>({})

  const templateListItems = computed(() => templates.value)

  function clearCachedData() {
    templates.value = []
    previewDataMap.value = {}
  }

  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      const res = await api.templates.list(1, 50, true)
      const list = (res.data as { templates?: ApiTemplate[] })?.templates || []
      templates.value = list
        .filter((t) => t.isActive)
        .map((t) => {
          const item = mapApiTemplateToListItem({ ...t, config: parseConfig(t.config) })
          const data = typeof t.data === 'string' ? JSON.parse(t.data) : t.data
          return { ...item, data, style: t.style }
        })
      await buildPreviewDataFromResumes([])
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '获取模板失败'
      templates.value = []
    } finally {
      loading.value = false
    }
  }

  async function buildPreviewDataFromResumes(resumes: Array<{ templateId?: string; data?: ResumeData }>) {
    const map: Record<string, PreviewResumeData> = {}
    for (const tpl of templates.value) {
      const themeKey = tpl.themeKey
      const sampleFromConfig = tpl.config?.sampleData
      if (sampleFromConfig) {
        map[tpl.id] = storeDataToPreviewData(normalizeResumeData(sampleFromConfig))
        continue
      }
      const dataFromTemplate = (tpl as { data?: unknown }).data
      if (dataFromTemplate && typeof dataFromTemplate === 'object') {
        map[tpl.id] = storeDataToPreviewData(normalizeResumeData(dataFromTemplate))
        continue
      }
      const sample = resumes.find(
        (r) => r.templateId === themeKey || r.templateId === tpl.id
      )
      map[tpl.id] = sample?.data
        ? storeDataToPreviewData(normalizeResumeData(sample.data))
        : emptyPreviewData()
    }
    previewDataMap.value = map
  }

  function getSampleResumeData(templateId: string): ResumeData {
    const tpl = templates.value.find((t) => t.id === templateId || t.themeKey === templateId)
    const dataFromTemplate = (tpl as any)?.data
    if (dataFromTemplate && typeof dataFromTemplate === 'object') {
      return normalizeResumeData(dataFromTemplate)
    }
    if (tpl?.config?.sampleData) {
      return normalizeResumeData(tpl.config.sampleData)
    }
    return normalizeResumeData(null)
  }

  function getThemeForTemplate(templateId: string): ThemeConfig {
    const tpl = templates.value.find((t) => t.id === templateId || t.themeKey === templateId)
    const themeKey = tpl?.themeKey || templateId
    const base = getThemeByTemplateId(themeKey)
    const cfg = tpl?.config || {}
    const brandColor = resolveTemplateBrandColor(themeKey, cfg.primaryColor)
    return applyBrandColorToTheme({
      ...base,
      layout: resolveTemplateLayout(cfg.layout, base.layout),
      layoutPreset: cfg.layoutPreset || base.layoutPreset,
      components: cfg.components?.length ? cfg.components : base.components,
      defaultHiddenSections: cfg.defaultHiddenSections?.length
        ? cfg.defaultHiddenSections
        : base.defaultHiddenSections,
    }, brandColor)
  }

  function getPreviewData(templateId: string): PreviewResumeData {
    return previewDataMap.value[templateId] || emptyPreviewData()
  }

  function getTemplateName(templateId?: string | null) {
    if (!templateId) return '未指定模板'
    const byTheme = templates.value.find((t) => t.themeKey === templateId)
    if (byTheme) return byTheme.name
    const byId = templates.value.find((t) => t.id === templateId)
    if (byId) return byId.name
    return templateId
  }

  function getThemeKey(templateId: string) {
    return templates.value.find((t) => t.id === templateId)?.themeKey || templateId
  }

  function getStyleForTemplate(templateId: string): ResumeStyle {
    const tpl = templates.value.find((t) => t.id === templateId || t.themeKey === templateId)
    const themeKey = tpl?.themeKey || templateId
    const cfg = tpl?.config || {}
    const theme = getThemeForTemplate(tpl?.id || templateId)
    const brandColor = resolveTemplateBrandColor(themeKey, cfg.primaryColor)
    const mainFromComponents = themeComponentsToLayoutMainSection(theme.components || [])
    const base = defaultStyle()
    const raw = parseTemplateStyle((tpl as { style?: unknown })?.style)
    const layout = (raw?.layout as ResumeStyle['layout']) || base.layout
    return {
      ...base,
      ...(raw || {}),
      theme: brandColor || theme.primaryColor || base.theme,
      layout: {
        mainSection: layout?.mainSection?.length ? layout.mainSection : mainFromComponents,
        sidebar: layout?.sidebar || [],
      },
      hiddenSections: (raw?.hiddenSections as string[]) || theme.defaultHiddenSections || [],
    }
  }

  return {
    templates,
    templateListItems,
    loading,
    error,
    previewDataMap,
    clearCachedData,
    fetchTemplates,
    buildPreviewDataFromResumes,
    getPreviewData,
    getThemeForTemplate,
    getTemplateName,
    getThemeKey,
    getStyleForTemplate,
    getSampleResumeData,
  }
})
