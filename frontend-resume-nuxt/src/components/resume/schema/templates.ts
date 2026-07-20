/**
 * 模板 Schema 注册表 — 每个模板声明 layoutPreset + 组件组合
 * 供 AI 生成、后端 config、前端渲染统一引用
 */
import type { TemplateSchema } from './types'
import type { LayoutPresetId } from './layoutPresets'
import { STORE_TO_PREVIEW } from '~/utils/resumeEditSections'

export interface TemplateSchemaEntry extends TemplateSchema {
  themeKey: string
  catalogId: string
  primaryColor: string
  tag: string
}

export const templateSchemas: Record<string, TemplateSchemaEntry> = {
  frontendEngineer: {
    id: 'frontendEngineer',
    catalogId: '1',
    themeKey: 'frontendEngineer',
    name: '高级前端工程师',
    description: '适合技术岗位的极简风格，突出技术栈和项目经验',
    layoutPreset: 'classic',
    primaryColor: '#2563EB',
    tag: '推荐',
    components: ['basicInfo', 'summary', 'education', 'projects', 'experience', 'skills', 'other'],
    defaultHiddenSections: ['other']
  },
  modern: {
    id: 'modern',
    catalogId: '2',
    themeKey: 'modern',
    name: '应届大学生',
    description: '深色顶栏 + 标签式分区，突出实习、项目与校园经历',
    layoutPreset: 'modern',
    primaryColor: '#3B82F6',
    tag: '应届',
    components: ['basicInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certificates', 'campusActivity']
  },
  creative: {
    id: 'creative',
    catalogId: '3',
    themeKey: 'creative',
    name: '创意设计师',
    description: '适合设计岗位的创意风格，突出设计思维和作品集',
    layoutPreset: 'creative',
    primaryColor: '#EC4899',
    tag: '创意',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'portfolio']
  },
  data: {
    id: 'data',
    catalogId: '4',
    themeKey: 'data',
    name: '数据分析师',
    description: '适合数据分析岗位，突出数据技能和量化成果',
    layoutPreset: 'data',
    primaryColor: '#10B981',
    tag: '数据',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'dataProjects', 'certificates']
  },
  amber: {
    id: 'amber',
    catalogId: '5',
    themeKey: 'amber',
    name: '产品经理',
    description: '深色侧栏双栏布局，突出产品规划、项目推进与业务成果',
    layoutPreset: 'modern',
    primaryColor: '#F59E0B',
    tag: '产品',
    components: ['basicInfo', 'summary', 'skills', 'experience', 'projects', 'productAchievements', 'education']
  },
  purple: {
    id: 'purple',
    catalogId: '6',
    themeKey: 'purple',
    name: '学术研究者',
    description: '适合科研岗位，突出研究成果和学术背景',
    layoutPreset: 'classic',
    primaryColor: '#8B5CF6',
    tag: '学术',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'publications']
  },
  developer: {
    id: 'developer',
    catalogId: '7',
    themeKey: 'developer',
    name: '程序开发',
    description: '清新简雅的双栏开发者简历，侧栏技能与教育，主栏经历与项目',
    layoutPreset: 'developer',
    primaryColor: '#4A9B8E',
    tag: '开发',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'openSource']
  }
}

export function getTemplateSchemaByCatalogId(catalogId: string): TemplateSchemaEntry | undefined {
  return Object.values(templateSchemas).find((t) => t.catalogId === catalogId)
}

export function getTemplateSchemaByThemeKey(themeKey: string): TemplateSchemaEntry | undefined {
  return templateSchemas[themeKey]
}

export function getThemeKeyByCatalogId(catalogId: string): string {
  return getTemplateSchemaByCatalogId(catalogId)?.themeKey || 'frontendEngineer'
}

/** 解析最终要渲染的组件顺序（含 basicInfo） */
export function resolveComponentOrder(
  themeComponents: string[],
  sectionOrder?: string[]
): string[] {
  const available = themeComponents.filter(Boolean)
  if (!sectionOrder?.length) return available
  const normalizedOrder = sectionOrder.map((id) => STORE_TO_PREVIEW[id] || id)
  const ordered = normalizedOrder.filter((id) => available.includes(id))
  const rest = available.filter((id) => !ordered.includes(id))
  return [...ordered, ...rest]
}
