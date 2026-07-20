import type { Component } from 'vue'
import type { TemplateConfigJson } from '~/stores/template'
import { getTemplateThemeIcon } from '~/utils/iconMaps'

export type TemplateFilter = 'all' | 'simple' | 'professional' | 'creative' | 'developer'

export interface TemplateListItem {
  id: string
  name: string
  subtitle: string
  description: string
  gradient: string
  primaryColor: string
  tag: string
  tagColor: string
  tagTextColor: string
  features: string[]
  icon: Component
  themeKey: string
  layoutPreset: string
  config: TemplateConfigJson
}

const themeMeta: Record<string, {
  tag: string
  tagColor: string
  subtitle: string
  features: string[]
  filterGroup: Exclude<TemplateFilter, 'all'>
}> = {
  frontendEngineer: { tag: '推荐', tagColor: '#2563EB', subtitle: '极简专业简历', features: ['极简', '专业', '技术岗'], filterGroup: 'simple' },
  modern: { tag: '应届', tagColor: '#3B82F6', subtitle: '顶栏标签式应届生简历', features: ['应届', '实习', '校园'], filterGroup: 'professional' },
  creative: { tag: '创意', tagColor: '#EC4899', subtitle: '创意个性简历', features: ['创意', '设计', '艺术岗'], filterGroup: 'creative' },
  data: { tag: '数据', tagColor: '#10B981', subtitle: '数据驱动型简历', features: ['数据', '分析', '量化'], filterGroup: 'professional' },
  amber: { tag: '产品', tagColor: '#F59E0B', subtitle: '侧栏双栏产品经理简历', features: ['产品', '双栏', 'PM'], filterGroup: 'professional' },
  purple: { tag: '学术', tagColor: '#8B5CF6', subtitle: '学术风格简历', features: ['学术', '研究', '论文'], filterGroup: 'creative' },
  developer: { tag: '开发', tagColor: '#4A9B8E', subtitle: '清新简雅开发者简历', features: ['双栏', '技能分组', '开源'], filterGroup: 'developer' }
}

/** 高级前端工程师以 config 主题色为准；其余模板以卡片标签色为准 */
export function resolveTemplateBrandColor(themeKey: string, configPrimaryColor?: string): string {
  if (themeKey === 'frontendEngineer') {
    return configPrimaryColor || themeMeta.frontendEngineer.tagColor
  }
  return themeMeta[themeKey]?.tagColor || configPrimaryColor || themeMeta.modern.tagColor
}

export function mapApiTemplateToListItem(t: {
  id: string
  name: string
  description: string | null
  config: TemplateConfigJson
}): TemplateListItem {
  const themeKey = t.config.themeKey || t.id
  const meta = themeMeta[themeKey] || themeMeta.modern
  const brandColor = resolveTemplateBrandColor(themeKey, t.config.primaryColor)
  const tagColor = themeKey === 'frontendEngineer' ? brandColor : meta.tagColor

  return {
    id: t.id,
    name: t.name,
    subtitle: meta.subtitle,
    description: t.description || '',
    gradient: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}CC 100%)`,
    primaryColor: brandColor,
    tag: meta.tag,
    tagColor,
    tagTextColor: '#fff',
    features: meta.features,
    icon: getTemplateThemeIcon(themeKey) as Component,
    themeKey,
    layoutPreset: t.config.layoutPreset || 'classic',
    config: t.config
  }
}

const filterMap: Record<Exclude<TemplateFilter, 'all'>, string[]> = {
  simple: ['frontendEngineer'],
  professional: ['modern', 'data', 'amber'],
  creative: ['creative', 'purple'],
  developer: ['developer']
}

export function filterTemplates(catalog: TemplateListItem[], filter: TemplateFilter) {
  if (filter === 'all') return catalog
  const keys = filterMap[filter] || []
  return catalog.filter((t) => keys.includes(t.themeKey))
}
