import {
  WorkflowDesignerOptions,
  WorkflowNodeCategory,
  WorkflowNodeLibraryResponse,
  WorkflowNodeTemplate,
} from './workflow-node.types';
import { DEFAULT_LLM_MODEL_ID, getNestRuntimeConfig, getWorkflowNodeDefaults } from './llm-models.constants';

const NEST_RUNTIME = getNestRuntimeConfig();

const DEFAULT_CONFIG = {
  model: DEFAULT_LLM_MODEL_ID,
  ...getWorkflowNodeDefaults(),
};

const AGENT_TABS: WorkflowNodeTemplate['configTabs'] = ['config', 'prompt', 'memory', 'advanced'];
const TOOL_TABS: WorkflowNodeTemplate['configTabs'] = ['config', 'advanced'];

function agent(partial: Omit<WorkflowNodeTemplate, 'category' | 'configTabs'> & { config?: Partial<WorkflowNodeTemplate['config']> }): WorkflowNodeTemplate {
  return {
    ...partial,
    category: 'agent',
    configTabs: AGENT_TABS,
    config: { ...DEFAULT_CONFIG, temperature: partial.temp, ...partial.config },
  };
}

function tool(partial: Omit<WorkflowNodeTemplate, 'category' | 'configTabs' | 'config'> & { config?: Partial<WorkflowNodeTemplate['config']> }): WorkflowNodeTemplate {
  return {
    ...partial,
    category: 'tool',
    configTabs: TOOL_TABS,
    config: { ...DEFAULT_CONFIG, temperature: partial.temp, ...partial.config },
  };
}

/** 智能体节点库 — 与前端 designer 左侧「智能体」分类一致 */
export const AGENT_NODE_TEMPLATES: WorkflowNodeTemplate[] = [
  agent({
    id: 'edit',
    type: 'editor',
    agentType: 'writer',
    name: '简历编辑智能体',
    description: '润色结构与模板适配',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    temp: 0.3,
    output: 'Edited resume content',
    config: { systemPrompt: '你是简历编辑专家，根据所选模板调整结构与表述，确保内容完整、格式规范。' },
  }),
  agent({
    id: 'optimize',
    type: 'optimizer',
    agentType: 'optimizer',
    name: '简历优化智能体',
    description: '优化表达与岗位匹配度',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    temp: 0.4,
    output: 'Optimized resume content',
    config: { systemPrompt: '你是简历优化专家，突出量化成果和岗位关键词匹配。' },
  }),
  agent({
    id: 'custom',
    type: 'custom',
    agentType: 'writer',
    name: '自定义智能体',
    description: '按自定义提示词处理简历',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    temp: 0.3,
    output: 'Custom output',
    config: { systemPrompt: '你是可配置的简历处理智能体，请根据用户指令完成任务。' },
  }),
];

/** 工具节点库 — 与前端 designer 左侧「工具」分类一致 */
export const TOOL_NODE_TEMPLATES: WorkflowNodeTemplate[] = [
  tool({
    id: 'llm',
    type: 'llm',
    name: '大模型',
    description: 'LLM call',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: 'bg-gradient-to-br from-slate-500 to-slate-600',
    temp: 0.4,
    output: 'LLM response',
    config: { systemPrompt: '调用大模型完成指定任务。' },
  }),
  tool({
    id: 'kb',
    type: 'kb',
    name: '知识库',
    description: 'Knowledge base retrieval',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    temp: 0.75,
    output: 'Retrieved context',
    config: {
      knowledgeBaseId: 'resume-industry',
      topK: 5,
      scoreThreshold: 0.6,
      queryTemplate: '{{input.targetRole}} {{input.summary}}',
      systemPrompt: '根据检索到的知识片段增强简历内容。',
    },
  }),
  tool({
    id: 'http',
    type: 'http',
    name: 'HTTP 请求',
    description: 'HTTP Request',
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    temp: 0,
    output: 'HTTP response',
    config: {
      method: 'POST',
      endpoint: '/api/external/enrich',
      headers: '{\n  "Content-Type": "application/json"\n}',
      bodyTemplate: '{\n  "resume": "{{input}}"\n}',
      timeoutMs: NEST_RUNTIME.httpToolTimeoutMs,
    },
  }),
  tool({
    id: 'code',
    type: 'code',
    name: '代码执行',
    description: 'Code execution',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    temp: 0,
    output: 'Code result',
    config: {
      codeLanguage: 'javascript',
      inputVariable: 'input',
      outputVariable: 'result',
      codeScript: 'return { ...input, processed: true }',
    },
  }),
  tool({
    id: 'condition',
    type: 'condition',
    name: '条件逻辑',
    description: 'Conditional branch',
    icon: 'M8 9l4-4 4 4m0 6l-4 4-4-4',
    color: 'bg-gradient-to-br from-violet-500 to-violet-600',
    temp: 0,
    output: 'Branch result',
    config: {
      conditionType: 'variable',
      conditionField: 'input.score',
      conditionOperator: 'gte',
      conditionValue: '0.7',
      conditionExpression: 'input.score >= 0.7',
    },
  }),
  tool({
    id: 'loop',
    type: 'loop',
    name: '循环',
    description: 'Loop',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    temp: 0,
    output: 'Loop output',
    config: {
      loopType: 'forEach',
      loopArrayVariable: 'input.versions',
      maxIterations: 10,
      breakCondition: 'iteration.index >= input.versions.length',
    },
  }),
  tool({
    id: 'aggregate',
    type: 'aggregate',
    name: '变量聚合',
    description: 'Variable aggregation',
    icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z',
    color: 'bg-gradient-to-br from-teal-500 to-teal-600',
    temp: 0,
    output: 'Aggregated vars',
    config: {
      aggregateStrategy: 'merge',
      aggregateInputs: 'optimize,edit',
      aggregateOutput: 'merged',
      aggregateSeparator: '\n---\n',
    },
  }),
];

export const DESIGNER_OPTIONS: WorkflowDesignerOptions = {
  models: [],
  outputFormats: [
    { label: 'Structured Text (JSON)', value: 'json' },
    { label: 'Plain Text', value: 'text' },
    { label: 'Markdown', value: 'markdown' },
  ],
  knowledgeBases: [
    { label: '简历行业知识库', value: 'resume-industry' },
    { label: '岗位 JD 模板库', value: 'job-descriptions' },
    { label: '技能标签库', value: 'skill-tags' },
    { label: '面试题库', value: 'interview-qa' },
  ],
  httpMethods: [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' },
  ],
  codeLanguages: [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
  ],
  conditionOperators: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '大于', value: 'gt' },
    { label: '大于等于', value: 'gte' },
    { label: '小于', value: 'lt' },
    { label: '小于等于', value: 'lte' },
    { label: '包含', value: 'contains' },
    { label: '为空', value: 'empty' },
    { label: '不为空', value: 'not_empty' },
  ],
  loopTypes: [
    { label: '遍历数组 (forEach)', value: 'forEach' },
    { label: '条件循环 (while)', value: 'while' },
    { label: '固定次数 (count)', value: 'count' },
  ],
  aggregateStrategies: [
    { label: '深度合并 (merge)', value: 'merge' },
    { label: '文本拼接 (concat)', value: 'concat' },
    { label: '取第一个', value: 'first' },
    { label: '取最后一个', value: 'last' },
  ],
  defaultConfig: DEFAULT_CONFIG,
};

/** 设计器左侧面板展示全部智能体 */
export function getNodeLibrary(): WorkflowNodeLibraryResponse {
  const categories: WorkflowNodeCategory[] = [
    { key: 'agent', name: '智能体', nodes: AGENT_NODE_TEMPLATES },
    { key: 'tool', name: '工具', nodes: TOOL_NODE_TEMPLATES },
  ];
  return { categories, options: DESIGNER_OPTIONS };
}

export function getTemplateById(templateId: string): WorkflowNodeTemplate | undefined {
  return [...AGENT_NODE_TEMPLATES, ...TOOL_NODE_TEMPLATES].find((n) => n.id === templateId);
}
