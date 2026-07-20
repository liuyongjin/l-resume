/**
 * 简历组件Schema体系
 * 
 * 核心理念：每个简历模块（基本信息、工作经历等）都是一个独立组件，
 * 每个组件有自己的Schema定义（字段、类型、默认值），
 * 不同模板通过声明自己需要的组件列表来自由组合。
 */

// ==================== 字段Schema ====================

export type FieldType = 'text' | 'textarea' | 'tags' | 'select' | 'number' | 'color'

export interface FieldSchema {
  /** 数据字段key */
  key: string
  /** 显示标签 */
  label: string
  /** 字段类型 */
  type: FieldType
  /** 占位符 */
  placeholder?: string
  /** 是否必填 */
  required?: boolean
  /** 栅格跨度 (1-4)，默认1 */
  span?: number
  /** select类型的选项 */
  options?: { label: string; value: string }[]
  /** 提示文本 */
  hint?: string
}

// ==================== 组件Schema ====================

export type ComponentCategory = 'header' | 'content' | 'sidebar' | 'extra'

export interface ComponentSchema {
  /** 组件唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 图标 */
  icon: string
  /** 布局分类 */
  category: ComponentCategory
  /** 可编辑字段列表 */
  fields: FieldSchema[]
  /** 是否支持多条（如工作经历、教育背景可多条） */
  multiple?: boolean
  /** 多条时的每项标签 */
  itemLabel?: string
  /** 单条默认值 */
  defaultItem?: Record<string, any>
  /** 组件描述 */
  description?: string
}

// ==================== 模板Schema ====================

export interface TemplateSchema {
  /** 模板ID（与ThemeConfig对应） */
  id: string
  /** 模板名称 */
  name: string
  /** 模板使用的组件ID列表（按顺序） */
  components: string[]
  /** 布局预设 */
  layoutPreset: 'classic' | 'modern' | 'creative' | 'data' | 'developer'
  /** 该模板特有的额外组件ID */
  extraComponents?: string[]
  /** 模板描述 */
  description?: string
  /** 默认隐藏的预览区块 ID */
  defaultHiddenSections?: string[]
}

// ==================== 组件数据 ====================

/** 单条项的数据（如工作经历的一条） */
export interface ComponentItem {
  id: number | string
  [key: string]: any
}

/** 组件当前的数据 */
export interface ComponentData {
  /** 单值数据（如summary是字符串） */
  value?: any
  /** 多值数据（如experience是数组） */
  items?: ComponentItem[]
}