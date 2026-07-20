import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

/** 同一用户同时只能有 1 个后台工作流任务（execute 或 test） */
export const MAX_CONCURRENT_WORKFLOW_RUNS_PER_USER = 1;
export const STALE_EXECUTION_MS = 2 * 60 * 60 * 1000;

export type WorkflowExecutionRunType = 'execute' | 'test';

export type ExecutionRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export class WorkflowExecutionCancelledError extends Error {
  constructor(message = '用户手动终止执行') {
    super(message);
    this.name = 'WorkflowExecutionCancelledError';
  }
}

const RUNNING_BLOCKED_MESSAGES: Record<WorkflowExecutionRunType, string> = {
  execute: '已有智能执行任务在进行中，请等待完成后再试',
  test: '已有工作流测试任务在进行中，请等待完成后再试',
};

export interface AcquireExecutionRunParams {
  userId: number;
  workflowId?: number | null;
  runType: WorkflowExecutionRunType;
  idempotencyKey?: string;
}

export interface AcquireExecutionRunResult {
  executionGroupId: string;
  replay: boolean;
  status: 'running' | 'completed' | 'failed';
}

/** 将超时仍为 running 的任务标记为 failed，释放并发槽位 */
export async function expireStaleExecutionRuns(prisma: PrismaService, userId: number): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_EXECUTION_MS);
  await prisma.workflowExecutionRun.updateMany({
    where: {
      userId,
      status: 'running',
      startedAt: { lt: staleBefore },
    },
    data: {
      status: 'failed',
      errorMessage: '执行超时（进程中断或服务重启）',
      completedAt: new Date(),
    },
  });
}

/**
 * 申请一次执行 run：
 * - 有 idempotencyKey 且已存在 → 直接返回同一 executionGroupId（幂等）
 * - 并发超限 → 409
 * - 否则创建新 run
 */
export async function acquireWorkflowExecutionRun(
  prisma: PrismaService,
  params: AcquireExecutionRunParams,
): Promise<AcquireExecutionRunResult> {
  const { userId, workflowId, runType, idempotencyKey } = params;

  await expireStaleExecutionRuns(prisma, userId);

  if (idempotencyKey?.trim()) {
    const key = idempotencyKey.trim();
    const existing = await prisma.workflowExecutionRun.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
    });
    if (existing) {
      return {
        executionGroupId: existing.id,
        replay: true,
        status: existing.status as AcquireExecutionRunResult['status'],
      };
    }
  }

  const executionGroupId = randomUUID();

  try {
    await prisma.$transaction(
      async (tx) => {
        const running = await tx.workflowExecutionRun.findFirst({
          where: { userId, status: 'running' },
          select: { runType: true },
        });
        if (running) {
          const blockedType = (running.runType === 'test' ? 'test' : 'execute') as WorkflowExecutionRunType;
          throw new ConflictException({
            success: false,
            error: {
              code: 4290,
              message: RUNNING_BLOCKED_MESSAGES[blockedType],
            },
          });
        }

        await tx.workflowExecutionRun.create({
          data: {
            id: executionGroupId,
            userId,
            workflowId: workflowId ?? null,
            runType,
            idempotencyKey: idempotencyKey?.trim() || null,
            status: 'running',
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (error: any) {
    if (error instanceof ConflictException) {
      throw error;
    }
    // 并发下两个相同 idempotencyKey 同时到达：后者读已有记录
    if (error?.code === 'P2002' && idempotencyKey?.trim()) {
      const existing = await prisma.workflowExecutionRun.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: idempotencyKey.trim() } },
      });
      if (existing) {
        return {
          executionGroupId: existing.id,
          replay: true,
          status: existing.status as AcquireExecutionRunResult['status'],
        };
      }
    }
    throw error;
  }

  return { executionGroupId, replay: false, status: 'running' };
}

export async function markExecutionRunCompleted(
  prisma: PrismaService,
  executionGroupId: string,
): Promise<void> {
  await prisma.workflowExecutionRun.updateMany({
    where: { id: executionGroupId, status: 'running' },
    data: { status: 'completed', completedAt: new Date() },
  });
}

export async function markExecutionRunFailed(
  prisma: PrismaService,
  executionGroupId: string,
  errorMessage: string,
): Promise<void> {
  await prisma.workflowExecutionRun.updateMany({
    where: { id: executionGroupId, status: { in: ['running'] } },
    data: {
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    },
  });
}

export async function isExecutionRunCancelled(
  prisma: PrismaService,
  executionGroupId: string,
): Promise<boolean> {
  const run = await prisma.workflowExecutionRun.findUnique({
    where: { id: executionGroupId },
    select: { status: true },
  });
  return run?.status === 'cancelled';
}

export async function markExecutionRunCancelled(
  prisma: PrismaService,
  executionGroupId: string,
  errorMessage = '用户手动终止执行',
): Promise<boolean> {
  const result = await prisma.workflowExecutionRun.updateMany({
    where: { id: executionGroupId, status: 'running' },
    data: {
      status: 'cancelled',
      errorMessage,
      completedAt: new Date(),
    },
  });
  return result.count > 0;
}
