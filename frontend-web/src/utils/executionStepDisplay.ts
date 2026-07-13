export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ExecutionStepLog {
  id?: number
  stepOrder?: number
  stepKey: string
  stepName: string
  nodeId?: string | null
  stepCategory: string
  status: string
  durationMs?: number | null
  error?: string | null
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown> | null
}

export interface ExecutionFlowStep {
  id: number | string
  stepOrder: number
  stepKey: string
  stepName: string
  nodeId?: string | null
  stepCategory: string
  status: ExecutionStepStatus
  durationMs?: number | null
  error?: string | null
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown> | null
}

interface ResumeSectionField {
  key: string
  label: string
  value: string
  populated?: boolean
}

interface ResumeSectionItem {
  index: number
  fields: ResumeSectionField[]
}

interface ResumeSectionDetail {
  key: string
  label: string
  type?: string
  populated?: boolean
  fields?: ResumeSectionField[]
  items?: ResumeSectionItem[]
  itemCount?: number
  preview?: string
}

interface ResumeSectionsPayload {
  sections?: ResumeSectionDetail[]
  populatedSectionKeys?: string[]
  populatedFieldCount?: number
}

const MAX_SUMMARY_LEN = 160

const truncate = (text: string, max = MAX_SUMMARY_LEN) => {
  const trimmed = text.trim()
  if (!trimmed) return '—'
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

const pickResumeTitleFromData = (data: Record<string, unknown> | null | undefined): string => {
  if (!data) return ''
  const direct = data.resumeTitle ?? data.sourceResumeTitle ?? data.title
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const recordSummary = data.resumeRecordSummary as Record<string, unknown> | undefined
  if (typeof recordSummary?.title === 'string' && recordSummary.title.trim()) {
    return recordSummary.title.trim()
  }

  const parsedSummary = data.parsedRecordSummary as Record<string, unknown> | undefined
  if (typeof parsedSummary?.title === 'string' && parsedSummary.title.trim()) {
    return parsedSummary.title.trim()
  }

  const requestBody = data.requestBody as Record<string, unknown> | undefined
  const bodySummary = requestBody?.resumeRecordSummary as Record<string, unknown> | undefined
  if (typeof bodySummary?.title === 'string' && bodySummary.title.trim()) {
    return bodySummary.title.trim()
  }
  if (typeof requestBody?.sourceResumeTitle === 'string' && requestBody.sourceResumeTitle.trim()) {
    return requestBody.sourceResumeTitle.trim()
  }
  if (typeof requestBody?.resumeTitle === 'string' && requestBody.resumeTitle.trim()) {
    return requestBody.resumeTitle.trim()
  }

  const payload = data.payload as Record<string, unknown> | undefined
  if (typeof payload?.title === 'string' && payload.title.trim()) {
    return payload.title.trim()
  }

  const resumeSummary = data.resumeSummary as Record<string, unknown> | undefined
  if (typeof resumeSummary?.resumeTitle === 'string' && resumeSummary.resumeTitle.trim()) {
    return resumeSummary.resumeTitle.trim()
  }

  return ''
}

const withResumeTitlePrefix = (title: string, detail: string) => {
  if (!title) return detail
  if (!detail || detail === '—') return truncate(`文档: ${title}`)
  return truncate(`文档: ${title} · ${detail}`)
}

const formatRecordSummary = (summary: Record<string, unknown> | undefined) => {
  if (!summary) return ''
  const name = summary.name || summary.title
  const position = summary.position || summary.jobTitle
  const parts = [name, position].filter((item) => typeof item === 'string' && item.trim())
  if (parts.length > 0) return parts.join(' · ')
  if (Array.isArray(summary.keys) && summary.keys.length > 0) {
    return `字段: ${(summary.keys as string[]).slice(0, 4).join(', ')}`
  }
  return ''
}

const summarizeObjectKeys = (data: Record<string, unknown>) => {
  const keys = Object.keys(data)
  if (keys.length === 0) return '空对象'
  return keys.slice(0, 5).join(', ') + (keys.length > 5 ? '…' : '')
}

const getResumeSectionsPayload = (data: Record<string, unknown> | null | undefined, key: string) => {
  const payload = data?.[key] as ResumeSectionsPayload | undefined
  if (!payload?.sections?.length) return null
  return payload
}

const summarizeSectionFields = (section: ResumeSectionDetail) => {
  if (section.type === 'object' && Array.isArray(section.fields)) {
    return section.fields
      .slice(0, 4)
      .map((field) => `${field.label}: ${field.value}`)
      .join(' · ')
  }
  if (section.type === 'string' && section.preview) {
    return section.preview
  }
  if (section.type === 'array' && Array.isArray(section.items)) {
    const count = section.itemCount ?? section.items.length
    const firstItem = section.items[0]
    const firstFields = firstItem?.fields
      ?.slice(0, 2)
      .map((field) => `${field.label}: ${field.value}`)
      .join(' · ')
    return firstFields ? `${count} 条 · ${firstFields}` : `${count} 条`
  }
  if (section.preview) return section.preview
  return ''
}

const summarizeResumeSections = (payload: ResumeSectionsPayload | null, prefix = '') => {
  if (!payload?.sections?.length) return ''
  const populated = payload.sections.filter((section) => section.populated)
  if (populated.length === 0) return `${prefix}暂无有效字段`

  const parts = populated.slice(0, 3).map((section) => {
    const detail = summarizeSectionFields(section)
    return detail ? `${section.label}(${detail})` : section.label
  })

  const extraCount = populated.length - 3
  const suffix = extraCount > 0 ? ` 等 ${populated.length} 个区块` : ''
  return truncate(`${prefix}${parts.join('；')}${suffix}`)
}

const summarizeAgentResult = (summary: Record<string, unknown> | undefined) => {
  if (!summary) return ''
  const parts: string[] = []
  if (typeof summary.changesSummary === 'string' && summary.changesSummary) {
    parts.push(summary.changesSummary)
  }
  if (typeof summary.improvementSummary === 'string' && summary.improvementSummary) {
    parts.push(summary.improvementSummary)
  }
  if (typeof summary.overallScore === 'number') {
    parts.push(`评分 ${summary.overallScore}`)
  }
  if (typeof summary.versionTitle === 'string' && summary.versionTitle) {
    parts.push(`版本: ${summary.versionTitle}`)
  }
  return parts.join(' · ')
}

export const mapStepLogsToFlowSteps = (stepLogs: ExecutionStepLog[]): ExecutionFlowStep[] =>
  [...stepLogs]
    .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
    .map((log, index) => ({
      id: log.id ?? `${log.stepKey}-${index}`,
      stepOrder: log.stepOrder ?? index + 1,
      stepKey: log.stepKey,
      stepName: log.stepName,
      nodeId: log.nodeId,
      stepCategory: log.stepCategory,
      status: (log.status as ExecutionStepStatus) || 'pending',
      durationMs: log.durationMs,
      error: log.error,
      inputData: log.inputData,
      outputData: log.outputData,
    }))

export const getStepCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    system: '系统',
    api: 'API',
    agent: '智能体',
    tool: '工具',
    llm: 'LLM',
    database: '数据库',
  }
  return map[category] || category
}

export const getStepStatusLabel = (status: ExecutionStepStatus) => {
  const map: Record<ExecutionStepStatus, string> = {
    pending: '等待中',
    running: '执行中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

export const formatStepDuration = (durationMs?: number | null) => {
  if (typeof durationMs !== 'number' || durationMs < 0) return null
  if (durationMs < 1000) return `${durationMs}ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

export const summarizeStepInput = (step: ExecutionFlowStep): string => {
  const data = step.inputData
  if (!data || Object.keys(data).length === 0) return '—'

  const resumeTitle = pickResumeTitleFromData(data)

  if (step.stepKey.startsWith('template:') && step.stepKey.endsWith(':merge')) {
    const templateSections = getResumeSectionsPayload(data, 'templateScaffoldSections')
    const parsedSections = getResumeSectionsPayload(data, 'parsedResumeSections')
    const templateName = typeof data.templateName === 'string' ? data.templateName : ''
    const templatePart = summarizeResumeSections(templateSections, '模板: ')
    const parsedPart = summarizeResumeSections(parsedSections, '解析: ')
    const combined = [templateName ? `模板「${templateName}」` : '', templatePart, parsedPart]
      .filter(Boolean)
      .join(' · ')
    if (combined) return withResumeTitlePrefix(resumeTitle, combined)
  }

  const resumeSections = getResumeSectionsPayload(data, 'resumeSections')
  if (resumeSections) {
    const note = typeof data.note === 'string' ? data.note : ''
    const summary = summarizeResumeSections(resumeSections, note ? `${note} · ` : '')
    if (summary) return withResumeTitlePrefix(resumeTitle, summary)
  }

  const api = data.api as Record<string, unknown> | undefined
  if (api?.method && api?.path) {
    const body = data.requestBody as Record<string, unknown> | undefined
    const bodyTitle = pickResumeTitleFromData(body || undefined)
    const targetRole = body?.targetRole
    const rawLen = body?.rawTextLength
    const parts = [`${api.method} ${api.path}`]
    const title = resumeTitle || bodyTitle
    if (title) parts.push(`文档: ${title}`)
    if (typeof targetRole === 'string' && targetRole) parts.push(`目标: ${targetRole}`)
    if (typeof rawLen === 'number') parts.push(`原文 ${rawLen} 字`)
    return truncate(parts.join(' · '))
  }

  if (typeof data.systemPromptPreview === 'string' && data.systemPromptPreview.trim()) {
    const resumePart = summarizeResumeSections(getResumeSectionsPayload(data, 'resumeSections'))
    const promptPart = `提示词: ${data.systemPromptPreview}`
    const detail = resumePart ? `${promptPart} · 输入: ${resumePart}` : promptPart
    return withResumeTitlePrefix(resumeTitle, detail)
  }

  const resumeSummary = formatRecordSummary(data.resumeSummary as Record<string, unknown>)
  if (resumeSummary) return withResumeTitlePrefix(resumeTitle, `简历: ${resumeSummary}`)

  const parsedSummary = formatRecordSummary(data.parsedRecordSummary as Record<string, unknown>)
  if (parsedSummary) return withResumeTitlePrefix(resumeTitle, `解析: ${parsedSummary}`)

  if (typeof data.templateId === 'string' && data.templateId) {
    const theme = typeof data.themeKey === 'string' ? ` (${data.themeKey})` : ''
    return withResumeTitlePrefix(resumeTitle, `模板 ${data.templateId}${theme}`)
  }

  if (typeof data.toolType === 'string') {
    const toolSummary = summarizeResumeSections(getResumeSectionsPayload(data, 'resumeSections'))
    const detail = toolSummary ? `工具: ${data.toolType} · ${toolSummary}` : `工具: ${data.toolType}`
    return withResumeTitlePrefix(resumeTitle, detail)
  }

  if (data.payload && typeof data.payload === 'object') {
    const payload = data.payload as Record<string, unknown>
    const title = pickResumeTitleFromData(data) || (typeof payload.title === 'string' ? payload.title : '')
    if (typeof title === 'string' && title) return truncate(`保存: ${title}`)
  }

  if (typeof data.error === 'string' && data.error) {
    return truncate(data.error)
  }

  if (step.stepKey === 'execute.init') {
    const templates = Array.isArray(data.templateIds) ? data.templateIds.length : 0
    const langs = Array.isArray(data.outputLanguages) ? (data.outputLanguages as string[]).join('/') : ''
    const sourceTitle = typeof data.sourceResumeTitle === 'string' ? data.sourceResumeTitle.trim() : ''
    const parts = ['工作流', `${templates} 模板`, langs || '—']
    if (sourceTitle) parts.unshift(`文档: ${sourceTitle}`)
    return truncate(parts.join(' · '))
  }

  if (resumeTitle) return truncate(`文档: ${resumeTitle}`)

  return truncate(summarizeObjectKeys(data))
}

export const summarizeStepOutput = (step: ExecutionFlowStep): string => {
  const data = step.outputData
  if (!data || Object.keys(data).length === 0) {
    if (step.status === 'running') return '执行中…'
    return '—'
  }

  const resumeTitle = pickResumeTitleFromData(data)

  if (step.stepKey === 'api.parse_resume') {
    const parsedSections = getResumeSectionsPayload(data, 'parsedSections')
    const fallback = data.fallback === true ? '（本地回退）' : ''
    const summary = summarizeResumeSections(parsedSections, '解析到: ')
    if (summary) return withResumeTitlePrefix(resumeTitle, `${summary}${fallback}`)
  }

  if (step.stepKey.startsWith('template:') && step.stepKey.endsWith(':merge')) {
    const mergedSections = getResumeSectionsPayload(data, 'mergedSections')
    const summary = summarizeResumeSections(mergedSections, '合并后: ')
    if (summary) return withResumeTitlePrefix(resumeTitle, summary)
  }

  if (step.stepCategory === 'agent') {
    const agentSummary = summarizeAgentResult(data.agentResultSummary as Record<string, unknown>)
    const outputSections = getResumeSectionsPayload(data, 'resumeSections')
    const outputPart = summarizeResumeSections(outputSections, '输出: ')
    const detail = [agentSummary, outputPart].filter(Boolean).join(' · ')
    if (detail) return withResumeTitlePrefix(resumeTitle, detail)
    if (resumeTitle) return truncate(`文档: ${resumeTitle}`)
  }

  if (step.stepKey.startsWith('node:') && (step.inputData?.nodeType === 'input' || step.inputData?.nodeType === 'output' || data.note)) {
    const outputSections = getResumeSectionsPayload(data, 'resumeSections')
    const summary = summarizeResumeSections(outputSections)
    if (summary) return withResumeTitlePrefix(resumeTitle, summary)
  }

  if (typeof data.resumeId === 'number') {
    const title = pickResumeTitleFromData(data)
    return truncate(`简历 #${data.resumeId}${title ? ` · ${title}` : ''}`)
  }

  if (typeof data.resumeTitle === 'string' && data.resumeTitle.trim()) {
    const outputSections = getResumeSectionsPayload(data, 'resumeSections')
    const outputPart = summarizeResumeSections(outputSections)
    if (outputPart) return truncate(`${data.resumeTitle} · ${outputPart}`)
    return truncate(`文档: ${data.resumeTitle}`)
  }

  const mergedSummary = formatRecordSummary(data.mergedSummary as Record<string, unknown>)
  if (mergedSummary) return withResumeTitlePrefix(resumeTitle, `合并: ${mergedSummary}`)

  const parsedSummary = formatRecordSummary(data.parsedRecordSummary as Record<string, unknown>)
  if (parsedSummary) return withResumeTitlePrefix(resumeTitle, `解析: ${parsedSummary}`)

  const resumeSummary = formatRecordSummary(data.resumeSummary as Record<string, unknown>)
  if (resumeSummary) return withResumeTitlePrefix(resumeTitle, `简历: ${resumeSummary}`)

  const resumeSections = getResumeSectionsPayload(data, 'resumeSections')
  if (resumeSections) {
    const summary = summarizeResumeSections(resumeSections)
    if (summary) return withResumeTitlePrefix(resumeTitle, summary)
  }

  if (Array.isArray(data.savedResumes) && data.savedResumes.length > 0) {
    const titles = (data.savedResumes as Array<{ title?: string }>)
      .map((item) => item.title?.trim())
      .filter(Boolean)
    if (titles.length > 0) return truncate(`已保存: ${titles.join('、')}`)
  }

  if (typeof data.savedCount === 'number') {
    const titles = Array.isArray(data.savedResumeTitles)
      ? (data.savedResumeTitles as string[]).filter(Boolean)
      : []
    if (titles.length > 0) return truncate(`已保存 ${data.savedCount} 份: ${titles.join('、')}`)
    return truncate(`已保存 ${data.savedCount} 份`)
  }

  if (typeof data.deletedCount === 'number') {
    const savedResumes = Array.isArray(step.inputData?.savedResumes)
      ? (step.inputData!.savedResumes as Array<{ title?: string }>)
      : []
    const titles = savedResumes.map((item) => item.title?.trim()).filter(Boolean)
    if (titles.length > 0) return truncate(`已回滚 ${data.deletedCount} 份: ${titles.join('、')}`)
    return truncate(`已回滚 ${data.deletedCount} 份`)
  }

  if (typeof data.expectedStepCount === 'number') {
    return truncate(`预计 ${data.expectedStepCount} 步`)
  }

  if (data.fallback === true) {
    return truncate('使用本地解析回退')
  }

  if (typeof data.message === 'string' && data.message) {
    return withResumeTitlePrefix(resumeTitle, data.message)
  }

  if (typeof data.error === 'string' && data.error) {
    return truncate(data.error)
  }

  if (resumeTitle) return truncate(`文档: ${resumeTitle}`)

  return truncate(summarizeObjectKeys(data))
}

export const formatStepDataJson = (data: Record<string, unknown> | null | undefined) => {
  if (!data || Object.keys(data).length === 0) return '（无数据）'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
