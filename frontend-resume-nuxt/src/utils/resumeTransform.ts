import type { ResumeData } from '~/stores/resume'
import { emptyResumeData } from '~/stores/resume'

export interface PreviewResumeData {
  name: string
  title: string
  phone: string
  email: string
  location: string
  avatar?: string
  showAvatar?: boolean
  summary: string
  experiences: Array<{
    company: string
    position: string
    duration: string
    description: string
    achievements?: string[]
  }>
  education: Array<{
    school: string
    degree: string
    major: string
    gpa?: string
    duration: string
    description?: string
  }>
  skills: string[]
  skillGroups?: Array<{ category?: string; items: string[] }>
  projects: Array<{
    name: string
    role: string
    duration: string
    description: string
    techStack?: string[]
    highlights?: string[]
  }>
  certificates?: Array<{ name: string; issuer?: string; date?: string }>
  campusActivity?: Array<{ name: string; role: string; duration: string; description: string }>
  portfolio?: Array<{ name: string; type: string; url?: string; description: string }>
  dataProjects?: Array<{ name: string; role: string; duration: string; description: string; metrics?: string; tools?: string }>
  productAchievements?: Array<{ name: string; role: string; duration: string; description: string; metrics?: string }>
  publications?: Array<{ title: string; journal: string; year: string; citations?: string; doi?: string }>
  openSource?: Array<{ name: string; repo: string; stars?: string; description: string; role: string }>
  github?: string
  homepage?: string
  githubDesc?: string
  otherTags?: string[]
  workExperience?: string
  currentStatus?: string
}

/** 将存储的头像路径解析为可访问 URL */
export function resolveAvatarUrl(avatar?: string): string {
  if (!avatar) return ''
  const trimmed = avatar.trim()
  if (!trimmed) return ''
  if (/^(https?:|data:|\/)/.test(trimmed)) return trimmed
  return `/api/uploads/${trimmed.replace(/^\/+/, '')}`
}

export function emptyPreviewData(): PreviewResumeData {
  return {
    name: '',
    title: '',
    phone: '',
    email: '',
    location: '',
    showAvatar: true,
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    projects: []
  }
}

export function normalizeResumeData(data: unknown): ResumeData {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return emptyResumeData()
    }
  }
  if (!data || typeof data !== 'object') return emptyResumeData()

  const raw = data as Record<string, unknown>
  const base = emptyResumeData()

  // 已是标准 ResumeData 格式
  if (raw.basicInfo && typeof raw.basicInfo === 'object') {
    const info = raw.basicInfo as Record<string, string>
    return {
      ...base,
      ...(raw as Partial<ResumeData>),
      basicInfo: {
        ...base.basicInfo,
        ...info,
        position: info.position || info.title || base.basicInfo.position,
        city: info.city || info.location || base.basicInfo.city,
        showAvatar: info.showAvatar === undefined || info.showAvatar === null
          ? true
          : Boolean(info.showAvatar),
      },
      professionalSummary: String(raw.professionalSummary || raw.summary || ''),
      workExperience: normalizeWorkExperience(raw.workExperience || raw.experiences),
      projectExperience: normalizeProjectExperience(raw.projectExperience || raw.projects),
      skills: normalizeSkills(raw.skills),
      education: Array.isArray(raw.education) ? raw.education as ResumeData['education'] : [],
      certificates: Array.isArray(raw.certificates) ? raw.certificates as ResumeData['certificates'] : [],
      openSourceProject: Array.isArray(raw.openSourceProject)
        ? raw.openSourceProject as ResumeData['openSourceProject']
        : [],
      github: Array.isArray(raw.github) ? raw.github as ResumeData['github'] : [],
      ...(pickExtraFields(raw)),
    }
  }

  return { ...base, ...(raw as Partial<ResumeData>) }
}

function normalizeWorkExperience(input: unknown): ResumeData['workExperience'] {
  if (!Array.isArray(input)) return []
  return input.map((item, i) => {
    const w = item as Record<string, unknown>
    const desc = w.description
    return {
      id: String(w.id || i + 1),
      company: String(w.company || ''),
      position: String(w.position || ''),
      startDate: String(w.startDate || ''),
      endDate: String(w.endDate || ''),
      description: Array.isArray(desc)
        ? desc.map(String)
        : desc ? String(desc).split('\n').filter(Boolean) : [],
    }
  })
}

function normalizeProjectExperience(input: unknown): ResumeData['projectExperience'] {
  if (!Array.isArray(input)) return []
  return input.map((item, i) => {
    const p = item as Record<string, unknown>
    const desc = p.description
    return {
      id: String(p.id || i + 1),
      name: String(p.name || ''),
      role: String(p.role || ''),
      startDate: String(p.startDate || ''),
      endDate: String(p.endDate || ''),
      description: Array.isArray(desc)
        ? desc.map(String)
        : desc ? String(desc).split('\n').filter(Boolean) : [],
    }
  })
}

function normalizeSkills(input: unknown): ResumeData['skills'] {
  if (Array.isArray(input) && input.length > 0) {
    if (typeof input[0] === 'string') {
      return [{ id: 'skill1', category: '专业技能', items: input as string[] }]
    }
    return input as ResumeData['skills']
  }
  return [{ id: 'skill1', category: '技能分类', items: [] }]
}

function pickExtraFields(raw: Record<string, unknown>) {
  const extra: Record<string, unknown> = {}
  for (const key of ['campusActivity', 'portfolio', 'dataProjects', 'productAchievements', 'publications', 'otherTags', 'githubDesc']) {
    if (Array.isArray(raw[key])) extra[key] = raw[key]
  }
  return extra
}

/** 将上传/工作流/翻译等多源简历内容统一为数据库 ResumeData schema */
export function agentOutputToResumeData(content: unknown): ResumeData {
  if (!content || typeof content !== 'object') return emptyResumeData()

  const raw = content as Record<string, unknown>

  // 多智能体 personalInfo 格式
  if (raw.personalInfo && typeof raw.personalInfo === 'object') {
    const pi = raw.personalInfo as Record<string, unknown>
    const contact = (pi.contact || {}) as Record<string, string>
    return normalizeResumeData({
      basicInfo: {
        name: String(pi.name || ''),
        position: String(pi.title || ''),
        phone: contact.phone || '',
        email: contact.email || '',
        city: contact.location || '',
      },
      professionalSummary: String(raw.summary || pi.summary || ''),
      workExperience: (Array.isArray(raw.experience) ? raw.experience : []).map((exp: any, i: number) => ({
        id: String(exp.id || i + 1),
        company: exp.company || '',
        position: exp.position || exp.title || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || exp.duration || '',
        description: Array.isArray(exp.highlights)
          ? exp.highlights
          : exp.description
            ? [String(exp.description)]
            : [],
      })),
      education: (Array.isArray(raw.education) ? raw.education : []).map((e: any, i: number) => ({
        id: String(e.id || i + 1),
        school: e.school || '',
        major: e.major || '',
        degree: e.degree || '',
        startDate: e.startDate || '',
        endDate: e.endDate || e.duration || '',
        description: e.description || '',
      })),
      projectExperience: (Array.isArray(raw.projects) ? raw.projects : []).map((p: any, i: number) => ({
        id: String(p.id || i + 1),
        name: p.name || '',
        role: p.role || '',
        startDate: p.startDate || '',
        endDate: p.endDate || p.duration || '',
        description: p.description ? [String(p.description)] : [],
      })),
      skills: normalizeSkills(raw.skills),
    })
  }

  // 含 rawText 的上传结果：保留 rawText，由解析/预览逻辑拆分到各字段
  if (typeof raw.rawText === 'string' && raw.rawText.trim()) {
    return normalizeResumeData(raw)
  }

  return normalizeResumeData(raw)
}

/** 将 AI 返回的简历 patch 合并进当前编辑态（保留未修改字段） */
export function mergeResumeDataPatch(base: ResumeData, patch: unknown): ResumeData {
  if (!patch || typeof patch !== 'object') return base
  const p = patch as Record<string, unknown>
  return normalizeResumeData({
    ...base,
    ...p,
    basicInfo: {
      ...base.basicInfo,
      ...((p.basicInfo as Record<string, unknown>) || {}),
    },
  })
}

export function storeDataToPreviewData(data: ResumeData | null | undefined): PreviewResumeData {
  const normalized = normalizeResumeData(data)
  if (!data && !normalized.basicInfo?.name) return emptyPreviewData()

  const extra = normalized as ResumeData & Record<string, unknown>

  return {
    name: normalized.basicInfo?.name || '',
    title: normalized.basicInfo?.position || '',
    phone: normalized.basicInfo?.phone || '',
    email: normalized.basicInfo?.email || '',
    location: normalized.basicInfo?.city || '',
    avatar: resolveAvatarUrl(normalized.basicInfo?.avatar),
    showAvatar: normalized.basicInfo?.showAvatar === undefined
      ? true
      : Boolean(normalized.basicInfo?.showAvatar),
    summary: normalized.professionalSummary || '',
    experiences: (normalized.workExperience || []).map((w) => {
      const bullets = Array.isArray(w.description)
        ? w.description.filter(Boolean)
        : String(w.description || '').split('\n').map((s) => s.trim()).filter(Boolean)
      return {
        company: w.company,
        position: w.position,
        duration: [w.startDate, w.endDate].filter(Boolean).join(' - '),
        description: bullets[0] || '',
        achievements: bullets,
      }
    }),
    education: (normalized.education || []).map((e) => ({
      school: e.school,
      degree: e.degree,
      major: e.major,
      duration: [e.startDate, e.endDate].filter(Boolean).join(' - '),
      gpa: '',
      description: e.description || '',
    })),
    skills: (normalized.skills || []).flatMap((s) => s.items || []),
    skillGroups: (normalized.skills || []).map((s) => ({
      category: s.category || '',
      items: s.items || [],
    })),
    projects: (normalized.projectExperience || []).map((p) => {
      const bullets = Array.isArray(p.description)
        ? p.description.filter(Boolean)
        : String(p.description || '').split('\n').map((s) => s.trim()).filter(Boolean)
      return {
        name: p.name,
        role: p.role,
        duration: [p.startDate, p.endDate].filter(Boolean).join(' - '),
        description: bullets.join('\n'),
        highlights: bullets,
        techStack: [],
      }
    }),
    certificates: (normalized.certificates || []).map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date
    })),
    campusActivity: Array.isArray(extra.campusActivity) ? extra.campusActivity as PreviewResumeData['campusActivity'] : [],
    portfolio: Array.isArray(extra.portfolio) ? extra.portfolio as PreviewResumeData['portfolio'] : [],
    dataProjects: Array.isArray(extra.dataProjects) ? extra.dataProjects as PreviewResumeData['dataProjects'] : [],
    productAchievements: Array.isArray(extra.productAchievements) ? extra.productAchievements as PreviewResumeData['productAchievements'] : [],
    publications: Array.isArray(extra.publications) ? extra.publications as PreviewResumeData['publications'] : [],
    openSource: (normalized.openSourceProject || []).map((o) => ({
      name: o.name,
      repo: o.url || '',
      stars: (o as Record<string, unknown>).stars
      ? String((o as Record<string, unknown>).stars)
      : undefined,
      description: o.description,
      role: String((o as Record<string, unknown>).role || '贡献者'),
    })),
    github: normalized.basicInfo?.github || '',
    homepage: normalized.basicInfo?.homepage || '',
    githubDesc: String((extra as Record<string, unknown>).githubDesc || ''),
    workExperience: normalized.basicInfo?.workExperience || '',
    currentStatus: normalized.basicInfo?.currentStatus || '',
    otherTags: Array.isArray((extra as Record<string, unknown>).otherTags)
      ? (extra as Record<string, unknown>).otherTags as string[]
      : [],
  }
}
