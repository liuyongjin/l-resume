/** 工作流图遍历 — 支持条件分支端口与循环体（ComfyUI 式路由） */

export interface WorkflowGraphConnection {
  id?: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
}

export function normalizePort(port?: string): string {
  return port && port.trim() ? port.trim() : 'default';
}

export function getOutgoingConnections(
  nodeId: string,
  connections: WorkflowGraphConnection[],
  fromPort?: string,
): WorkflowGraphConnection[] {
  return connections.filter((conn) => {
    if (conn.from !== nodeId) return false;
    const port = normalizePort(conn.fromPort);
    if (fromPort === undefined) return port === 'default';
    return port === fromPort;
  });
}

export function getNextNodeIds(
  nodeId: string,
  connections: WorkflowGraphConnection[],
  fromPort?: string,
): string[] {
  return getOutgoingConnections(nodeId, connections, fromPort).map((conn) => conn.to);
}

/** 收集循环体节点：从 loop 端口出发，不跨入 done 端口下游 */
export function collectLoopBodyNodeIds(
  loopNodeId: string,
  connections: WorkflowGraphConnection[],
): string[] {
  const doneTargets = new Set(getNextNodeIds(loopNodeId, connections, 'done'));
  const entries = getNextNodeIds(loopNodeId, connections, 'loop');
  const body = new Set<string>();
  const queue = [...entries];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === loopNodeId || doneTargets.has(currentId)) continue;
    if (body.has(currentId)) continue;
    body.add(currentId);

    for (const conn of connections) {
      if (conn.from !== currentId) continue;
      const port = normalizePort(conn.fromPort);
      if (port !== 'default' && port !== 'loop') continue;
      const nextId = conn.to;
      if (nextId === loopNodeId || doneTargets.has(nextId)) continue;
      if (!body.has(nextId)) queue.push(nextId);
    }
  }

  return [...body];
}

/** 循环体内拓扑序（仅 body 内边） */
export function getLoopBodyExecutionOrder(
  bodyNodeIds: string[],
  connections: WorkflowGraphConnection[],
  nodeMap: Map<string, unknown>,
): unknown[] {
  if (bodyNodeIds.length === 0) return [];
  const bodySet = new Set(bodyNodeIds);
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of bodyNodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const conn of connections) {
    if (!bodySet.has(conn.from) || !bodySet.has(conn.to)) continue;
    adjacency.get(conn.from)!.push(conn.to);
    inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
  }

  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);
  const ordered: unknown[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const node = nodeMap.get(currentId);
    if (node) ordered.push(node);

    for (const nextId of adjacency.get(currentId) || []) {
      const nextDegree = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, nextDegree);
      if (nextDegree === 0) queue.push(nextId);
    }
  }

  if (ordered.length === bodyNodeIds.length) return ordered;
  return bodyNodeIds.map((id) => nodeMap.get(id)).filter(Boolean);
}

/**
 * 静态可达顺序（用于 sortOrder / UI 预览）：
 * - 条件节点只展开 default 预测路径（true 优先）
 * - 循环节点先 loop 体再 done 下游
 */
export function getWorkflowExecutionOrder(nodes: any[], connections: WorkflowGraphConnection[]): any[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inputNode = nodes.find((node) => node.type === 'input') || nodes[0];
  const visited = new Set<string>();
  const ordered: any[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;
    visited.add(nodeId);
    ordered.push(node);

    if (node.type === 'condition') {
      const trueNext = getNextNodeIds(nodeId, connections, 'true');
      const falseNext = getNextNodeIds(nodeId, connections, 'false');
      const branch = trueNext.length > 0 ? trueNext : falseNext;
      branch.forEach(visit);
      return;
    }

    if (node.type === 'loop') {
      const bodyIds = collectLoopBodyNodeIds(nodeId, connections);
      const bodyOrder = getLoopBodyExecutionOrder(bodyIds, connections, nodeMap) as any[];
      bodyOrder.forEach((bodyNode) => visit(bodyNode.id));
      getNextNodeIds(nodeId, connections, 'done').forEach(visit);
      return;
    }

    getNextNodeIds(nodeId, connections, 'default').forEach(visit);
  }

  visit(inputNode.id);

  for (const node of nodes) {
    if (!visited.has(node.id)) ordered.push(node);
  }

  return ordered;
}
