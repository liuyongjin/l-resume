export interface ResumeBasicInfo {
  name: string
  avatar: string
  showAvatar?: boolean
  position: string
  phone: string
  email: string
  city: string
  gender: string
  age: string
  workExperience: string
  ethnicity: string
  github: string
  homepage: string
  currentStatus: string
  nativePlace: string
}

export interface ResumeData {
  basicInfo: ResumeBasicInfo
  education: Array<{ id: string; school: string; major: string; degree: string; startDate: string; endDate: string; description: string }>
  workExperience: Array<{ id: string; company: string; position: string; startDate: string; endDate: string; description: string[] }>
  projectExperience: Array<{ id: string; name: string; role: string; startDate: string; endDate: string; description: string[] }>
  professionalSummary: string
  openSourceProject: Array<{ id: string; name: string; url: string; description: string }>
  github: Array<{ id: string; repo: string; stars: string; description: string }>
  skills: Array<{ id: string; category: string; items: string[] }>
  certificates: Array<{ id: string; name: string; issuer: string; date: string }>
  otherTags?: string[]
  githubDesc?: string
}

export interface ResumeStyle {
  theme: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  margin: number
  layout: { mainSection: string[]; sidebar: string[] }
}

export interface Resume {
  id: number
  title: string
  createdAt?: string
  updatedAt: string
  data: ResumeData
  style: ResumeStyle
  templateId?: string
  source?: string
}

export interface ResumeListResponse {
  items: Resume[]
  total: number
  page: number
  limit: number
}

export interface TemplateItem {
  id: string
  name: string
  description: string | null
  config: Record<string, unknown>
}

export interface WorkflowNode {
  id: string
  type: string
  category?: string
  label: string
  agentType?: string
  templateId?: string
  config?: Record<string, unknown>
  position?: { x: number; y: number }
}

export interface Workflow {
  id: number
  name: string
  description?: string
  nodes: WorkflowNode[]
  connections: Array<{ id: string; source: string; target: string }>
  status?: string
}

export interface AiOptimizeResult {
  score?: number
  suggestions?: Array<{ id: string; section: string; before: string; after: string; applied?: boolean }>
  optimizedData?: ResumeData
}
