/**
 * 示例工作流 — 与 backend-resume-nest/scripts/full-coverage-workflow.graph.cjs（v2 全节点覆盖）保持一致。
 * 设计器「示例工作流」优先从 API 读取 version=2，失败时使用此内置图。
 */

export const SAMPLE_WORKFLOW_VERSION = 2

const DEFAULT_MODEL = 'glm-4.7-flash'
const AGENT_TABS = ['config', 'prompt', 'memory', 'advanced'] as const
const TOOL_TABS = ['config', 'advanced'] as const

const BASE_AGENT_CONFIG = {
  model: DEFAULT_MODEL,
  topP: 0.9,
  maxTokens: 2048,
  outputFormat: 'json' as const,
  maxRetries: 2,
  memoryTurns: 10,
}

function agentNode(def: Record<string, unknown>) {
  const config = { ...BASE_AGENT_CONFIG, ...(def.config as object) }
  return {
    category: 'agent',
    configTabs: [...AGENT_TABS],
    config,
    ...def,
  }
}

function toolNode(def: Record<string, unknown>) {
  const config = { model: DEFAULT_MODEL, ...(def.config as object) }
  return {
    category: 'tool',
    configTabs: [...TOOL_TABS],
    config,
    ...def,
  }
}

/** 画布布局：与 full-coverage-workflow.graph.cjs NODE_LAYOUT 一致 */
const NODE_X_STEP = 320
const NODE_LAYOUT: Record<string, { x: number; y: number }> = {
  'workflow-input': { x: 80, y: 600 },
  kb: { x: 80 + NODE_X_STEP * 1, y: 600 },
  llm: { x: 80 + NODE_X_STEP * 2, y: 600 },
  edit: { x: 80 + NODE_X_STEP * 3, y: 600 },
  code: { x: 80 + NODE_X_STEP * 4, y: 600 },
  condition: { x: 80 + NODE_X_STEP * 5, y: 600 },
  optimize: { x: 80 + NODE_X_STEP * 6, y: 420 },
  loop: { x: 80 + NODE_X_STEP * 7, y: 420 },
  http: { x: 80 + NODE_X_STEP * 8, y: 280 },
  custom: { x: 80 + NODE_X_STEP * 6, y: 780 },
  aggregate: { x: 80 + NODE_X_STEP * 9, y: 600 },
  'workflow-output': { x: 80 + NODE_X_STEP * 10, y: 600 },
}

const NODE_DEFS = [
  {
    id: 'workflow-input',
    type: 'input',
    category: 'io',
    name: '输入',
    description: '接收简历与运行配置',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    config: {},
    configTabs: [] as string[],
  },
  toolNode({
    id: 'kb',
    templateId: 'kb',
    type: 'kb',
    name: '知识库',
    description: 'Knowledge base retrieval',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    config: {
      knowledgeBaseId: 'resume-industry',
      topK: 5,
      queryTemplate: '{{input.targetRole}} {{professionalSummary}}',
    },
  }),
  toolNode({
    id: 'llm',
    templateId: 'llm',
    type: 'llm',
    name: '大模型',
    description: 'LLM call',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: 'bg-gradient-to-br from-slate-500 to-slate-600',
    config: { temperature: 0.4, systemPrompt: '根据岗位与行业知识提炼简历要点。' },
  }),
  agentNode({
    id: 'edit',
    templateId: 'edit',
    type: 'editor',
    agentType: 'writer',
    name: '简历编辑智能体',
    description: '润色结构与模板适配',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    config: {
      temperature: 0.3,
      systemPrompt: '你是简历编辑专家，根据所选模板调整结构与表述，确保内容完整、格式规范。',
    },
  }),
  toolNode({
    id: 'code',
    templateId: 'code',
    type: 'code',
    name: '代码执行',
    description: 'Code execution',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    config: {
      codeLanguage: 'javascript',
      codeScript: 'return { ...input, stage: "pre-branch", workExperience: input.workExperience || [] }',
    },
  }),
  toolNode({
    id: 'condition',
    templateId: 'condition',
    type: 'condition',
    name: '条件逻辑',
    description: 'Conditional branch',
    icon: 'M8 9l4-4 4 4m0 6l-4 4-4-4',
    color: 'bg-gradient-to-br from-violet-500 to-violet-600',
    config: {
      conditionType: 'variable',
      conditionField: 'workExperience',
      conditionOperator: 'not_empty',
    },
  }),
  agentNode({
    id: 'optimize',
    templateId: 'optimize',
    type: 'optimizer',
    agentType: 'optimizer',
    name: '简历优化智能体',
    description: '优化表达与岗位匹配度',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    config: {
      temperature: 0.4,
      systemPrompt: '你是简历优化专家，突出量化成果和岗位关键词匹配。',
    },
  }),
  toolNode({
    id: 'loop',
    templateId: 'loop',
    type: 'loop',
    name: '循环',
    description: 'Loop',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    config: {
      loopType: 'forEach',
      loopArrayVariable: 'workExperience',
      maxIterations: 5,
    },
  }),
  toolNode({
    id: 'http',
    templateId: 'http',
    type: 'http',
    name: 'HTTP 请求',
    description: 'HTTP Request',
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    config: {
      method: 'POST',
      endpoint: '/api/external/enrich',
      bodyTemplate: '{\n  "experience": "{{__loopItem}}"\n}',
    },
  }),
  agentNode({
    id: 'custom',
    templateId: 'custom',
    type: 'custom',
    agentType: 'writer',
    name: '自定义智能体',
    description: '按自定义提示词处理简历',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    config: {
      temperature: 0.3,
      systemPrompt: '工作经历较少时，补充项目与技能亮点，保持表述简洁专业。',
    },
  }),
  toolNode({
    id: 'aggregate',
    templateId: 'aggregate',
    type: 'aggregate',
    name: '变量聚合',
    description: 'Variable aggregation',
    icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z',
    color: 'bg-gradient-to-br from-teal-500 to-teal-600',
    config: {
      aggregateStrategy: 'merge',
      aggregateInputs: 'kb,edit,optimize,custom,__loopResults',
      aggregateOutput: 'merged',
    },
  }),
  {
    id: 'workflow-output',
    type: 'output',
    category: 'io',
    name: '输出',
    description: '输出最终简历结果',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 4l4 4m0 0l4-4m-4 4V4',
    color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    config: {},
    configTabs: [] as string[],
  },
]

const CONNECTION_DEFS = [
  { id: 'c-main-1', from: 'workflow-input', to: 'kb' },
  { id: 'c-main-2', from: 'kb', to: 'llm' },
  { id: 'c-main-3', from: 'llm', to: 'edit' },
  { id: 'c-main-4', from: 'edit', to: 'code' },
  { id: 'c-main-5', from: 'code', to: 'condition' },
  { id: 'c-cond-true', from: 'condition', to: 'optimize', fromPort: 'true' },
  { id: 'c-cond-false', from: 'condition', to: 'custom', fromPort: 'false' },
  { id: 'c-opt-loop', from: 'optimize', to: 'loop' },
  { id: 'c-loop-body', from: 'loop', to: 'http', fromPort: 'loop' },
  { id: 'c-loop-done', from: 'loop', to: 'aggregate', fromPort: 'done' },
  { id: 'c-custom-agg', from: 'custom', to: 'aggregate' },
  { id: 'c-agg-out', from: 'aggregate', to: 'workflow-output' },
]

export interface SampleWorkflowPayload {
  name: string
  description: string
  config: Record<string, unknown>
  nodes: unknown[]
  connections: unknown[]
}

export function buildFullCoverageSampleWorkflow(): SampleWorkflowPayload {
  const nodes = NODE_DEFS.map((def) => {
    const layout = NODE_LAYOUT[String(def.id)] || { x: 0, y: 600 }
    const config = (def.config || {}) as Record<string, unknown>
    const temperature = typeof config.temperature === 'number' ? config.temperature : 0
    return {
      id: def.id,
      templateId: (def as { templateId?: string }).templateId,
      type: def.type,
      agentType: (def as { agentType?: string }).agentType,
      category: def.category,
      name: def.name,
      description: def.description,
      icon: def.icon,
      color: def.color,
      x: layout.x,
      y: layout.y,
      temp: temperature,
      output: def.description,
      configTabs: def.configTabs || [],
      config,
    }
  })

  const connections = CONNECTION_DEFS.map((conn) => ({
    ...conn,
    fromPort: conn.fromPort || 'default',
    toPort: 'default',
  }))

  return {
    name: '全节点覆盖工作流',
    description: '主链预处理 → 条件分支（是/否）→ 循环体迭代 → 聚合输出；覆盖全部智能体与工具节点',
    config: { workflowType: 'resume_full_coverage' },
    nodes,
    connections,
  }
}

/** @deprecated 使用 buildFullCoverageSampleWorkflow() */
export const SAMPLE_WORKFLOW = buildFullCoverageSampleWorkflow()

export async function resolveSampleWorkflowPayload(deps: {
  listVersions: () => Promise<{ success: boolean; data?: { versions?: Array<{ id: number; version: number }> } }>
  getVersion: (versionId: number) => Promise<{
    success: boolean
    data?: {
      name?: string
      description?: string
      config?: Record<string, unknown>
      nodes?: unknown
      connections?: unknown
    }
  }>
}): Promise<SampleWorkflowPayload> {
  const fallback = buildFullCoverageSampleWorkflow()
  try {
    const listResult = await deps.listVersions()
    const versions = listResult.success ? listResult.data?.versions ?? [] : []
    const v2 = versions.find((item) => item.version === SAMPLE_WORKFLOW_VERSION)
    if (!v2?.id) return fallback

    const detailResult = await deps.getVersion(v2.id)
    const data = detailResult.success ? detailResult.data : null
    const nodes = Array.isArray(data?.nodes) ? data.nodes : []
    const connections = Array.isArray(data?.connections) ? data.connections : []
    if (nodes.length === 0) return fallback

    return {
      name: data?.name || fallback.name,
      description: data?.description || fallback.description,
      config: (data?.config as Record<string, unknown>) || fallback.config,
      nodes,
      connections,
    }
  } catch (error) {
    console.warn('读取 v2 工作流失败，使用内置全节点覆盖图', error)
    return fallback
  }
}
