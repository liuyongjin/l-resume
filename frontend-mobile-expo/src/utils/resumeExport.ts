import type { Resume, ResumeData } from '@/api/types'
import { getResumeDisplayName } from './resumeTransform'

/** Build plain-text resume content for Share / clipboard export (mobile MVP). */
export function buildResumeShareText(resume: Resume, brand = '简流'): string {
  const data = resume.data
  const lines: string[] = [
    resume.title || getResumeDisplayName(data),
    '—',
    formatHeader(data),
  ]

  if (data.professionalSummary?.trim()) {
    lines.push('', '【自我介绍】', data.professionalSummary.trim())
  }

  if (data.workExperience?.length) {
    lines.push('', '【工作经历】')
    for (const w of data.workExperience) {
      lines.push(`${w.company} · ${w.position}（${w.startDate || '?'} - ${w.endDate || '?'}）`)
      for (const d of w.description ?? []) {
        if (d.trim()) lines.push(`  • ${d.trim()}`)
      }
    }
  }

  if (data.projectExperience?.length) {
    lines.push('', '【项目经验】')
    for (const p of data.projectExperience) {
      lines.push(`${p.name} · ${p.role}（${p.startDate || '?'} - ${p.endDate || '?'}）`)
      for (const d of p.description ?? []) {
        if (d.trim()) lines.push(`  • ${d.trim()}`)
      }
    }
  }

  if (data.education?.length) {
    lines.push('', '【教育背景】')
    for (const e of data.education) {
      lines.push(`${e.school} · ${e.degree} · ${e.major}`)
      if (e.description?.trim()) lines.push(`  ${e.description.trim()}`)
    }
  }

  if (data.skills?.some((s) => s.items.length)) {
    lines.push('', '【专业技能】')
    for (const s of data.skills) {
      if (s.items.length) lines.push(`${s.category}: ${s.items.join(' · ')}`)
    }
  }

  lines.push('', `模板: ${resume.templateId ?? 'default'} · ${brand}`)
  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n')
}

function formatHeader(data: ResumeData): string {
  const name = getResumeDisplayName(data)
  const bits = [name]
  if (data.basicInfo.position) bits.push(data.basicInfo.position)
  const contact = [data.basicInfo.phone, data.basicInfo.email, data.basicInfo.city].filter(Boolean)
  if (contact.length) bits.push(contact.join(' · '))
  return bits.join('\n')
}
