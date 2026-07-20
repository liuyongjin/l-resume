import { MultiagentService } from '../multiagent/multiagent.service';
import {
  extractWorkflowResumeData,
  extractWorkflowResumeRecordPatch,
  extractTranslatedResumeData,
  mergeIntoTemplateScaffold,
} from '../common/resume-data.util';
import { applyResumeRecordPatch, WorkflowResumeRecord, WorkflowResumeRecordPatch } from '../common/resume-record.util';
import { executeToolNode } from './workflow-tool-runner';
import { WorkflowExecutionLogger, buildAgentStepInput, buildToolStepInput, summarizeResumePayload, buildResumeSectionsDetail, buildResumeNodeStepPayload, buildAgentResultSummary, pickResumeTitle } from './workflow-execution.logger';
import { WorkflowRunContext, WorkflowStepLogRecord } from './workflow-execution.types';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { buildNodeAgentConfig, resolveAgentType } from './workflow-node.util';
import {
  WorkflowGraphConnection,
  collectLoopBodyNodeIds,
  getLoopBodyExecutionOrder,
  getNextNodeIds,
  getWorkflowExecutionOrder,
} from './workflow-graph.traversal';
import { collectAllLoopBodyNodeIds, normalizeWorkflowConnections } from './workflow-graph.normalize';

export { getWorkflowExecutionOrder };

export interface WorkflowNodeRunDeps {
  multiagent: MultiagentService;
  userId: number;
  executeDto: ExecuteWorkflowDto;
  templateThemeKey: string;
  targetRole: string;
}

async function executeAgentNode(
  node: any,
  context: WorkflowRunContext,
  deps: WorkflowNodeRunDeps,
): Promise<{
  resumeData: Record<string, unknown>;
  resumeRecordPatch: WorkflowResumeRecordPatch;
  agentResultSummary: Record<string, unknown>;
}> {
  const agentType = resolveAgentType(node);
  const nodeAgentConfigs = buildNodeAgentConfig(node);

  const result = await deps.multiagent.runWorkflowNode(deps.userId, {
    node: {
      id: node.id,
      type: node.type,
      agentType: node.agentType || agentType,
      name: node.name,
      description: node.description,
      config: node.config || {},
    },
    resumeData: context.resumeData,
    resumeRecord: context.resumeRecord,
    targetRole: deps.targetRole,
    templateId: deps.templateThemeKey,
    industry: deps.executeDto.industry || '互联网',
    experienceLevel: deps.executeDto.experienceLevel || 'mid',
    styles: deps.executeDto.styles || ['专业版'],
    agentConfigs: nodeAgentConfigs,
  });

  const merged = extractWorkflowResumeData(result);
  const promptText = [
    node.config?.systemPrompt,
    node.description,
    node.config?.system_prompt,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join('\n');

  const resumeRecordPatch = extractWorkflowResumeRecordPatch(result, {
    systemPrompt: promptText || undefined,
  }) as WorkflowResumeRecordPatch;
  return {
    resumeData: mergeIntoTemplateScaffold(context.resumeData, merged, {
      preferParsedOnly: true,
      preserveExistingFields: true,
    }),
    resumeRecordPatch,
    agentResultSummary: buildAgentResultSummary(result),
  };
}

function applyToolOutput(node: any, context: WorkflowRunContext, output: unknown): Record<string, unknown> {
  const templateKey = node.templateId || String(node.id || '').split('_')[0];
  const next: Record<string, unknown> = { ...context.resumeData };

  if (output && typeof output === 'object' && !Array.isArray(output)) {
    Object.assign(next, output as Record<string, unknown>);
  }

  next[`${node.id}Output`] = output;
  if (templateKey) {
    next[`${templateKey}Output`] = output;
  }

  return next;
}

function executeToolLikeNode(node: any, context: WorkflowRunContext): Record<string, unknown> {
  const toolResult = executeToolNode({
    type: node.type,
    config: node.config || {},
    input: context.resumeData,
  });

  if (!toolResult.success) {
    throw new Error(toolResult.message || `工具节点 ${node.name} 执行失败`);
  }

  return applyToolOutput(node, context, toolResult.output);
}

function isToolLikeNode(node: any): boolean {
  return (
    node.category === 'tool' ||
    ['llm', 'kb', 'http', 'code', 'condition', 'loop', 'aggregate'].includes(node.type)
  );
}

async function runSingleNode(
  node: any,
  context: WorkflowRunContext,
  deps: WorkflowNodeRunDeps,
  logger: WorkflowExecutionLogger,
  stepLogs: WorkflowStepLogRecord[],
  options?: { stepKeySuffix?: string },
): Promise<void> {
  const resumeTitle = pickResumeTitle(context.resumeRecord, context.meta);
  const stepKey = options?.stepKeySuffix
    ? `node:${node.id}:${options.stepKeySuffix}`
    : `node:${node.id}`;

  if (node.type === 'input') {
    const { log } = await logger.runStep(
      {
        stepKey,
        stepName: node.name || '输入节点',
        stepCategory: 'system',
        nodeId: node.id,
        inputData: buildResumeNodeStepPayload({
          nodeType: node.type,
          resumeData: context.resumeData,
          resumeTitle,
          extra: { executeConfig: context.meta, note: '传入合并模板后的简历数据' },
        }),
      },
      async () => context.resumeData,
      (result) =>
        buildResumeNodeStepPayload({
          nodeType: node.type,
          resumeData: result,
          resumeTitle: pickResumeTitle(context.resumeRecord, context.meta),
          extra: { note: '原样输出合并模板后的简历数据' },
        }),
    );
    stepLogs.push(log);
    return;
  }

  if (node.type === 'output') {
    const { log } = await logger.runStep(
      {
        stepKey,
        stepName: node.name || '输出节点',
        stepCategory: 'system',
        nodeId: node.id,
        inputData: buildResumeNodeStepPayload({
          nodeType: node.type,
          resumeData: context.resumeData,
          resumeTitle,
          extra: { note: '接收智能体处理后的最终简历数据' },
        }),
      },
      async () => context.resumeData,
      (result) =>
        buildResumeNodeStepPayload({
          nodeType: node.type,
          resumeData: result,
          resumeTitle: pickResumeTitle(context.resumeRecord, context.meta),
          extra: { note: '输出最终简历数据供后续保存/翻译' },
        }),
    );
    stepLogs.push(log);
    return;
  }

  if (isToolLikeNode(node)) {
    const { result, log } = await logger.runStep(
      {
        stepKey,
        stepName: node.name || `工具节点 (${node.type})`,
        stepCategory: node.type === 'llm' ? 'llm' : 'tool',
        nodeId: node.id,
        inputData: buildToolStepInput({
          type: node.type,
          config: node.config,
          input: context.resumeData,
          resumeTitle,
        }),
      },
      async () => executeToolLikeNode(node, context),
      (result) => ({
        toolType: node.type,
        message: '工具节点执行完成',
        resumeTitle: pickResumeTitle(context.resumeRecord, context.meta),
        resumeSummary: summarizeResumePayload(result, pickResumeTitle(context.resumeRecord, context.meta)),
        resumeSections: buildResumeSectionsDetail(result),
        resumeData: result,
      }),
    );
    context.resumeData = result;
    stepLogs.push(log);
    return;
  }

  const { result, log } = await logger.runStep(
    {
      stepKey,
      stepName: node.name || `智能体节点 (${node.agentType || node.type})`,
      stepCategory: 'agent',
      nodeId: node.id,
      inputData: buildAgentStepInput({
        nodeId: node.id,
        nodeName: node.name,
        agentType: node.agentType || resolveAgentType(node),
        nodeType: node.type,
        config: node.config,
        resumeSummary: summarizeResumePayload(context.resumeData, resumeTitle),
        resumeData: context.resumeData,
        resumeTitle,
      }),
    },
    async () => executeAgentNode(node, context, deps),
    (agentResult) => ({
      agentType: node.agentType || resolveAgentType(node),
      resumeRecordPatch: agentResult.resumeRecordPatch,
      resumeTitle: agentResult.resumeRecordPatch?.title || resumeTitle,
      resumeSummary: summarizeResumePayload(
        agentResult.resumeData,
        agentResult.resumeRecordPatch?.title || resumeTitle,
      ),
      resumeSections: buildResumeSectionsDetail(agentResult.resumeData),
      resumeData: agentResult.resumeData,
      agentResultSummary: agentResult.agentResultSummary,
    }),
  );
  context.resumeData = result.resumeData;
  if (result.resumeRecordPatch && Object.keys(result.resumeRecordPatch).length > 0) {
    context.resumeRecord = applyResumeRecordPatch(context.resumeRecord, result.resumeRecordPatch, {
      preferParsedOnly: true,
    });
    if (result.resumeRecordPatch.title) {
      context.meta = { ...context.meta, resumeTitle: result.resumeRecordPatch.title };
    }
  }
  stepLogs.push(log);
}

async function runLoopBodyIterations(
  loopNode: any,
  loopOutput: Record<string, unknown>,
  bodyNodeIds: string[],
  nodeMap: Map<string, any>,
  connections: WorkflowGraphConnection[],
  baseContext: WorkflowRunContext,
  deps: WorkflowNodeRunDeps,
  logger: WorkflowExecutionLogger,
  stepLogs: WorkflowStepLogRecord[],
  executed: Set<string>,
): Promise<void> {
  const iterations = Array.isArray(loopOutput.iterations) ? loopOutput.iterations : [];
  const bodyOrder = getLoopBodyExecutionOrder(bodyNodeIds, connections, nodeMap) as any[];

  if (bodyOrder.length === 0 || iterations.length === 0) return;

  const iterationResults: unknown[] = [];

  for (let index = 0; index < iterations.length; index += 1) {
    const loopItem = iterations[index];
    const iterationContext: WorkflowRunContext = {
      ...baseContext,
      resumeData: {
        ...baseContext.resumeData,
        __loopIndex: index,
        __loopItem: loopItem,
        __loopIteration: loopItem,
      },
      resumeRecord: { ...(baseContext.resumeRecord || {}) },
    };

    for (const bodyNode of bodyOrder) {
      await runSingleNode(bodyNode, iterationContext, deps, logger, stepLogs, {
        stepKeySuffix: `iter${index + 1}`,
      });
      executed.add(bodyNode.id);
    }

    iterationResults.push({
      index,
      item: loopItem,
      resumeData: iterationContext.resumeData,
    });
  }

  baseContext.resumeData = {
    ...baseContext.resumeData,
    __loopResults: iterationResults,
    __loopCount: iterationResults.length,
    [`${loopNode.id}Output`]: {
      ...loopOutput,
      iterationResults,
    },
  };

  const lastResult = iterationResults[iterationResults.length - 1] as
    | { resumeData?: Record<string, unknown> }
    | undefined;
  if (lastResult?.resumeData) {
    Object.assign(baseContext.resumeData, lastResult.resumeData);
  }
}

export async function runWorkflowGraph(params: {
  logger: WorkflowExecutionLogger;
  nodes: any[];
  connections: WorkflowGraphConnection[];
  context: WorkflowRunContext;
  deps: WorkflowNodeRunDeps;
}): Promise<{ context: WorkflowRunContext; stepLogs: WorkflowStepLogRecord[] }> {
  const stepLogs: WorkflowStepLogRecord[] = [];
  const context: WorkflowRunContext = {
    ...params.context,
    resumeData: { ...params.context.resumeData },
    resumeRecord: { ...(params.context.resumeRecord || {}) },
  };

  const nodeMap = new Map(params.nodes.map((node) => [node.id, node]));
  const connections = normalizeWorkflowConnections(params.nodes, params.connections || []);
  const loopBodyIds = collectAllLoopBodyNodeIds(params.nodes, connections);
  const executed = new Set<string>();

  const walk = async (nodeId: string): Promise<void> => {
    if (executed.has(nodeId)) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;

    await runSingleNode(node, context, params.deps, params.logger, stepLogs);
    executed.add(nodeId);

    if (node.type === 'condition') {
      const branchOutput = context.resumeData[`${node.id}Output`] as { matched?: boolean } | undefined;
      const matched = branchOutput?.matched === true;
      const activePort = matched ? 'true' : 'false';
      const nextIds = getNextNodeIds(nodeId, connections, activePort);
      for (const nextId of nextIds) {
        await walk(nextId);
      }
      return;
    }

    if (node.type === 'loop') {
      const loopOutput = context.resumeData[`${node.id}Output`] as Record<string, unknown> | undefined;
      const bodyNodeIds = collectLoopBodyNodeIds(nodeId, connections);
      if (loopOutput && bodyNodeIds.length > 0) {
        await runLoopBodyIterations(
          node,
          loopOutput,
          bodyNodeIds,
          nodeMap,
          connections,
          context,
          params.deps,
          params.logger,
          stepLogs,
          executed,
        );
      }

      const doneNextIds = getNextNodeIds(nodeId, connections, 'done');
      for (const nextId of doneNextIds) {
        await walk(nextId);
      }
      return;
    }

    const nextIds = getNextNodeIds(nodeId, connections, 'default').filter(
      (nextId) => !loopBodyIds.has(nextId),
    );
    for (const nextId of nextIds) {
      await walk(nextId);
    }
  };

  const inputNode = params.nodes.find((node) => node.type === 'input');
  if (inputNode) {
    await walk(inputNode.id);
  } else if (params.nodes.length > 0) {
    await walk(params.nodes[0].id);
  }

  return { context, stepLogs };
}

export async function runTranslateStep(params: {
  logger: WorkflowExecutionLogger;
  multiagent: MultiagentService;
  userId: number;
  resumeData: Record<string, unknown>;
  targetLanguage: 'en' | 'zh';
  resumeTitle?: string;
}): Promise<{ data: Record<string, unknown>; log: WorkflowStepLogRecord }> {
  const { result, log } = await params.logger.runStep(
    {
      stepKey: `translate:${params.targetLanguage}`,
      stepName: params.targetLanguage === 'en' ? '翻译为英文' : '翻译为中文',
      stepCategory: 'api',
      inputData: {
        api: { method: 'POST', path: '/api/multiagent/translate' },
        requestBody: {
          targetLanguage: params.targetLanguage,
          resumeTitle: params.resumeTitle,
          resumeSummary: summarizeResumePayload(params.resumeData, params.resumeTitle),
        },
        resumeTitle: params.resumeTitle,
        resumeSections: buildResumeSectionsDetail(params.resumeData),
      },
    },
    async () =>
      params.multiagent.translate(params.userId, {
        resumeData: params.resumeData,
        targetLanguage: params.targetLanguage,
      }),
    (translateResult) => {
      const translated = extractTranslatedResumeData(translateResult) as Record<string, unknown>;
      return {
        targetLanguage: params.targetLanguage,
        resumeTitle: params.resumeTitle,
        resumeSummary: summarizeResumePayload(translated, params.resumeTitle),
        resumeSections: buildResumeSectionsDetail(translated),
        resumeData: translated,
        rawResponseKeys: translateResult && typeof translateResult === 'object' ? Object.keys(translateResult as object) : [],
      };
    },
  );

  return {
    data: extractTranslatedResumeData(result) as Record<string, unknown>,
    log,
  };
}
