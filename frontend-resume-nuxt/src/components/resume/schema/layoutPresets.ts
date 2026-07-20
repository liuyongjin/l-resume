/**
 * 布局预设 — 定义各模板的基础排版结构（与业务组件解耦）
 */
export type LayoutPresetId = 'classic' | 'modern' | 'creative' | 'data' | 'developer'

export interface LayoutPreset {
  id: LayoutPresetId
  /** 头部展示方式 */
  header: 'avatar' | 'creative-banner' | 'tech-header'
  /** 整体结构 */
  structure: 'single-column' | 'two-column' | 'stats-column' | 'two-column-dark'
  /** 双栏布局时默认放侧栏的组件 ID */
  defaultSidebar?: string[]
  /** 区块标题样式 */
  sectionStyle: 'default' | 'accent-bar' | 'centered' | 'mono'
  /** 是否显示数据统计条（数据分析师） */
  showStatsBar?: boolean
}

export const layoutPresets: Record<LayoutPresetId, LayoutPreset> = {
  classic: {
    id: 'classic',
    header: 'avatar',
    structure: 'single-column',
    sectionStyle: 'default'
  },
  modern: {
    id: 'modern',
    header: 'avatar',
    structure: 'two-column',
    defaultSidebar: ['summary', 'skills', 'education', 'certificates', 'campusActivity'],
    sectionStyle: 'accent-bar'
  },
  creative: {
    id: 'creative',
    header: 'creative-banner',
    structure: 'single-column',
    sectionStyle: 'centered'
  },
  data: {
    id: 'data',
    header: 'avatar',
    structure: 'stats-column',
    sectionStyle: 'default',
    showStatsBar: true
  },
  developer: {
    id: 'developer',
    header: 'tech-header',
    structure: 'two-column',
    defaultSidebar: ['skills', 'education', 'openSource'],
    sectionStyle: 'accent-bar'
  }
}

export function getLayoutPreset(id: string): LayoutPreset {
  return layoutPresets[id as LayoutPresetId] || layoutPresets.classic
}

/** 根据布局预设和组件列表，划分侧栏/主栏（保持 sectionOrder 中的相对顺序） */
export function splitComponentsByLayout(
  components: string[],
  preset: LayoutPreset
): { sidebar: string[]; main: string[] } {
  const contentIds = components.filter((id) => id !== 'basicInfo')
  if (preset.structure !== 'two-column' && preset.structure !== 'two-column-dark') {
    return { sidebar: [], main: contentIds }
  }
  const sidebarSet = new Set(preset.defaultSidebar || [])
  const sidebar = contentIds.filter((id) => sidebarSet.has(id))
  const main = contentIds.filter((id) => !sidebarSet.has(id))
  return { sidebar, main }
}
