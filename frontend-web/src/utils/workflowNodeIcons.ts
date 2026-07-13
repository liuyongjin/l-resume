export type WorkflowNodeIconKey =
  | 'pencil'
  | 'zap'
  | 'bot'
  | 'monitor'
  | 'book-open'
  | 'globe'
  | 'code'
  | 'git-branch'
  | 'refresh-cw'
  | 'layers'

/** Tailwind classes must live in source — API `node.color` strings are purged at build time */
export const WORKFLOW_NODE_COLOR_CLASSES = {
  edit: 'bg-gradient-to-br from-blue-500 to-blue-600',
  optimize: 'bg-gradient-to-br from-purple-500 to-purple-600',
  custom: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  llm: 'bg-gradient-to-br from-slate-500 to-slate-600',
  kb: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  http: 'bg-gradient-to-br from-orange-500 to-orange-600',
  code: 'bg-gradient-to-br from-rose-500 to-rose-600',
  condition: 'bg-gradient-to-br from-violet-500 to-violet-600',
  loop: 'bg-gradient-to-br from-pink-500 to-pink-600',
  aggregate: 'bg-gradient-to-br from-teal-500 to-teal-600',
  input: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  output: 'bg-gradient-to-br from-rose-500 to-rose-600',
  default: 'bg-gradient-to-br from-slate-500 to-slate-600',
} as const

const BY_TEMPLATE_ID: Record<string, WorkflowNodeIconKey> = {
  edit: 'pencil',
  optimize: 'zap',
  custom: 'bot',
  llm: 'monitor',
  kb: 'book-open',
  http: 'globe',
  code: 'code',
  condition: 'git-branch',
  loop: 'refresh-cw',
  aggregate: 'layers',
}

const BY_TYPE: Record<string, WorkflowNodeIconKey> = {
  editor: 'pencil',
  optimizer: 'zap',
  custom: 'bot',
  llm: 'monitor',
  kb: 'book-open',
  http: 'globe',
  code: 'code',
  condition: 'git-branch',
  loop: 'refresh-cw',
  aggregate: 'layers',
  input: 'monitor',
  output: 'layers',
}

export function getWorkflowNodeIconKey(node: {
  type?: string
  id?: string
  templateId?: string
}): WorkflowNodeIconKey {
  const templateId = node.templateId || node.id?.split('_')[0]
  if (templateId && BY_TEMPLATE_ID[templateId]) return BY_TEMPLATE_ID[templateId]
  if (node.type && BY_TYPE[node.type]) return BY_TYPE[node.type]
  return 'bot'
}

export function getWorkflowNodeColorClass(node: {
  type?: string
  id?: string
  templateId?: string
  color?: string
}): string {
  const templateId = node.templateId || node.id?.split('_')[0]
  if (templateId && templateId in WORKFLOW_NODE_COLOR_CLASSES) {
    return WORKFLOW_NODE_COLOR_CLASSES[templateId as keyof typeof WORKFLOW_NODE_COLOR_CLASSES]
  }
  if (node.type === 'input') return WORKFLOW_NODE_COLOR_CLASSES.input
  if (node.type === 'output') return WORKFLOW_NODE_COLOR_CLASSES.output
  if (node.type && node.type in WORKFLOW_NODE_COLOR_CLASSES) {
    return WORKFLOW_NODE_COLOR_CLASSES[node.type as keyof typeof WORKFLOW_NODE_COLOR_CLASSES]
  }
  return WORKFLOW_NODE_COLOR_CLASSES.default
}
