/** 工作流设计器 — 画布布局与 I/O 节点工具函数 */

import { normalizeConnection } from './workflowNodeMeta'
import { normalizeCanvasConnections } from './workflowConnectionEditor'

export interface WorkflowNodeConfig {
  model?: string
  temperature?: number
  topP?: number
  maxTokens?: number
  outputFormat?: 'json' | 'text' | 'markdown'
  maxRetries?: number
  systemPrompt?: string
  memoryTurns?: number
}

export const WORKFLOW_CANVAS = {
  width: 2000,
  height: 1500,
  nodeWidth: 208,
  nodeHeight: 120,
  nodeGap: 80,
} as const

/** 画布水平居中 x 坐标（与 designer NODE_WIDTH 一致） */
export const WORKFLOW_CENTER_X = Math.round(
  (WORKFLOW_CANVAS.width - WORKFLOW_CANVAS.nodeWidth) / 2,
)

/** 画布垂直居中 y 坐标 */
export const WORKFLOW_CENTER_Y = Math.round(
  (WORKFLOW_CANVAS.height - WORKFLOW_CANVAS.nodeHeight) / 2,
)

/** 水平流式布局：按序号计算 x，整体在画布水平居中 */
export function centeredFlowX(index: number, total: number): number {
  const { nodeWidth, nodeGap, width } = WORKFLOW_CANVAS
  const totalWidth = total * nodeWidth + (total - 1) * nodeGap
  const startX = Math.round((width - totalWidth) / 2)
  return startX + index * (nodeWidth + nodeGap)
}

/** @deprecated 保留兼容；新布局请用 centeredFlowX */
export function centeredFlowY(index: number, total: number): number {
  const { nodeHeight, nodeGap, height } = WORKFLOW_CANVAS
  const totalHeight = total * nodeHeight + (total - 1) * nodeGap
  const startY = Math.round((height - totalHeight) / 2)
  return startY + index * (nodeHeight + nodeGap)
}

/** 默认四节点工作流（输入 → 编辑 → 优化 → 输出）水平居中坐标 */
export const DEFAULT_WORKFLOW_LAYOUT = {
  input: { x: centeredFlowX(0, 4), y: WORKFLOW_CENTER_Y },
  edit: { x: centeredFlowX(1, 4), y: WORKFLOW_CENTER_Y },
  optimize: { x: centeredFlowX(2, 4), y: WORKFLOW_CENTER_Y },
  output: { x: centeredFlowX(3, 4), y: WORKFLOW_CENTER_Y },
} as const

/** 重置后仅输入 → 输出的水平居中坐标 */
export const RESET_WORKFLOW_LAYOUT = {
  input: { x: centeredFlowX(0, 2), y: WORKFLOW_CENTER_Y },
  output: { x: centeredFlowX(1, 2), y: WORKFLOW_CENTER_Y },
} as const

/** 画布固定输入/输出节点（不可删除） */
export const WORKFLOW_INPUT_NODE = {
  id: 'workflow-input',
  type: 'input',
  name: '输入',
  description: '接收简历与运行配置',
  icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  category: 'io' as const,
  x: DEFAULT_WORKFLOW_LAYOUT.input.x,
  y: DEFAULT_WORKFLOW_LAYOUT.input.y,
  temp: 0,
  output: 'Resume input',
}

export const WORKFLOW_OUTPUT_NODE = {
  id: 'workflow-output',
  type: 'output',
  name: '输出',
  description: '输出最终简历结果',
  icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 4l4 4m0 0l4-4m-4 4V4',
  color: 'bg-gradient-to-br from-rose-500 to-rose-600',
  category: 'io' as const,
  x: DEFAULT_WORKFLOW_LAYOUT.output.x,
  y: DEFAULT_WORKFLOW_LAYOUT.output.y,
  temp: 0,
  output: 'Resume output',
}

export function isProtectedWorkflowNode(node: { type?: string } | null | undefined): boolean {
  return node?.type === 'input' || node?.type === 'output'
}

/** 重置后仅保留输入 → 输出 */
export const RESET_WORKFLOW = {
  nodes: [
    { ...WORKFLOW_INPUT_NODE, ...RESET_WORKFLOW_LAYOUT.input },
    { ...WORKFLOW_OUTPUT_NODE, ...RESET_WORKFLOW_LAYOUT.output },
  ],
  connections: [{ id: 'c-reset', from: 'workflow-input', to: 'workflow-output' }],
}

export function ensureWorkflowIoNodes(
  nodes: any[],
  connections: any[],
): { nodes: any[]; connections: any[] } {
  let resultNodes = [...nodes]
  let resultConnections = [...connections]

  if (!resultNodes.some((n) => n.type === 'input')) {
    const anchor = resultNodes[0]
    const input = {
      ...WORKFLOW_INPUT_NODE,
      x: (anchor?.x ?? DEFAULT_WORKFLOW_LAYOUT.optimize.x) - (WORKFLOW_CANVAS.nodeWidth + WORKFLOW_CANVAS.nodeGap),
      y: anchor?.y ?? WORKFLOW_CENTER_Y,
    }
    resultNodes.unshift(input)
    if (anchor) {
      resultConnections.unshift({ id: 'c-input', from: input.id, to: anchor.id })
    }
  }

  if (!resultNodes.some((n) => n.type === 'output')) {
    const anchor = resultNodes[resultNodes.length - 1]
    const output = {
      ...WORKFLOW_OUTPUT_NODE,
      x: (anchor?.x ?? DEFAULT_WORKFLOW_LAYOUT.edit.x) + (WORKFLOW_CANVAS.nodeWidth + WORKFLOW_CANVAS.nodeGap),
      y: anchor?.y ?? WORKFLOW_CENTER_Y,
    }
    resultNodes.push(output)
    if (anchor && anchor.type !== 'output') {
      resultConnections.push({ id: 'c-output', from: anchor.id, to: output.id })
    }
  }

  return { nodes: resultNodes, connections: resultConnections }
}

export function parseWorkflowJson<T>(value: T | string | null | undefined): T {
  if (value == null) return [] as T
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return [] as T
    }
  }
  return value
}

/** 规范化 API 工作流 payload，保证 nodes、connections 为数组并补全输入输出节点 */
export function normalizeWorkflowPayload(workflow: {
  id?: string
  name?: string
  description?: string
  nodes?: unknown
  connections?: unknown
  config?: unknown
  [key: string]: unknown
}) {
  let nodes = parseWorkflowJson<any[]>(workflow?.nodes as any)
  let connections = parseWorkflowJson<any[]>(workflow?.connections as any)
  if (!Array.isArray(nodes)) nodes = []
  if (!Array.isArray(connections)) connections = []
  const structured = ensureWorkflowIoNodes(nodes, connections)
  const normalizedNodes = normalizeNodeCoordinates(structured.nodes)
  return {
    ...workflow,
    nodes: normalizedNodes,
    connections: normalizeCanvasConnections(normalizedNodes, structured.connections),
  }
}

/** 将旧版纵向堆叠布局自动迁移为从左到右排列 */
export function migrateVerticalLayoutToHorizontal(nodes: any[]): any[] {
  if (nodes.length < 2) return nodes

  const xs = nodes.map((n) => Number(n.x)).filter(Number.isFinite)
  const ys = nodes.map((n) => Number(n.y)).filter(Number.isFinite)
  if (xs.length < 2 || ys.length < 2) return nodes

  const xSpread = Math.max(...xs) - Math.min(...xs)
  const ySpread = Math.max(...ys) - Math.min(...ys)

  if (xSpread > 20 || ySpread <= WORKFLOW_CANVAS.nodeHeight) return nodes

  const ordered = [...nodes].sort((a, b) => {
    if (a.type === 'input') return -1
    if (b.type === 'input') return 1
    if (a.type === 'output') return 1
    if (b.type === 'output') return -1
    return Number(a.y) - Number(b.y)
  })

  return ordered.map((node, index) => ({
    ...node,
    x: centeredFlowX(index, ordered.length),
    y: WORKFLOW_CENTER_Y,
  }))
}

/** 保证节点坐标为有效数字，缺失时使用默认水平布局 */
export function normalizeNodeCoordinates(nodes: any[]): any[] {
  const layoutByKey: Record<string, { x: number; y: number }> = {
    'workflow-input': DEFAULT_WORKFLOW_LAYOUT.input,
    optimize: DEFAULT_WORKFLOW_LAYOUT.optimize,
    edit: DEFAULT_WORKFLOW_LAYOUT.edit,
    'workflow-output': DEFAULT_WORKFLOW_LAYOUT.output,
  }

  const migrated = migrateVerticalLayoutToHorizontal(nodes)

  return migrated.map((node, index) => {
    const key = String(node.templateId || node.id?.split('_')[0] || node.id || '')
    const fallback = layoutByKey[node.id] || layoutByKey[key]
    let x = Number(node.x)
    let y = Number(node.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = fallback?.x ?? centeredFlowX(index, Math.max(migrated.length, 1))
      y = fallback?.y ?? WORKFLOW_CENTER_Y
    }
    return { ...node, x, y }
  })
}

export interface WorkflowVersionListItem {
  id: number
  version: number
  isDefault: boolean
  name?: string
  publishedAt?: string
  createdAt?: string
}

/** 版本列表按 version 降序时，取最新一条的 id */
export function resolveLatestWorkflowVersionId(
  versions: WorkflowVersionListItem[],
): number | null {
  if (!versions.length) return null
  return versions[0]?.id ?? null
}

/** 先拉版本列表，再按最新版本 id 获取工作流详情 */
export async function fetchLatestWorkflow(
  listVersions: () => Promise<{
    success: boolean
    data?: { versions?: WorkflowVersionListItem[] }
  }>,
  getVersion: (versionId: number) => Promise<{ success: boolean; data?: Record<string, unknown> }>,
) {
  const listResult = await listVersions()
  const versions = listResult.success ? listResult.data?.versions ?? [] : []
  const versionId = resolveLatestWorkflowVersionId(versions)
  if (!versionId) {
    return { versions, workflow: null as Record<string, unknown> | null }
  }

  const detailResult = await getVersion(versionId)
  return {
    versions,
    workflow: detailResult.success ? (detailResult.data ?? null) : null,
  }
}

/** 按指定版本 id 获取工作流详情 */
export async function fetchWorkflowByVersionId(
  versionId: number,
  getVersion: (id: number) => Promise<{ success: boolean; data?: Record<string, unknown> }>,
) {
  const detailResult = await getVersion(versionId)
  return detailResult.success ? (detailResult.data ?? null) : null
}

export function parseWorkflowAgentNodes(nodes: unknown) {
  return parseWorkflowExecutionNodes(nodes, []).map(({ id, name, description, status }) => ({
    id,
    name,
    description,
    status,
  }))
}

/** 拓扑排序：与后端 workflow-graph.traversal 一致（条件/循环端口感知） */
export function getWorkflowExecutionOrder(nodes: any[], connections: any[]): any[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return []

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const normalizePort = (port?: string) => (port && port.trim() ? port.trim() : 'default')

  const getNext = (nodeId: string, fromPort?: string) =>
    connections
      .filter((conn) => {
        if (conn.from !== nodeId) return false
        const port = normalizePort(conn.fromPort)
        if (fromPort === undefined) return port === 'default'
        return port === fromPort
      })
      .map((conn) => conn.to)

  const collectLoopBody = (loopNodeId: string) => {
    const doneTargets = new Set(getNext(loopNodeId, 'done'))
    const entries = getNext(loopNodeId, 'loop')
    const body = new Set<string>()
    const queue = [...entries]
    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (currentId === loopNodeId || doneTargets.has(currentId)) continue
      if (body.has(currentId)) continue
      body.add(currentId)
      for (const conn of connections) {
        if (conn.from !== currentId) continue
        const port = normalizePort(conn.fromPort)
        if (port !== 'default' && port !== 'loop') continue
        const nextId = conn.to
        if (nextId === loopNodeId || doneTargets.has(nextId)) continue
        if (!body.has(nextId)) queue.push(nextId)
      }
    }
    return [...body]
  }

  const inputNode = nodes.find((node) => node.type === 'input') || nodes[0]
  const visited = new Set<string>()
  const ordered: any[] = []

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return
    const node = nodeMap.get(nodeId)
    if (!node) return
    visited.add(nodeId)
    ordered.push(node)

    if (node.type === 'condition') {
      const branch = getNext(nodeId, 'true').length > 0 ? getNext(nodeId, 'true') : getNext(nodeId, 'false')
      branch.forEach(visit)
      return
    }

    if (node.type === 'loop') {
      collectLoopBody(nodeId).forEach((bodyId) => visit(bodyId))
      getNext(nodeId, 'done').forEach(visit)
      return
    }

    getNext(nodeId, 'default').forEach(visit)
  }

  visit(inputNode.id)
  for (const node of nodes) {
    if (!visited.has(node.id)) ordered.push(node)
  }
  return ordered
}

export interface WorkflowExecutionNodeItem {
  id: string
  name: string
  description: string
  type: string
  category?: string
  agentType?: string
  model?: string
  temperature?: number
  status: 'pending' | 'active' | 'completed' | 'error'
}

export function parseWorkflowExecutionNodes(
  nodes: unknown,
  connections: unknown,
): WorkflowExecutionNodeItem[] {
  const list = parseWorkflowJson<any[]>(nodes as any)
  const connList = parseWorkflowJson<any[]>(connections as any)

  const agentTypeMap: Record<string, string> = {
    parse: 'analyzer',
    optimize: 'optimizer',
    edit: 'writer',
    editor: 'writer',
    skill: 'analyzer',
    planner: 'planner',
    analyzer: 'analyzer',
    writer: 'writer',
    reviewer: 'reviewer',
    optimizer: 'optimizer',
    translator: 'translator',
    custom: 'writer',
  }

  const ordered = getWorkflowExecutionOrder(list, connList)

  return ordered
    .filter((n: any) => {
      if (!n.type || ['input', 'output'].includes(n.type)) return false
      if (n.category === 'tool') return true
      return Boolean(n.agentType || agentTypeMap[n.type] || agentTypeMap[n.id])
    })
    .map((n: any) => ({
      id: n.id,
      name: n.name,
      description: n.description || '',
      type: n.type,
      category: n.category,
      agentType: n.agentType || agentTypeMap[n.type] || agentTypeMap[n.id],
      model: n.config?.model,
      temperature: n.config?.temperature ?? n.temp,
      status: 'pending' as const,
    }))
}
