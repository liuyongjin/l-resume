export type WorkflowStepCategory =
  | 'system'
  | 'api'
  | 'agent'
  | 'tool'
  | 'llm'
  | 'database';

export type WorkflowStepStatus = 'running' | 'completed' | 'failed';

export interface WorkflowStepLogInput {
  stepKey: string;
  stepName: string;
  stepCategory: WorkflowStepCategory;
  nodeId?: string;
  inputData: Record<string, unknown>;
}

export interface WorkflowStepLogRecord {
  id: number;
  executionGroupId: string;
  workflowId: number;
  stepOrder: number;
  stepKey: string;
  stepName: string;
  nodeId?: string | null;
  stepCategory: string;
  status: string;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown> | null;
  error?: string | null;
  durationMs?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

import { WorkflowResumeRecord } from '../common/resume-record.util';

export interface WorkflowRunContext {
  resumeData: Record<string, unknown>;
  parsedData: Record<string, unknown>;
  resumeRecord: WorkflowResumeRecord;
  meta: Record<string, unknown>;
}
