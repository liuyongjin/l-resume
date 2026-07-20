import { PrismaService } from '../prisma/prisma.service';
import { getTemplateById } from './workflow-node-catalog';
import { normalizeCanvasNodes } from './workflow-node.util';
import { getWorkflowExecutionOrder, normalizePort } from './workflow-graph.traversal';
import { normalizeWorkflowConnections } from './workflow-graph.normalize';
export interface WorkflowCanvasGraph {
  nodes: any[];
  connections: any[];
}

function parseJsonArray(value: unknown): any[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** 数据库记录 → 设计器画布节点 */
export function dbNodeToCanvasNode(record: {
  nodeId: string;
  templateId: string | null;
  type: string;
  agentType: string | null;
  category: string;
  name: string;
  description: string | null;
  positionX: number;
  positionY: number;
  configTabs: unknown;
  config: unknown;
}) {
  const config =
    record.config && typeof record.config === 'object'
      ? JSON.parse(JSON.stringify(record.config))
      : {};
  const temperature =
    typeof (config as { temperature?: unknown }).temperature === 'number'
      ? (config as { temperature: number }).temperature
      : 0;
  const template = getTemplateById(record.templateId || record.nodeId);

  return {
    id: record.nodeId,
    templateId: record.templateId ?? undefined,
    type: record.type,
    agentType: record.agentType ?? undefined,
    category: record.category,
    name: record.name,
    description: record.description ?? '',
    icon: template?.icon ?? '',
    color: template?.color ?? '',
    x: record.positionX,
    y: record.positionY,
    temp: temperature,
    output: record.description ?? '',
    configTabs: Array.isArray(record.configTabs) ? record.configTabs : [],
    config,
  };
}

/** 数据库记录 → 设计器连线 */
export function dbConnectionToCanvasConnection(record: {
  connectionId: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort: string | null;
  toPort: string | null;
}) {
  return {
    id: record.connectionId,
    from: record.fromNodeId,
    to: record.toNodeId,
    fromPort: record.fromPort ?? 'default',
    toPort: record.toPort ?? 'default',
  };}

/** 将画布 nodes/connections 同步到 jf_workflow_node / jf_workflow_edge 表 */
export async function syncWorkflowGraph(
  prisma: PrismaService,
  workflowId: number,
  rawNodes: unknown,
  rawConnections: unknown,
): Promise<WorkflowCanvasGraph> {
  const nodes = normalizeCanvasNodes(parseJsonArray(rawNodes));
  const connections = normalizeWorkflowConnections(nodes, parseJsonArray(rawConnections));  const orderedNodes = getWorkflowExecutionOrder(nodes, connections);
  const sortOrderMap = new Map(orderedNodes.map((node, index) => [node.id, index]));

  const nodeRows = nodes.map((node) => ({
    workflowId,
    nodeId: String(node.id),
    templateId: node.templateId ? String(node.templateId) : null,
    type: String(node.type || 'custom'),
    agentType: node.agentType ? String(node.agentType) : null,
    category: String(node.category || 'agent'),
    name: String(node.name || '未命名节点'),
    description: node.description ? String(node.description) : null,
    positionX: Number.isFinite(Number(node.x)) ? Math.round(Number(node.x)) : 0,
    positionY: Number.isFinite(Number(node.y)) ? Math.round(Number(node.y)) : 0,
    configTabs: Array.isArray(node.configTabs) ? node.configTabs : [],
    config: JSON.parse(JSON.stringify(node.config ?? {})),
    sortOrder: sortOrderMap.get(node.id) ?? 0,
  }));

  const connectionRows = connections.map((connection, index) => ({
    workflowId,
    connectionId: String(connection.id || `conn_${index}`),
    fromNodeId: String(connection.from),
    toNodeId: String(connection.to),
    fromPort: String(normalizePort(connection.fromPort)),
    toPort: String(normalizePort(connection.toPort)),    sortOrder: index,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.workflowNode.deleteMany({ where: { workflowId } });
    await tx.workflowConnection.deleteMany({ where: { workflowId } });
    if (nodeRows.length > 0) {
      await tx.workflowNode.createMany({ data: nodeRows });
    }
    if (connectionRows.length > 0) {
      await tx.workflowConnection.createMany({ data: connectionRows });
    }
  });

  return { nodes, connections };
}

/** 从 jf_workflow_node / jf_workflow_edge 加载画布 */
export async function loadWorkflowGraph(
  prisma: PrismaService,
  workflowId: number,
): Promise<WorkflowCanvasGraph> {
  const [dbNodes, dbConnections] = await Promise.all([
    prisma.workflowNode.findMany({
      where: { workflowId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.workflowConnection.findMany({
      where: { workflowId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
  ]);

  if (dbNodes.length === 0) {
    return { nodes: [], connections: [] };
  }

  return {
    nodes: dbNodes.map(dbNodeToCanvasNode),
    connections: dbConnections.map(dbConnectionToCanvasConnection),
  };
}

/** 克隆工作流图到新版本 */
export async function cloneWorkflowGraph(
  prisma: PrismaService,
  sourceWorkflowId: number,
  targetWorkflowId: number,
): Promise<WorkflowCanvasGraph> {
  const graph = await loadWorkflowGraph(prisma, sourceWorkflowId);
  return syncWorkflowGraph(prisma, targetWorkflowId, graph.nodes, graph.connections);
}
