/**
 * 组件Schema注册表
 * 
 * 定义所有可用的简历组件，每个组件有独立的字段定义。
 * 新增组件只需在此文件中添加定义即可。
 */
import type { ComponentSchema } from './types'

// ==================== 基础组件 ====================

/** 基本信息组件 */
export const basicInfoSchema: ComponentSchema = {
  id: 'basicInfo',
  name: '基本信息',
  icon: 'User',
  category: 'header',
  fields: [
    { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名', required: true, span: 1 },
    { key: 'title', label: '职位/目标', type: 'text', placeholder: '如：高级前端工程师', required: true, span: 1 },
    { key: 'avatar', label: '头像', type: 'avatar', span: 2 },
    { key: 'showAvatar', label: '显示头像', type: 'boolean', span: 1, hint: '关闭后仅显示姓名与联系方式' },
    { key: 'location', label: '所在城市', type: 'text', placeholder: '如：北京', span: 1 },
    { key: 'phone', label: '电话', type: 'text', placeholder: '手机号', span: 1 },
    { key: 'email', label: '邮箱', type: 'text', placeholder: '电子邮箱', span: 2 },
  ],
  description: '姓名、职位、联系方式等基本信息',
}

/** 个人总结组件 */
export const summarySchema: ComponentSchema = {
  id: 'summary',
  name: '个人总结',
  icon: 'Star',
  category: 'content',
  fields: [
    { key: 'summary', label: '个人总结', type: 'textarea', placeholder: '简要介绍您的背景、核心能力和职业目标（2-3句话）', required: true, span: 2, hint: '使用有力的行为动词，突出核心优势' },
  ],
  description: '个人简介和核心优势概述',
}

/** 工作经历组件 */
export const experienceSchema: ComponentSchema = {
  id: 'experience',
  name: '工作经历',
  icon: 'Briefcase',
  category: 'content',
  multiple: true,
  itemLabel: '工作经历',
  defaultItem: { company: '', position: '', duration: '', description: '', achievements: [], id: Date.now() },
  fields: [
    { key: 'company', label: '公司/组织', type: 'text', placeholder: '公司名称', required: true, span: 1 },
    { key: 'position', label: '职位', type: 'text', placeholder: '职位名称', required: true, span: 1 },
    { key: 'duration', label: '时间', type: 'text', placeholder: '如：2020-至今', span: 2 },
    { key: 'description', label: '工作描述', type: 'textarea', placeholder: '描述工作内容和职责', span: 2 },
    { key: 'achievements', label: '关键成就', type: 'tags', placeholder: '添加成就（回车确认）', span: 2, hint: '每项成就要包含量化数据' },
  ],
  description: '工作经历和实习经历',
}

/** 教育背景组件 */
export const educationSchema: ComponentSchema = {
  id: 'education',
  name: '教育背景',
  icon: 'School',
  category: 'sidebar',
  multiple: true,
  itemLabel: '教育背景',
  defaultItem: { school: '', degree: '', major: '', gpa: '', duration: '', id: Date.now() },
  fields: [
    { key: 'school', label: '学校', type: 'text', placeholder: '学校名称', required: true, span: 1 },
    { key: 'degree', label: '学历', type: 'select', placeholder: '选择学历', span: 1, options: [
      { label: '本科', value: '本科' }, { label: '硕士', value: '硕士' }, { label: '博士', value: '博士' }, { label: '大专', value: '大专' },
    ]},
    { key: 'major', label: '专业', type: 'text', placeholder: '专业名称', span: 1 },
    { key: 'gpa', label: 'GPA', type: 'text', placeholder: '如：3.8/4.0', span: 1 },
    { key: 'duration', label: '时间', type: 'text', placeholder: '如：2017-2021', span: 2 },
  ],
  description: '教育经历',
}

/** 技能组件 */
export const skillsSchema: ComponentSchema = {
  id: 'skills',
  name: '专业技能',
  icon: 'Code',
  category: 'content',
  fields: [
    { key: 'skills', label: '技能标签', type: 'tags', placeholder: '添加技能（回车确认）', required: true, span: 2, hint: '按熟练度从高到低排列' },
  ],
  description: '技术技能和专业能力',
}

/** 项目经验组件 */
export const projectsSchema: ComponentSchema = {
  id: 'projects',
  name: '项目经验',
  icon: 'Folder',
  category: 'content',
  multiple: true,
  itemLabel: '项目',
  defaultItem: { name: '', role: '', duration: '', description: '', techStackStr: '', id: Date.now() },
  fields: [
    { key: 'name', label: '项目名称', type: 'text', placeholder: '项目名称', required: true, span: 1 },
    { key: 'role', label: '担任角色', type: 'text', placeholder: '如：技术负责人', span: 1 },
    { key: 'duration', label: '项目周期', type: 'text', placeholder: '如：2022-2023', span: 2 },
    { key: 'description', label: '项目描述', type: 'textarea', placeholder: '描述项目内容、技术方案和成果', span: 2 },
    { key: 'techStackStr', label: '技术栈', type: 'text', placeholder: '逗号分隔，如：Vue3, TypeScript', span: 2 },
  ],
  description: '项目经验和成果展示',
}

// ==================== 扩展组件（特定模板使用） ====================

/** 证书/资格组件（应届生模板） */
export const certificatesSchema: ComponentSchema = {
  id: 'certificates',
  name: '证书/资格',
  icon: 'Medal',
  category: 'extra',
  multiple: true,
  itemLabel: '证书',
  defaultItem: { name: '', issuer: '', date: '', id: Date.now() },
  fields: [
    { key: 'name', label: '证书名称', type: 'text', placeholder: '如：CET-6、计算机二级', required: true, span: 1 },
    { key: 'issuer', label: '颁发机构', type: 'text', placeholder: '颁发机构', span: 1 },
    { key: 'date', label: '获得时间', type: 'text', placeholder: '如：2023.06', span: 2 },
  ],
  description: '获得的证书和资格认证',
}

/** 校园活动组件（应届生模板） */
export const campusActivitySchema: ComponentSchema = {
  id: 'campusActivity',
  name: '校园活动',
  icon: 'StarFilled',
  category: 'extra',
  multiple: true,
  itemLabel: '活动',
  defaultItem: { name: '', role: '', duration: '', description: '', id: Date.now() },
  fields: [
    { key: 'name', label: '活动/组织名称', type: 'text', placeholder: '如：学生会、志愿者协会', required: true, span: 1 },
    { key: 'role', label: '担任角色', type: 'text', placeholder: '如：学生会主席', span: 1 },
    { key: 'duration', label: '时间', type: 'text', placeholder: '如：2023-2024', span: 2 },
    { key: 'description', label: '活动描述', type: 'textarea', placeholder: '描述负责的工作和成果', span: 2 },
  ],
  description: '学生会、社团、志愿者等校园活动经历',
}

/** 设计作品集组件（创意模板） */
export const portfolioSchema: ComponentSchema = {
  id: 'portfolio',
  name: '作品集',
  icon: 'Picture',
  category: 'extra',
  multiple: true,
  itemLabel: '作品',
  defaultItem: { name: '', type: '', url: '', description: '', id: Date.now() },
  fields: [
    { key: 'name', label: '作品名称', type: 'text', placeholder: '作品名称', required: true, span: 1 },
    { key: 'type', label: '作品类型', type: 'select', placeholder: '选择类型', span: 1, options: [
      { label: 'UI设计', value: 'UI设计' }, { label: '品牌设计', value: '品牌设计' }, { label: '插画', value: '插画' }, { label: '动效', value: '动效' },
    ]},
    { key: 'url', label: '作品链接', type: 'text', placeholder: 'https://...', span: 2 },
    { key: 'description', label: '作品描述', type: 'textarea', placeholder: '描述设计思路和亮点', span: 2 },
  ],
  description: '设计作品集展示',
}

/** 数据分析项目组件（数据分析师模板） */
export const dataProjectsSchema: ComponentSchema = {
  id: 'dataProjects',
  name: '数据项目',
  icon: 'DataAnalysis',
  category: 'extra',
  multiple: true,
  itemLabel: '数据项目',
  defaultItem: { name: '', role: '', duration: '', description: '', metrics: '', tools: '', id: Date.now() },
  fields: [
    { key: 'name', label: '项目名称', type: 'text', placeholder: '项目名称', required: true, span: 1 },
    { key: 'role', label: '角色', type: 'text', placeholder: '如：数据分析师', span: 1 },
    { key: 'duration', label: '时间', type: 'text', placeholder: '如：2023', span: 2 },
    { key: 'description', label: '项目描述', type: 'textarea', placeholder: '描述分析方法、模型和业务价值', span: 2 },
    { key: 'metrics', label: '关键指标', type: 'text', placeholder: '如：准确率92%，增量收入3000万', span: 2 },
    { key: 'tools', label: '使用工具', type: 'text', placeholder: '如：Python, SQL, Tableau', span: 2 },
  ],
  description: '数据分析专项项目',
}

/** 论文发表组件（学术研究者模板） */
export const publicationsSchema: ComponentSchema = {
  id: 'publications',
  name: '论文发表',
  icon: 'Document',
  category: 'content',
  multiple: true,
  itemLabel: '论文',
  defaultItem: { title: '', journal: '', year: '', citations: '', doi: '', id: Date.now() },
  fields: [
    { key: 'title', label: '论文标题', type: 'text', placeholder: '论文标题', required: true, span: 2 },
    { key: 'journal', label: '期刊/会议', type: 'text', placeholder: '如：NeurIPS 2023', required: true, span: 1 },
    { key: 'year', label: '发表年份', type: 'text', placeholder: '如：2023', span: 1 },
    { key: 'citations', label: '引用数', type: 'text', placeholder: '如：50+', span: 1 },
    { key: 'doi', label: 'DOI/链接', type: 'text', placeholder: 'DOI或论文链接', span: 1 },
  ],
  description: '学术论文发表记录',
}

/** 开源贡献组件（程序开发模板） */
export const openSourceSchema: ComponentSchema = {
  id: 'openSource',
  name: '开源贡献',
  icon: 'Connection',
  category: 'content',
  multiple: true,
  itemLabel: '开源项目',
  defaultItem: { name: '', repo: '', stars: '', description: '', role: '', id: Date.now() },
  fields: [
    { key: 'name', label: '项目名称', type: 'text', placeholder: '项目名称', required: true, span: 1 },
    { key: 'repo', label: '仓库地址', type: 'text', placeholder: '如：github.com/user/repo', span: 1 },
    { key: 'stars', label: 'Stars', type: 'text', placeholder: '如：2000+', span: 1 },
    { key: 'role', label: '角色', type: 'select', placeholder: '选择角色', span: 1, options: [
      { label: '作者', value: '作者' }, { label: '核心贡献者', value: '核心贡献者' }, { label: '贡献者', value: '贡献者' },
    ]},
    { key: 'description', label: '项目描述', type: 'textarea', placeholder: '描述项目功能和技术亮点', span: 2 },
  ],
  description: '开源项目贡献记录',
}

/** 产品成果组件（产品经理模板） */
export const productAchievementsSchema: ComponentSchema = {
  id: 'productAchievements',
  name: '产品成果',
  icon: 'TrendCharts',
  category: 'content',
  multiple: true,
  itemLabel: '产品',
  defaultItem: { name: '', role: '', duration: '', description: '', metrics: '', id: Date.now() },
  fields: [
    { key: 'name', label: '产品名称', type: 'text', placeholder: '产品名称', required: true, span: 1 },
    { key: 'role', label: '担任角色', type: 'text', placeholder: '如：产品负责人', span: 1 },
    { key: 'duration', label: '时间', type: 'text', placeholder: '如：2021-2022', span: 2 },
    { key: 'description', label: '产品描述', type: 'textarea', placeholder: '描述产品定位、功能和用户规模', span: 2 },
    { key: 'metrics', label: '核心指标', type: 'textarea', placeholder: '如：DAU 100万+，转化率提升25%', span: 2 },
  ],
  description: '负责的产品线和业务成果',
}

// ==================== 所有组件注册表 ====================

export const componentRegistry: Record<string, ComponentSchema> = {
  basicInfo: basicInfoSchema,
  summary: summarySchema,
  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  projects: projectsSchema,
  certificates: certificatesSchema,
  campusActivity: campusActivitySchema,
  portfolio: portfolioSchema,
  dataProjects: dataProjectsSchema,
  publications: publicationsSchema,
  openSource: openSourceSchema,
  productAchievements: productAchievementsSchema,
}

/** 通过ID获取组件Schema */
export function getComponentSchema(id: string): ComponentSchema | undefined {
  return componentRegistry[id]
}

/** 获取所有已注册的组件ID */
export function getAllComponentIds(): string[] {
  return Object.keys(componentRegistry)
}