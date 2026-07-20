/** 工作流节点元数据 — 端口、配置字段、类型判断（对齐 Flowise / Dify 工作流模式） */

export type WorkflowPortId = 'default' | 'true' | 'false' | 'loop' | 'done'

/** 画布节点卡片尺寸（与 designer 中 w-52 h-[120px] 一致） */
export const WORKFLOW_NODE_WIDTH = 208
export const WORKFLOW_NODE_HEIGHT = 120
/** 端口圆点直径 w-4，锚点在圆心 */
export const WORKFLOW_PORT_SIZE = 16

export interface WorkflowPortDef {
  id: WorkflowPortId
  side: 'input' | 'output'
  label: string
  /** 自节点顶边至端口圆心的像素距离 */
  topPx: number
}

export function getPortAnchorStyle(port: WorkflowPortDef) {
  return { top: `${port.topPx}px`, transform: 'translateY(-50%)' }
}

export interface WorkflowNodeConfigExtended {
  model?: string
  temperature?: number
  topP?: number
  maxTokens?: number
  outputFormat?: 'json' | 'text' | 'markdown'
  maxRetries?: number
  systemPrompt?: string
  memoryTurns?: number
  /** 知识库 */
  knowledgeBaseId?: string
  topK?: number
  scoreThreshold?: number
  queryTemplate?: string
  /** HTTP */
  endpoint?: string
  method?: string
  headers?: string
  bodyTemplate?: string
  timeoutMs?: number
  /** 代码 */
  codeLanguage?: string
  codeScript?: string
  inputVariable?: string
  outputVariable?: string
  /** 条件 */
  conditionType?: 'expression' | 'variable'
  conditionField?: string
  conditionOperator?: string
  conditionValue?: string
  conditionExpression?: string
  /** 循环 */
  loopType?: 'forEach' | 'while' | 'count'
  loopArrayVariable?: string
  maxIterations?: number
  breakCondition?: string
  /** 聚合 */
  aggregateStrategy?: 'merge' | 'concat' | 'first' | 'last'
  aggregateInputs?: string
  aggregateOutput?: string
  aggregateSeparator?: string
}

export interface WorkflowDesignerOptionsExtended {
  models?: Array<{ label: string; value: string }>
  outputFormats?: Array<{ label: string; value: string }>
  knowledgeBases?: Array<{ label: string; value: string }>
  httpMethods?: Array<{ label: string; value: string }>
  codeLanguages?: Array<{ label: string; value: string }>
  conditionOperators?: Array<{ label: string; value: string }>
  loopTypes?: Array<{ label: string; value: string }>
  aggregateStrategies?: Array<{ label: string; value: string }>
  defaultConfig?: WorkflowNodeConfigExtended
}

export function isAgentLikeNode(node: { type?: string; category?: string; agentType?: string }) {
  if (node.type === 'input' || node.type === 'output') return false
  if (node.category === 'agent' || node.agentType) return true
  return ['analyzer', 'optimizer', 'editor', 'writer', 'custom', 'llm'].includes(node.type || '')
}

export function isLlmNode(node: { type?: string }) {
  return node.type === 'llm' || isAgentLikeNode(node)
}

export function hasInputPort(node: { type?: string }) {
  return node.type !== 'input'
}

export function hasOutputPort(node: { type?: string }) {
  return node.type !== 'output'
}

export function getNodeOutputPorts(node: { type?: string }): WorkflowPortDef[] {
  if (!hasOutputPort(node)) return []
  const centerY = WORKFLOW_NODE_HEIGHT / 2
  if (node.type === 'condition') {
    return [
      { id: 'true', side: 'output', label: '是', topPx: Math.round(WORKFLOW_NODE_HEIGHT * 0.35) },
      { id: 'false', side: 'output', label: '否', topPx: Math.round(WORKFLOW_NODE_HEIGHT * 0.65) },
    ]
  }
  if (node.type === 'loop') {
    return [
      { id: 'loop', side: 'output', label: '循环体', topPx: Math.round(WORKFLOW_NODE_HEIGHT * 0.35) },
      { id: 'done', side: 'output', label: '完成', topPx: Math.round(WORKFLOW_NODE_HEIGHT * 0.65) },
    ]
  }
  return [{ id: 'default', side: 'output', label: '输出', topPx: centerY }]
}

export function getNodeInputPorts(node: { type?: string }): WorkflowPortDef[] {
  if (!hasInputPort(node)) return []
  return [{ id: 'default', side: 'input', label: '输入', topPx: WORKFLOW_NODE_HEIGHT / 2 }]
}

export function getPortPosition(
  node: { x: number; y: number; type?: string },
  side: 'input' | 'output',
  portId: WorkflowPortId = 'default',
  nodeWidth = WORKFLOW_NODE_WIDTH,
  nodeHeight = WORKFLOW_NODE_HEIGHT,
) {
  const ports = side === 'input' ? getNodeInputPorts(node) : getNodeOutputPorts(node)
  const port = ports.find((p) => p.id === portId) || ports[0]
  const topPx = port?.topPx ?? nodeHeight / 2
  const y = node.y + topPx
  if (side === 'output') {
    return { x: node.x + nodeWidth, y }
  }
  return { x: node.x, y }
}

export function getPortLabel(portId?: string) {
  const map: Record<string, string> = {
    default: '',
    true: ' [是]',
    false: ' [否]',
    loop: ' [循环体]',
    done: ' [完成]',
  }
  return portId ? map[portId] || '' : ''
}

export function getConfigTabsForNode(node: { type?: string; category?: string; configTabs?: string[] }) {
  if (node.configTabs?.length) return node.configTabs
  if (node.type === 'input' || node.type === 'output') return ['advanced']
  if (isAgentLikeNode(node)) return ['config', 'prompt', 'memory', 'advanced']
  if (node.type === 'llm') return ['config', 'prompt', 'advanced']
  if (['kb', 'http', 'code', 'condition', 'loop', 'aggregate'].includes(node.type || '')) {
    return ['config', 'advanced']
  }
  return ['config', 'advanced']
}

export function getNodeTypeLabel(type?: string) {
  const map: Record<string, string> = {
    input: '输入',
    output: '输出',
    llm: '大模型',
    kb: '知识库',
    http: 'HTTP',
    code: '代码',
    condition: '条件分支',
    loop: '循环',
    aggregate: '变量聚合',
    optimizer: '优化智能体',
    editor: '编辑智能体',
    analyzer: '分析智能体',
    writer: '写作智能体',
    custom: '自定义智能体',
  }
  return map[type || ''] || type || '节点'
}

export function normalizeConnection(conn: Record<string, unknown>, index = 0) {
  return {
    id: String(
      conn.id ||
        `c_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    ),
    from: String(conn.from),
    to: String(conn.to),
    fromPort: (conn.fromPort as WorkflowPortId) || 'default',
    toPort: (conn.toPort as WorkflowPortId) || 'default',
  }
}

export function mergeNodeConfig(
  _type: string,
  base: WorkflowNodeConfigExtended = {},
): WorkflowNodeConfigExtended {
  return { ...base }
}
