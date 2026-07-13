import { getNodeLibrary, getTemplateById } from './workflow-node-catalog';
import { normalizeResumeLlmModelId } from './llm-models.constants';

/** 从工作流节点提取 agent 配置，供 Python 编排层使用 */
export function extractAgentConfigs(nodes: any[]): Record<string, any> {
  const configs: Record<string, any> = {};
  if (!Array.isArray(nodes)) return configs;

  const typeAliases: Record<string, string> = {
    parse: 'analyzer',
    optimize: 'optimizer',
    edit: 'writer',
    editor: 'writer',
    skill: 'analyzer',
    interview: 'writer',
    custom: 'writer',
    planner: 'planner',
    analyzer: 'analyzer',
    writer: 'writer',
    reviewer: 'reviewer',
    optimizer: 'optimizer',
    translator: 'translator',
    llm: 'writer',
  };

  for (const node of nodes) {
    const agentType = node.agentType || typeAliases[node.type] || typeAliases[node.id];
    if (!agentType || node.type === 'input' || node.type === 'output') continue;
    if (node.category === 'tool' && !['llm', 'kb'].includes(node.type)) continue;

    const existing = configs[agentType] || {};
    configs[agentType] = {
      ...existing,
      name: node.name || existing.name,
      description: node.description || existing.description,
      model: normalizeResumeLlmModelId(
        (node.config?.model as string | undefined) || (node.model as string | undefined) || (existing.model as string | undefined),
      ),
      temperature: node.config?.temperature ?? node.temp ?? existing.temperature,
      topP: node.config?.topP ?? existing.topP,
      maxTokens: node.config?.maxTokens ?? existing.maxTokens,
      outputFormat: node.config?.outputFormat ?? existing.outputFormat,
      maxRetries: node.config?.maxRetries ?? existing.maxRetries,
      systemPrompt: node.config?.systemPrompt ?? node.systemPrompt ?? existing.systemPrompt,
      memoryTurns: node.config?.memoryTurns ?? existing.memoryTurns,
    };
  }

  return configs;
}

const AGENT_TYPE_ALIASES: Record<string, string> = {
  parse: 'analyzer',
  optimize: 'optimizer',
  edit: 'writer',
  editor: 'writer',
  skill: 'analyzer',
  interview: 'writer',
  custom: 'writer',
  planner: 'planner',
  analyzer: 'analyzer',
  writer: 'writer',
  reviewer: 'reviewer',
  optimizer: 'optimizer',
  translator: 'translator',
  llm: 'writer',
};

/** 解析画布节点对应的智能体类型 */
export function resolveAgentType(node: { id?: string; type?: string; agentType?: string }): string | null {
  if (node.agentType) return node.agentType;
  const nodeType = node.type || '';
  const idPrefix = node.id?.split('_')[0] || '';
  return AGENT_TYPE_ALIASES[nodeType] || AGENT_TYPE_ALIASES[idPrefix] || AGENT_TYPE_ALIASES[node.id || ''] || nodeType || null;
}

/** 为单个节点构建 agentConfigs（仅包含当前节点配置，供 execute 使用） */
export function buildNodeAgentConfig(node: {
  id?: string;
  type?: string;
  agentType?: string;
  name?: string;
  description?: string;
  temp?: number;
  config?: Record<string, unknown>;
}): Record<string, Record<string, unknown>> {
  const agentType = resolveAgentType(node);
  if (!agentType) return {};

  const cfg = node.config || {};
  return {
    [agentType]: {
      ...cfg,
      model: normalizeResumeLlmModelId(cfg.model as string | undefined),
      systemPrompt: cfg.systemPrompt,
      temperature: cfg.temperature ?? node.temp,
      topP: cfg.topP,
      maxTokens: cfg.maxTokens,
      outputFormat: cfg.outputFormat,
      maxRetries: cfg.maxRetries,
      memoryTurns: cfg.memoryTurns,
      name: node.name,
      description: node.description,
    },
  };
}

/** 判断节点是否应在 execute 中作为智能体节点执行 */
export function isExecutableAgentNode(node: { type?: string; category?: string; agentType?: string; id?: string }): boolean {
  if (!node.type || node.type === 'input' || node.type === 'output') return false;
  if (node.category === 'tool' && !['llm', 'kb'].includes(node.type)) return false;
  return Boolean(resolveAgentType(node));
}

/** 合并节点配置：模板默认值 + 已保存配置（已保存字段优先，含空字符串） */
export function mergeNodeConfigFields(
  baseConfig: Record<string, unknown> | undefined,
  savedConfig: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const merged = { ...(baseConfig || {}) };
  for (const [key, value] of Object.entries(savedConfig || {})) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/** 规范化画布节点，补全 config / type / agentType */
export function normalizeCanvasNodes(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return [];
  const library = getNodeLibrary();

  return nodes.map((node, index) => {
    const template = getTemplateById(node.templateId || node.id?.split('_')[0] || node.id);
    const base = template || library.categories.flatMap((c) => c.nodes).find((n) => n.type === node.type);

    const savedConfig =
      node.config && typeof node.config === 'object' && !Array.isArray(node.config)
        ? (node.config as Record<string, unknown>)
        : {};
    const config = mergeNodeConfigFields(base?.config as Record<string, unknown>, savedConfig);
    if (typeof config.model === 'string') {
      config.model = normalizeResumeLlmModelId(config.model);
    }

    return {
      id: node.id || `node_${Date.now()}_${index}`,
      templateId: node.templateId || base?.id || node.id,
      type: node.type || base?.type || 'custom',
      agentType: node.agentType || base?.agentType,
      category: node.category || base?.category || 'agent',
      name: node.name || base?.name || '未命名节点',
      description: node.description || base?.description || '',
      icon: node.icon || base?.icon || '',
      color: node.color || base?.color || 'bg-gradient-to-br from-slate-500 to-slate-600',
      x: node.x ?? 0,
      y: node.y ?? 0,
      temp: (config.temperature as number | undefined) ?? node.temp ?? 0.4,
      output: node.output || base?.output || node.description,
      configTabs: node.configTabs || base?.configTabs || ['config', 'prompt', 'memory', 'advanced'],
      config,
    };
  });
}
