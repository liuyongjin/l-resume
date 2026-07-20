import {
  WorkflowGraphConnection,
  collectLoopBodyNodeIds,
  normalizePort,
} from './workflow-graph.traversal';

export type { WorkflowGraphConnection };

export interface WorkflowGraphNodeRef {
  id: string;
  type?: string;
}

/** 推断条件/循环节点缺失的 fromPort（兼容旧数据） */
export function inferBranchPorts(
  nodes: WorkflowGraphNodeRef[],
  connections: WorkflowGraphConnection[],
): WorkflowGraphConnection[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const bySource = new Map<string, WorkflowGraphConnection[]>();

  for (const conn of connections) {
    const list = bySource.get(conn.from) || [];
    list.push(conn);
    bySource.set(conn.from, list);
  }

  for (const [fromId, list] of bySource.entries()) {
    const fromNode = nodeMap.get(fromId);
    if (!fromNode) continue;

    if (fromNode.type === 'condition') {
      const defaults = list.filter((c) => normalizePort(c.fromPort) === 'default');
      if (defaults.length === 1) defaults[0].fromPort = 'true';
      if (defaults.length >= 2) {
        defaults[0].fromPort = 'true';
        defaults[1].fromPort = 'false';
      }
    }

    if (fromNode.type === 'loop') {
      const defaults = list.filter((c) => normalizePort(c.fromPort) === 'default');
      if (defaults.length === 1) defaults[0].fromPort = 'loop';
      if (defaults.length >= 2) {
        defaults[0].fromPort = 'loop';
        defaults[1].fromPort = 'done';
      }
    }
  }

  return connections;
}

export function normalizeWorkflowConnections(
  nodes: WorkflowGraphNodeRef[],
  rawConnections: unknown[],
): WorkflowGraphConnection[] {
  if (!Array.isArray(rawConnections)) return [];

  const mapped = rawConnections
    .filter((conn): conn is Record<string, unknown> => conn != null && typeof conn === 'object')
    .map((conn, index) => ({
      id: String(conn.id || `c_${index}_${Date.now()}`),
      from: String(conn.from),
      to: String(conn.to),
      fromPort: conn.fromPort != null ? String(conn.fromPort) : 'default',
      toPort: conn.toPort != null ? String(conn.toPort) : 'default',
    }))
    .filter((conn) => conn.from && conn.to);

  return inferBranchPorts(nodes, mapped);
}

export function collectAllLoopBodyNodeIds(
  nodes: WorkflowGraphNodeRef[],
  connections: WorkflowGraphConnection[],
): Set<string> {
  const body = new Set<string>();
  for (const node of nodes) {
    if (node.type !== 'loop') continue;
    for (const id of collectLoopBodyNodeIds(node.id, connections)) {
      body.add(id);
    }
  }
  return body;
}

export function validateWorkflowGraph(
  nodes: WorkflowGraphNodeRef[],
  connections: WorkflowGraphConnection[],
): string[] {
  const errors: string[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const hasInput = nodes.some((node) => node.type === 'input');
  const hasOutput = nodes.some((node) => node.type === 'output');

  if (!hasInput) errors.push('缺少输入节点');
  if (!hasOutput) errors.push('缺少输出节点');

  for (const conn of connections) {
    if (!nodeMap.has(conn.from)) errors.push(`连线 ${conn.id} 的起点不存在`);
    if (!nodeMap.has(conn.to)) errors.push(`连线 ${conn.id} 的终点不存在`);
  }

  for (const node of nodes) {
    if (node.type === 'condition') {
      const hasTrue = connections.some(
        (c) => c.from === node.id && normalizePort(c.fromPort) === 'true',
      );
      const hasFalse = connections.some(
        (c) => c.from === node.id && normalizePort(c.fromPort) === 'false',
      );
      if (!hasTrue && !hasFalse) {
        errors.push(`条件节点「${node.id}」至少需要一条「是」或「否」分支连线`);
      }
    }
    if (node.type === 'loop') {
      const hasLoop = connections.some(
        (c) => c.from === node.id && normalizePort(c.fromPort) === 'loop',
      );
      const hasDone = connections.some(
        (c) => c.from === node.id && normalizePort(c.fromPort) === 'done',
      );
      if (!hasDone) errors.push(`循环节点「${node.id}」需要连接「完成」端口`);
      if (!hasLoop) errors.push(`循环节点「${node.id}」建议连接「循环体」端口`);
    }
  }

  return errors;
}
