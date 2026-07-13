import type { ResumeData, ResumeStyle } from '@/api/types'

export function emptyResumeData(): ResumeData {
  return {
    basicInfo: {
      name: '', avatar: '', showAvatar: true, position: '', phone: '', email: '',
      city: '', gender: '', age: '', workExperience: '', ethnicity: '', github: '',
      homepage: '', currentStatus: '', nativePlace: '',
    },
    education: [],
    workExperience: [],
    projectExperience: [],
    professionalSummary: '',
    openSourceProject: [],
    github: [],
    skills: [{ id: 'skill1', category: '技能', items: [] }],
    certificates: [],
    otherTags: [],
    githubDesc: '',
  }
}

export function defaultResumeStyle(): ResumeStyle {
  return {
    theme: '#7C3AED',
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'system-ui',
    margin: 28,
    layout: {
      mainSection: ['professionalSummary', 'workExperience', 'projectExperience', 'education'],
      sidebar: ['skills', 'certificates'],
    },
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

  const raw = data as Partial<ResumeData>
  const base = emptyResumeData()

  if (raw.basicInfo && typeof raw.basicInfo === 'object') {
    return {
      ...base,
      ...raw,
      basicInfo: { ...base.basicInfo, ...raw.basicInfo },
      education: raw.education ?? base.education,
      workExperience: raw.workExperience ?? base.workExperience,
      projectExperience: raw.projectExperience ?? base.projectExperience,
      skills: raw.skills?.length ? raw.skills : base.skills,
    }
  }

  return { ...base, ...(raw as ResumeData) }
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getResumeDisplayName(data: ResumeData): string {
  return data.basicInfo?.name || data.basicInfo?.position || '未命名'
}
