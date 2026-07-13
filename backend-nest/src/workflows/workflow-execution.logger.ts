import { randomUUID } from 'crypto';
import { WorkflowExecution } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkflowStepCategory,
  WorkflowStepLogInput,
  WorkflowStepLogRecord,
} from './workflow-execution.types';
import { WorkflowExecutionCancelledError } from './workflow-execution-run.helper';

export type ExecutionRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export function estimateExecutionStepCount(params: {
  templateCount: number;
  outputLanguages: ('zh' | 'en')[];
  nodeCount: number;
  skipWorkflowGraph: boolean;
  saveToDatabase?: boolean;
}): number {
  const { templateCount, outputLanguages, nodeCount, skipWorkflowGraph, saveToDatabase = true } =
    params;

  // init + parse + complete（health 在 execute 同步阶段已检查，不再重复）
  let total = 3;

  for (let i = 0; i < templateCount; i += 1) {
    total += 1; // template merge
    total += skipWorkflowGraph ? 1 : nodeCount; // passthrough or graph nodes
    if (outputLanguages.includes('en')) total += 1; // translate
    if (saveToDatabase !== false) total += outputLanguages.length; // save per language
  }

  return total;
}

export function buildExecutionStatusFromLogs(stepLogs: WorkflowStepLogRecord[]): {
  status: ExecutionRunStatus;
  progress: number;
  savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>;
  workflowOutputs: Array<{ templateId: string; lang: string; data: Record<string, unknown> }>;
  errorMessage?: string;
} {
  const hasComplete = stepLogs.some((log) => log.stepKey === 'execute.complete');
  const hasCancelled = stepLogs.some((log) => log.stepKey === 'execute.cancelled');
  const failedLog = [...stepLogs].reverse().find((log) => log.status === 'failed');
  const completeLog = stepLogs.find((log) => log.stepKey === 'execute.complete');
  const cancelledLog = stepLogs.find((log) => log.stepKey === 'execute.cancelled');

  let status: ExecutionRunStatus = 'running';
  if (hasComplete) status = 'completed';
  else if (hasCancelled) status = 'cancelled';
  else if (failedLog) status = 'failed';

  const initLog = stepLogs.find((log) => log.stepKey === 'execute.init');
  const plannedTotal =
    typeof initLog?.outputData?.expectedStepCount === 'number'
      ? initLog.outputData.expectedStepCount
      : typeof initLog?.inputData?.expectedStepCount === 'number'
        ? initLog.inputData.expectedStepCount
        : stepLogs.length;
  const completed = stepLogs.filter((log) => log.status === 'completed').length;
  const runningBonus = stepLogs.some((log) => log.status === 'running') ? 0.5 : 0;
  const denominator = Math.max(plannedTotal, stepLogs.length, 1);
  const progress =
    status === 'completed'
      ? 100
      : status === 'cancelled'
        ? Math.min(99, Math.round((completed / denominator) * 100))
      : Math.min(99, Math.round(((completed + runningBonus) / denominator) * 100));

  const completeOutput = (completeLog?.outputData || {}) as Record<string, unknown>;
  const savedResumes = Array.isArray(completeOutput.savedResumes)
    ? (completeOutput.savedResumes as Array<{ id: number; title: string; templateId: string; lang: string }>)
    : [];
  const workflowOutputs = Array.isArray(completeOutput.workflowOutputs)
    ? (completeOutput.workflowOutputs as Array<{ templateId: string; lang: string; data: Record<string, unknown> }>)
    : [];

  const failedOutputLog = stepLogs.find((log) => log.stepKey === 'execute.failed');
  const failedOutputMessage =
    typeof failedOutputLog?.outputData?.error === 'string'
      ? failedOutputLog.outputData.error
      : typeof failedOutputLog?.inputData?.error === 'string'
        ? failedOutputLog.inputData.error
        : undefined;

  return {
    status,
    progress,
    savedResumes,
    workflowOutputs,
    errorMessage:
      cancelledLog?.error ||
      (typeof cancelledLog?.outputData?.message === 'string' ? cancelledLog.outputData.message : undefined) ||
      failedLog?.error ||
      failedOutputMessage ||
      undefined,
  };
}

export class WorkflowExecutionLogger {
  private stepOrder = 0;
  readonly executionGroupId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userId: number,
    private readonly workflowId: number,
    private readonly resumeId?: number | null,
    executionGroupId?: string,
  ) {
    this.executionGroupId = executionGroupId || randomUUID();
  }

  private toRecord(row: WorkflowExecution): WorkflowStepLogRecord {
    return {
      id: row.id,
      executionGroupId: row.executionGroupId || this.executionGroupId,
      workflowId: row.workflowId || this.workflowId,
      stepOrder: row.stepOrder || 0,
      stepKey: row.stepKey || '',
      stepName: row.stepName || '',
      nodeId: row.nodeId,
      stepCategory: row.stepCategory || 'system',
      status: row.status,
      inputData: (row.inputData as Record<string, unknown>) || {},
      outputData: (row.outputData as Record<string, unknown>) || null,
      error: row.error,
      durationMs: row.durationMs,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    };
  }

  async runStep<T>(
    step: WorkflowStepLogInput,
    handler: () => Promise<T>,
    serializeOutput: (result: T) => Record<string, unknown> = (result) =>
      (result && typeof result === 'object' ? (result as Record<string, unknown>) : { value: result }),
  ): Promise<{ result: T; log: WorkflowStepLogRecord }> {
    await this.assertNotCancelled();
    this.stepOrder += 1;
    const startedAt = new Date();
    const record = await this.prisma.workflowExecution.create({
      data: {
        userId: this.userId,
        resumeId: this.resumeId ?? null,
        workflowId: this.workflowId,
        executionGroupId: this.executionGroupId,
        stepOrder: this.stepOrder,
        stepKey: step.stepKey,
        stepName: step.stepName,
        nodeId: step.nodeId ?? null,
        stepCategory: step.stepCategory,
        status: 'running',
        inputData: step.inputData as any,
        startedAt,
      },
    });

    try {
      const result = await handler();
      const completedAt = new Date();
      const updated = await this.prisma.workflowExecution.update({
        where: { id: record.id },
        data: {
          status: 'completed',
          outputData: serializeOutput(result) as any,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
        },
      });
      return { result, log: this.toRecord(updated) };
    } catch (error) {
      const completedAt = new Date();
      const message = error instanceof Error ? error.message : String(error);
      const updated = await this.prisma.workflowExecution.update({
        where: { id: record.id },
        data: {
          status: 'failed',
          error: message,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
        },
      });
      throw Object.assign(error instanceof Error ? error : new Error(message), {
        stepLog: this.toRecord(updated),
      });
    }
  }

  async listLogs(): Promise<WorkflowStepLogRecord[]> {
    const rows = await this.prisma.workflowExecution.findMany({
      where: {
        userId: this.userId,
        executionGroupId: this.executionGroupId,
      },
      orderBy: { stepOrder: 'asc' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  private async assertNotCancelled(): Promise<void> {
    const run = await this.prisma.workflowExecutionRun.findUnique({
      where: { id: this.executionGroupId },
      select: { status: true },
    });
    if (run?.status === 'cancelled') {
      throw new WorkflowExecutionCancelledError();
    }
  }
}

export function summarizeResumePayload(
  data: unknown,
  resumeTitle?: string,
): Record<string, unknown> {
  if (!data || typeof data !== 'object') return { empty: true, ...(resumeTitle ? { resumeTitle } : {}) };
  const record = data as Record<string, unknown>;
  const basic = (record.basicInfo as Record<string, unknown>) || {};
  return {
    keys: Object.keys(record),
    name: basic.name || '',
    position: basic.position || basic.title || '',
    rawTextLength: typeof record.rawText === 'string' ? record.rawText.length : 0,
    summaryLength:
      typeof record.professionalSummary === 'string' ? record.professionalSummary.length : 0,
    ...(resumeTitle ? { resumeTitle } : {}),
  };
}

export function pickResumeTitle(
  record?: { title?: string | null } | null,
  meta?: { resumeTitle?: string; sourceResumeTitle?: string } | null,
): string | undefined {
  const fromAgent = typeof meta?.resumeTitle === 'string' ? meta.resumeTitle.trim() : '';
  if (fromAgent) return fromAgent;

  const fromSource = typeof meta?.sourceResumeTitle === 'string' ? meta.sourceResumeTitle.trim() : '';
  if (fromSource) return fromSource;

  const fromRecord = typeof record?.title === 'string' ? record.title.trim() : '';
  if (fromRecord) return fromRecord;

  return undefined;
}

const RESUME_SECTION_LABELS: Record<string, string> = {
  basicInfo: '基本信息',
  professionalSummary: '个人简介',
  workExperience: '工作经历',
  projectExperience: '项目经历',
  education: '教育经历',
  skills: '技能特长',
  certificates: '证书资质',
  campusActivity: '校园活动',
  openSourceProject: '开源项目',
  github: 'GitHub',
  portfolio: '作品集',
  dataProjects: '数据项目',
  productAchievements: '产品成果',
  publications: '出版物',
  otherTags: '其他标签',
  githubDesc: 'GitHub 简介',
};

const BASIC_INFO_FIELD_LABELS: Record<string, string> = {
  name: '姓名',
  avatar: '头像',
  showAvatar: '显示头像',
  position: '职位',
  phone: '电话',
  email: '邮箱',
  city: '城市',
  gender: '性别',
  age: '年龄',
  workExperience: '工作年限',
  ethnicity: '民族',
  github: 'GitHub',
  homepage: '主页',
  currentStatus: '当前状态',
  nativePlace: '籍贯',
};

const ARRAY_ITEM_FIELD_LABELS: Record<string, Record<string, string>> = {
  workExperience: {
    company: '公司',
    position: '职位',
    startDate: '开始时间',
    endDate: '结束时间',
    description: '描述',
  },
  projectExperience: {
    name: '项目名称',
    role: '角色',
    startDate: '开始时间',
    endDate: '结束时间',
    description: '描述',
    techStack: '技术栈',
  },
  education: {
    school: '学校',
    major: '专业',
    degree: '学历',
    startDate: '开始时间',
    endDate: '结束时间',
  },
  certificates: {
    name: '证书名称',
    issuer: '颁发机构',
    date: '日期',
  },
};

function truncatePreview(value: unknown, max = 120): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
  }
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return `[${value.length} 项]`;
  try {
    const text = JSON.stringify(value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  } catch {
    return String(value);
  }
}

function isPopulatedValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return false;
}

function buildBasicInfoFields(basicInfo: Record<string, unknown>) {
  return Object.entries(basicInfo)
    .map(([key, value]) => ({
      key,
      label: BASIC_INFO_FIELD_LABELS[key] || key,
      value: truncatePreview(value, 200),
      populated: isPopulatedValue(value),
    }))
    .filter((field) => field.populated);
}

function buildArraySectionItems(sectionKey: string, items: unknown[]) {
  const fieldLabels = ARRAY_ITEM_FIELD_LABELS[sectionKey] || {};
  return items.slice(0, 8).map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { index, fields: [{ key: 'value', label: '内容', value: truncatePreview(item, 200) }] };
    }
    const record = item as Record<string, unknown>;
    const fields = Object.entries(record)
      .map(([key, value]) => ({
        key,
        label: fieldLabels[key] || key,
        value: truncatePreview(value, 200),
        populated: isPopulatedValue(value),
      }))
      .filter((field) => field.populated);
    return { index, fields };
  });
}

function buildSkillsSectionItems(skills: unknown[]) {
  return skills.slice(0, 6).map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { index, fields: [{ key: 'value', label: '内容', value: truncatePreview(item, 200) }] };
    }
    const record = item as Record<string, unknown>;
    const category = truncatePreview(record.category, 80);
    const itemsValue = Array.isArray(record.items)
      ? (record.items as unknown[]).map((v) => truncatePreview(v, 60)).filter(Boolean).join('、')
      : truncatePreview(record.items, 200);
    const fields = [
      category ? { key: 'category', label: '分类', value: category, populated: true } : null,
      itemsValue ? { key: 'items', label: '技能项', value: itemsValue, populated: true } : null,
    ].filter(Boolean) as Array<{ key: string; label: string; value: string; populated: boolean }>;
    return { index, fields };
  });
}

export function buildResumeSectionsDetail(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { sections: [], populatedSectionKeys: [], populatedFieldCount: 0 };
  }

  const record = data as Record<string, unknown>;
  const sections: Array<Record<string, unknown>> = [];
  const populatedSectionKeys: string[] = [];
  let populatedFieldCount = 0;

  for (const [sectionKey, sectionValue] of Object.entries(record)) {
    if (sectionKey === 'rawText') continue;

    const label = RESUME_SECTION_LABELS[sectionKey] || sectionKey;
    const section: Record<string, unknown> = { key: sectionKey, label };

    if (sectionKey === 'basicInfo' && sectionValue && typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
      const fields = buildBasicInfoFields(sectionValue as Record<string, unknown>);
      section.type = 'object';
      section.fields = fields;
      section.populated = fields.length > 0;
      populatedFieldCount += fields.length;
    } else if (sectionKey === 'professionalSummary' || sectionKey === 'githubDesc') {
      const preview = truncatePreview(sectionValue, 300);
      section.type = 'string';
      section.preview = preview;
      section.populated = isPopulatedValue(sectionValue);
      if (section.populated) populatedFieldCount += 1;
    } else if (sectionKey === 'skills' && Array.isArray(sectionValue)) {
      const items = buildSkillsSectionItems(sectionValue);
      section.type = 'array';
      section.itemCount = sectionValue.length;
      section.items = items;
      section.populated = sectionValue.length > 0;
      populatedFieldCount += items.reduce((sum, item) => sum + item.fields.length, 0);
    } else if (Array.isArray(sectionValue)) {
      const items = buildArraySectionItems(sectionKey, sectionValue);
      section.type = 'array';
      section.itemCount = sectionValue.length;
      section.items = items;
      section.populated = sectionValue.length > 0;
      populatedFieldCount += items.reduce((sum, item) => sum + item.fields.length, 0);
    } else if (isPopulatedValue(sectionValue)) {
      section.type = 'unknown';
      section.preview = truncatePreview(sectionValue, 200);
      section.populated = true;
      populatedFieldCount += 1;
    } else {
      section.type = 'empty';
      section.populated = false;
    }

    if (section.populated) populatedSectionKeys.push(sectionKey);
    sections.push(section);
  }

  return { sections, populatedSectionKeys, populatedFieldCount };
}

export function buildAgentResultSummary(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object') return {};
  const outputData = (result as Record<string, unknown>).output_data || result;
  if (!outputData || typeof outputData !== 'object') return {};

  const record = outputData as Record<string, unknown>;
  const agentResult = (record.agent_result as Record<string, unknown>) || {};
  const summary: Record<string, unknown> = {
    agentType: record.agent_type || agentResult.agent_type,
    status: record.status || (result as Record<string, unknown>).status,
  };

  const changesSummary = agentResult.changes_summary || record.changes_summary;
  if (typeof changesSummary === 'string' && changesSummary.trim()) {
    summary.changesSummary = truncatePreview(changesSummary, 500);
  }

  const versions = (agentResult.versions || record.versions) as unknown[];
  if (Array.isArray(versions) && versions.length > 0) {
    const first = versions[0] as Record<string, unknown>;
    summary.versionCount = versions.length;
    if (typeof first.title === 'string') summary.versionTitle = first.title;
    if (typeof first.style === 'string') summary.versionStyle = first.style;
  }

  const optimized = (agentResult.optimized_versions || record.optimized_versions) as unknown[];
  if (Array.isArray(optimized) && optimized.length > 0) {
    const first = optimized[0] as Record<string, unknown>;
    summary.optimizedCount = optimized.length;
    if (typeof first.overall_score === 'number') summary.overallScore = first.overall_score;
    if (typeof first.improvement_summary === 'string') {
      summary.improvementSummary = truncatePreview(first.improvement_summary, 500);
    }
  }

  return summary;
}

export function buildApiStepInput(params: {
  method: string;
  path: string;
  body: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    api: {
      method: params.method,
      path: params.path,
    },
    requestBody: params.body,
  };
}

export function buildToolStepInput(params: {
  type: string;
  config?: Record<string, unknown>;
  input?: unknown;
  resumeTitle?: string;
}): Record<string, unknown> {
  const inputRecord =
    params.input && typeof params.input === 'object' && !Array.isArray(params.input)
      ? (params.input as Record<string, unknown>)
      : undefined;
  return {
    toolType: params.type,
    config: params.config || {},
    input: params.input,
    inputSummary: summarizeResumePayload(params.input, params.resumeTitle),
    resumeTitle: params.resumeTitle,
    resumeSections: inputRecord ? buildResumeSectionsDetail(inputRecord) : undefined,
  };
}

export function buildAgentStepInput(params: {
  nodeId: string;
  nodeName: string;
  agentType?: string;
  nodeType: string;
  config?: Record<string, unknown>;
  resumeSummary: Record<string, unknown>;
  resumeData?: Record<string, unknown>;
  resumeTitle?: string;
}): Record<string, unknown> {
  const systemPrompt = typeof params.config?.systemPrompt === 'string' ? params.config.systemPrompt : '';
  return {
    nodeId: params.nodeId,
    nodeName: params.nodeName,
    agentType: params.agentType,
    nodeType: params.nodeType,
    config: params.config || {},
    hasSystemPrompt: Boolean(systemPrompt.trim()),
    systemPromptPreview: systemPrompt.trim().slice(0, 160),
    resumeTitle: params.resumeTitle,
    resumeSummary: params.resumeSummary,
    resumeSections: params.resumeData ? buildResumeSectionsDetail(params.resumeData) : undefined,
    resumeData: params.resumeData,
  };
}

export function buildResumeNodeStepPayload(params: {
  nodeType: string;
  resumeData: Record<string, unknown>;
  resumeTitle?: string;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    nodeType: params.nodeType,
    resumeTitle: params.resumeTitle,
    resumeSummary: summarizeResumePayload(params.resumeData, params.resumeTitle),
    resumeSections: buildResumeSectionsDetail(params.resumeData),
    resumeData: params.resumeData,
    ...params.extra,
  };
}

export function inferStepCategory(node: {
  category?: string;
  type?: string;
}): WorkflowStepCategory {
  if (node.category === 'tool') {
    return node.type === 'llm' ? 'llm' : 'tool';
  }
  if (node.type === 'input' || node.type === 'output') return 'system';
  return 'agent';
}
