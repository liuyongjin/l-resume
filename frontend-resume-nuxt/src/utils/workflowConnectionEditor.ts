import type { WorkflowPortId } from './workflowNodeMeta'
import {
  normalizeConnection,
  WORKFLOW_NODE_HEIGHT,
  WORKFLOW_NODE_WIDTH,
} from './workflowNodeMeta'

export const WORKFLOW_CANVAS_LAYER_MIN = { width: 2000, height: 1500 }
export const WORKFLOW_CANVAS_LAYER_PADDING = 120

/** SVG 连线层尺寸：随节点布局扩展，避免宽工作流连线被 2000px 画布裁切 */
export function computeWorkflowCanvasLayerSize(
  nodes: Array<{ x?: number; y?: number }>,
  nodeWidth = WORKFLOW_NODE_WIDTH,
  nodeHeight = WORKFLOW_NODE_HEIGHT,
  padding = WORKFLOW_CANVAS_LAYER_PADDING,
) {
  if (!nodes.length) {
    return { ...WORKFLOW_CANVAS_LAYER_MIN }
  }

  const maxX = Math.max(...nodes.map((n) => Number(n.x ?? 0) + nodeWidth))
  const maxY = Math.max(...nodes.map((n) => Number(n.y ?? 0) + nodeHeight))

  return {
    width: Math.max(WORKFLOW_CANVAS_LAYER_MIN.width, maxX + padding),
    height: Math.max(WORKFLOW_CANVAS_LAYER_MIN.height, maxY + padding),
  }
}

export interface WorkflowConnectNodeRef {
  id: string
  type?: string
}

export interface WorkflowConnectionDraft {
  from: string
  fromPort: WorkflowPortId
  to: string
  toPort: WorkflowPortId
}

export function validateWorkflowConnection(
  fromNode: WorkflowConnectNodeRef,
  toNode: WorkflowConnectNodeRef,
): string | null {
  if (fromNode.id === toNode.id) return '不能连接同一节点'
  if (fromNode.type === 'output') return '输出节点不能作为连线起点'
  if (toNode.type === 'input') return '输入节点不能作为连线终点'
  return null
}

/** 同一输入端口仅保留一条入边（ComfyUI 单输入语义） */
export function upsertWorkflowConnection(
  connections: Array<{ id: string; from: string; to: string; fromPort?: string; toPort?: string }>,
  draft: WorkflowConnectionDraft,
) {
  const toPort = draft.toPort || 'default'
  const next = connections.filter(
    (conn) => !(conn.to === draft.to && (conn.toPort || 'default') === toPort),
  )
  next.push(
    normalizeConnection(
      {
        from: draft.from,
        to: draft.to,
        fromPort: draft.fromPort,
        toPort: draft.toPort,
      },
      next.length,
    ),
  )
  return next
}

export function buildBezierPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const dx = Math.max(40, Math.abs(to.x - from.x) * 0.4)
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
}

export function clientPointToCanvas(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  pan: { x: number; y: number },
  zoom: number,
) {
  return {
    x: (clientX - viewportRect.left - pan.x) / zoom,
    y: (clientY - viewportRect.top - pan.y) / zoom,
  }
}

/** 与后端 inferBranchPorts 对齐 */
export function inferBranchPortsForCanvas(
  nodes: WorkflowConnectNodeRef[],
  connections: ReturnType<typeof normalizeConnection>[],
) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const bySource = new Map<string, ReturnType<typeof normalizeConnection>[]>()

  for (const conn of connections) {
    const list = bySource.get(conn.from) || []
    list.push(conn)
    bySource.set(conn.from, list)
  }

  for (const [fromId, list] of bySource.entries()) {
    const fromNode = nodeMap.get(fromId)
    if (!fromNode) continue

    if (fromNode.type === 'condition') {
      const defaults = list.filter((c) => (c.fromPort || 'default') === 'default')
      if (defaults.length === 1) defaults[0].fromPort = 'true'
      if (defaults.length >= 2) {
        defaults[0].fromPort = 'true'
        defaults[1].fromPort = 'false'
      }
    }

    if (fromNode.type === 'loop') {
      const defaults = list.filter((c) => (c.fromPort || 'default') === 'default')
      if (defaults.length === 1) defaults[0].fromPort = 'loop'
      if (defaults.length >= 2) {
        defaults[0].fromPort = 'loop'
        defaults[1].fromPort = 'done'
      }
    }
  }

  return connections
}

export function normalizeCanvasConnections(
  nodes: WorkflowConnectNodeRef[],
  rawConnections: unknown[],
) {
  if (!Array.isArray(rawConnections)) return []
  const mapped = rawConnections.map((conn, index) =>
    normalizeConnection(conn as Record<string, unknown>, index),
  )
  return inferBranchPortsForCanvas(nodes, mapped)
}
