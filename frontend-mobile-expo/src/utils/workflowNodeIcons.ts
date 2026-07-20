export type WorkflowNodeIconKey =
  | 'pencil' | 'zap' | 'bot' | 'monitor' | 'book-open' | 'globe' | 'code'
  | 'git-branch' | 'refresh-cw' | 'layers'

export const WORKFLOW_NODE_COLORS: Record<string, string> = {
  edit: '#3B82F6',
  optimize: '#A855F7',
  custom: '#6366F1',
  llm: '#64748B',
  kb: '#06B6D4',
  http: '#F97316',
  code: '#F43F5E',
  condition: '#8B5CF6',
  loop: '#EC4899',
  aggregate: '#14B8A6',
  input: '#10B981',
  output: '#F43F5E',
  default: '#64748B',
}

const BY_TEMPLATE: Record<string, WorkflowNodeIconKey> = {
  edit: 'pencil', optimize: 'zap', custom: 'bot', llm: 'monitor', kb: 'book-open',
  http: 'globe', code: 'code', condition: 'git-branch', loop: 'refresh-cw', aggregate: 'layers',
}

export function getWorkflowNodeIconKey(node: { type?: string; id?: string; templateId?: string }): WorkflowNodeIconKey {
  const tid = node.templateId || node.id?.split('_')[0]
  if (tid && BY_TEMPLATE[tid]) return BY_TEMPLATE[tid]
  if (node.type === 'input') return 'monitor'
  if (node.type === 'output') return 'layers'
  return 'bot'
}

export function getWorkflowNodeColor(node: { type?: string; id?: string; templateId?: string }): string {
  const tid = node.templateId || node.id?.split('_')[0]
  if (tid && WORKFLOW_NODE_COLORS[tid]) return WORKFLOW_NODE_COLORS[tid]
  if (node.type === 'input') return WORKFLOW_NODE_COLORS.input
  if (node.type === 'output') return WORKFLOW_NODE_COLORS.output
  return WORKFLOW_NODE_COLORS.default
}
