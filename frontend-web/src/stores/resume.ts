import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '~/utils/api'
import { normalizeResumeData } from '~/utils/resumeTransform'

export interface ResumeData {
  basicInfo: {
    name: string; avatar: string; showAvatar?: boolean; position: string; phone: string
    email: string; city: string; gender: string; age: string
    workExperience: string; ethnicity: string; github: string
    homepage: string; currentStatus: string; nativePlace: string
  }
  education: Array<{ id: string; school: string; major: string; degree: string; startDate: string; endDate: string; description: string }>
  workExperience: Array<{ id: string; company: string; position: string; startDate: string; endDate: string; description: string[] }>
  projectExperience: Array<{ id: string; name: string; role: string; startDate: string; endDate: string; description: string[] }>
  professionalSummary: string
  openSourceProject: Array<{ id: string; name: string; url: string; description: string }>
  github: Array<{ id: string; repo: string; stars: string; description: string }>
  skills: Array<{ id: string; category: string; items: string[] }>
  certificates: Array<{ id: string; name: string; issuer: string; date: string }>
  campusActivity?: Array<{ name: string; role: string; duration: string; description: string }>
  portfolio?: Array<{ name: string; type: string; url?: string; description: string }>
  dataProjects?: Array<{ name: string; role: string; duration: string; description: string; metrics?: string; tools?: string }>
  productAchievements?: Array<{ name: string; role: string; duration: string; description: string; metrics?: string }>
  publications?: Array<{ title: string; journal: string; year: string; citations?: string; doi?: string }>
  otherTags?: string[]
  githubDesc?: string
}

export interface ResumeStyle {
  theme: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  fontWeight?: string
  fontStyle?: string
  margin: number
  letterSpacing?: number
  paperSize?: string
  layout: { mainSection: string[]; sidebar: string[] }
  /** 预览区隐藏的区块 ID（如 other、skills） */
  hiddenSections?: string[]
}

export interface Resume {
  id: number | string
  title: string
  createdAt?: string
  updatedAt: string
  data: ResumeData
  style: ResumeStyle
  templateId?: string
  source?: string // 'workflow' 表示 AI 生成
  /** 列表摘要项不含正文，不可当作详情使用 */
  isSummaryOnly?: boolean
}

function emptyResumeData(): ResumeData {
  return {
    basicInfo: { name: '', avatar: '', showAvatar: true, position: '', phone: '', email: '', city: '', gender: '', age: '', workExperience: '', ethnicity: '', github: '', homepage: '', currentStatus: '', nativePlace: '' },
    education: [],
    workExperience: [],
    projectExperience: [],
    professionalSummary: '',
    openSourceProject: [],
    github: [],
    skills: [{ id: 'skill1', category: '技能分类', items: [] }],
    certificates: [],
    campusActivity: [],
    portfolio: [],
    dataProjects: [],
    productAchievements: [],
    publications: [],
    otherTags: [],
    githubDesc: '',
  }
}

function defaultStyle(): ResumeStyle {
  return { theme: '#2563eb', fontSize: 14, lineHeight: 1.5, fontFamily: 'system-ui', margin: 28, layout: { mainSection: ['professionalSummary', 'workExperience', 'projectExperience', 'education'], sidebar: ['skills', 'certificates'] } }
}

function mapSummaryResume(r: {
  id: number
  title: string
  templateId?: string | null
  source?: string | null
  createdAt?: string
  updatedAt: string
}): Resume {
  return {
    id: r.id,
    title: r.title,
    templateId: r.templateId ?? undefined,
    source: r.source ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isSummaryOnly: true,
    data: emptyResumeData(),
    style: defaultStyle(),
  }
}

export const useResumeStore = defineStore('resume', () => {
  const resumes = ref<Resume[]>([])
  const currentResumeId = ref<string | null>(null)
  const loading = ref(false)

  const currentResume = computed(() => resumes.value.find(r => String(r.id) === String(currentResumeId.value)))

  function clearCachedData() {
    resumes.value = []
    currentResumeId.value = null
  }

  // 从后端加载简历列表（仅摘要字段，不含正文）
  async function fetchResumes() {
    loading.value = true
    try {
      const res = await api.resumes.list(1, 50)
      if (res.success && Array.isArray((res.data as { resumes?: unknown[] })?.resumes)) {
        resumes.value = (res.data as { resumes: any[] }).resumes.map(mapSummaryResume)
      } else {
        resumes.value = []
      }
    } catch (err) {
      console.error('获取简历列表失败:', err)
      resumes.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取单个简历详情（始终请求后端，不使用列表摘要缓存）
  async function fetchResume(id: number | string) {
    try {
      const res = await api.resumes.get(Number(id))
      if (res.success && (res.data as any)?.resume) {
        const r = (res.data as any).resume
        const item: Resume = {
          id: r.id,
          title: r.title,
          templateId: r.templateId,
          source: r.source,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          isSummaryOnly: false,
          data: normalizeResumeData(r.data || {}),
          style: typeof r.style === 'string' ? JSON.parse(r.style) : (r.style || defaultStyle()),
        }
        const idx = resumes.value.findIndex(x => String(x.id) === String(id))
        if (idx >= 0) {
          resumes.value[idx] = item
        } else {
          resumes.value.push(item)
        }
        return item
      }
    } catch (err) {
      console.error('获取简历失败:', err)
    }
    return null
  }

  function getResumeById(id: string) {
    const resume = resumes.value.find(r => String(r.id) === String(id))
    if (resume?.isSummaryOnly) return undefined
    return resume
  }

  function setCurrentResumeId(id: string) {
    currentResumeId.value = id
  }

  // 保存简历到后端
  async function saveResume(id: string | number) {
    const resume = getResumeById(String(id))
    if (!resume) return false
    try {
      const res = await api.resumes.update(Number(id), {
        title: resume.title,
        data: resume.data,
        style: resume.style,
        templateId: resume.templateId,
        expectedUpdatedAt: resume.updatedAt,
      })
      if (res.success && (res.data as any)?.resume?.updatedAt) {
        resume.updatedAt = (res.data as any).resume.updatedAt
      }
      return true
    } catch (err: any) {
      const code = err?.data?.error?.code ?? err?.error?.code
      if (code === 4090) {
        console.warn('简历版本冲突，请刷新后重试')
      }
      console.error('保存简历失败:', err)
      return false
    }
  }

  function updateResume(id: string, data: Partial<Resume>) {
    const index = resumes.value.findIndex(r => String(r.id) === String(id))
    if (index !== -1) {
      resumes.value[index] = { ...resumes.value[index], ...data, isSummaryOnly: false }
    }
  }

  function updateResumeData<K extends keyof ResumeData>(id: string, section: K, data: ResumeData[K]) {
    const resume = resumes.value.find(r => String(r.id) === String(id))
    if (resume) {
      resume.isSummaryOnly = false
      resume.data[section] = data
    }
  }

  function updateResumeStyle(id: string, style: Partial<ResumeStyle>) {
    const resume = resumes.value.find(r => String(r.id) === String(id))
    if (resume) {
      resume.isSummaryOnly = false
      resume.style = { ...resume.style, ...style }
    }
  }

  // 创建简历（调后端）
  async function addResume(
    title: string, 
    templateId?: string, 
    customData?: Partial<ResumeData>,
    source?: string,
    customStyle?: Partial<ResumeStyle>,
  ): Promise<Resume | null> {
    try {
      const res = await api.resumes.create({
        title,
        data: customData ? { ...emptyResumeData(), ...customData } : emptyResumeData(),
        style: customStyle ? { ...defaultStyle(), ...customStyle } : defaultStyle(),
        templateId: templateId || 'classic',
        source: source || 'manual',
      })
      if (res.success && (res.data as any)?.resume) {
        const r = (res.data as any).resume
        const item: Resume = {
          id: r.id,
          title: r.title,
          templateId: r.templateId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt || new Date().toISOString(),
          isSummaryOnly: false,
          data: normalizeResumeData(r.data || {}),
          style: typeof r.style === 'string' ? JSON.parse(r.style) : (r.style || defaultStyle()),
          source: r.source || source,
        }
        resumes.value.push(item)
        return item
      }
    } catch (err) {
      console.error('创建简历失败:', err)
    }
    return null
  }

  // 删除简历
  async function deleteResume(id: number) {
    try {
      const res = await api.resumes.delete(id)
      if (!res.success) return false
      resumes.value = resumes.value.filter(r => Number(r.id) !== id)
      if (String(currentResumeId.value) === String(id)) {
        currentResumeId.value = null
      }
      return true
    } catch (err) {
      console.error('删除简历失败:', err)
      return false
    }
  }

  async function batchDeleteResumes(ids: number[]) {
    if (!ids.length) return { success: false, deletedCount: 0 }
    try {
      const res = await api.resumes.batchDelete(ids)
      if (!res.success) return { success: false, deletedCount: 0 }
      const deletedCount = (res.data as { deletedCount?: number })?.deletedCount ?? ids.length
      const idSet = new Set(ids.map(Number))
      resumes.value = resumes.value.filter(r => !idSet.has(Number(r.id)))
      if (currentResumeId.value && idSet.has(Number(currentResumeId.value))) {
        currentResumeId.value = null
      }
      return { success: true, deletedCount }
    } catch (err) {
      console.error('批量删除简历失败:', err)
      return { success: false, deletedCount: 0 }
    }
  }

  return {
    resumes, currentResume, currentResumeId, loading,
    clearCachedData,
    fetchResumes, fetchResume, getResumeById, setCurrentResumeId,
    updateResume, updateResumeData, updateResumeStyle,
    addResume, saveResume, deleteResume, batchDeleteResumes,
    emptyResumeData, defaultStyle,
  }
})

export { emptyResumeData, defaultStyle }
