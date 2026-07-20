import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { Workflow } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { MultiagentService } from '../multiagent/multiagent.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { PublishWorkflowDto } from './dto/publish-workflow.dto';
import { TestWorkflowDto } from './dto/test-workflow.dto';
import { getNodeLibrary } from './workflow-node-catalog';
import { WorkflowNodeLibraryResponse } from './workflow-node.types';
import { LlmModelsService } from './llm-models.service';
import {
  getAgentRuntimeConfig,
  getLlmProviderConfig,
  getNestRuntimeConfig,
  getWorkflowNodeDefaults,
} from './llm-models.constants';
import {
  buildResumeStyleFromTemplate,
  getTemplateThemeKey,
  mergeIntoTemplateScaffold,
  resolveWorkflowRequestedResumeTitle,
} from '../common/resume-data.util';
import {
  applyResumeRecordPatch,
  buildInitialResumeRecord,
  deriveResumeTitleFromFileName,
  normalizeParsedResumeRecord,
  summarizeResumeRecord,
  toResumeRecordFromDb,
  toTemplateSnapshot,
  WorkflowResumeRecord,
} from '../common/resume-record.util';
import { emptyResumeData } from '../resumes/resume-defaults';
import { executeToolNode } from './workflow-tool-runner';
import { WorkflowExecutionLogger, buildApiStepInput, summarizeResumePayload, buildExecutionStatusFromLogs, estimateExecutionStepCount, buildResumeSectionsDetail, pickResumeTitle } from './workflow-execution.logger';
import { WorkflowStepLogRecord } from './workflow-execution.types';
import { getWorkflowExecutionOrder, runWorkflowGraph, runTranslateStep } from './workflow-run.engine';
import { cloneWorkflowGraph, loadWorkflowGraph, syncWorkflowGraph } from './workflow-graph.sync';
import {
  acquireWorkflowExecutionRun,
  markExecutionRunCompleted,
  markExecutionRunFailed,
  markExecutionRunCancelled,
  WorkflowExecutionCancelledError,
} from './workflow-execution-run.helper';
import { extractAgentConfigs, normalizeCanvasNodes } from './workflow-node.util';
import { normalizeWorkflowConnections, validateWorkflowGraph } from './workflow-graph.normalize';
import { ResumeUploadService } from '../resumes/resume-upload.service';

/** 前端 themeKey -> 多智能体知识库 template_id */
const TEMPLATE_ID_MAP: Record<string, string> = {
  frontendEngineer: 'classic',
  modern: 'modern',
  creative: 'creative',
  data: 'data',
  amber: 'amber',
  purple: 'purple',
  developer: 'developer',
  classic: 'classic',
};

function normalizeTemplateId(templateId?: string): string {
  if (!templateId) return 'classic';
  return TEMPLATE_ID_MAP[templateId] || templateId;
}

/** 后台异步执行的入参（execute / testWorkflow 投递后台时共用） */
interface WorkflowBackgroundExecutionParams {
  userId: number;
  workflowId: string;
  resolvedWorkflowId: number;
  workflowName: string;
  executeDto: ExecuteWorkflowDto;
  templateIds: string[];
  outputLanguages: ('zh' | 'en')[];
  nodes: any[];
  connections: any[];
  agentConfigs: Record<string, any>;
  resumeData: Record<string, unknown>;
  initialResumeRecord: WorkflowResumeRecord;
  firstTemplateSnapshot: ReturnType<typeof toTemplateSnapshot>;
  templateScaffold: Record<string, unknown>;
  multiagentHealth: { available: boolean; url?: string };
  executionLogger: WorkflowExecutionLogger;
  skipWorkflowGraph?: boolean;
}

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private loggerService: LoggerService,
    private readonly multiagentService: MultiagentService,
    private readonly llmModelsService: LlmModelsService,
    private readonly resumeUploadService: ResumeUploadService,
  ) {}

  async listLlmModels() {
    await this.llmModelsService.ensureSeeded();
    const models = await this.llmModelsService.listAllActive();
    const defaultModelId = await this.llmModelsService.getDefaultModelId();
    return {
      success: true,
      data: {
        models,
        defaultModelId,
        provider: getLlmProviderConfig(),
        agentRuntime: getAgentRuntimeConfig(),
        nestRuntime: getNestRuntimeConfig(),
        workflowNodeDefaults: getWorkflowNodeDefaults(),
      },
    };
  }

  async getNodeLibrary(): Promise<{ success: boolean; data: WorkflowNodeLibraryResponse }> {
    await this.llmModelsService.ensureSeeded();
    const models = await this.llmModelsService.listActive();
    const defaultModelId = await this.llmModelsService.getDefaultModelId();
    const library = getNodeLibrary();
    library.options.models = models.map((m) => ({
      label: m.label,
      value: m.value,
    }));
    library.options.defaultConfig = {
      ...library.options.defaultConfig,
      model: defaultModelId,
    };
    return { success: true, data: library };
  }

  async findAll(userId: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'findAll', { userId });
    const workflows = await this.prisma.workflow.findMany({
      where: { userId, isDefault: true },
      orderBy: [{ updatedAt: 'desc' }],
    });
    this.loggerService.logDatabaseOperation('SELECT', 'workflow', { userId, count: workflows.length });
    return {
      success: true,
      data: await Promise.all(workflows.map((w) => this.formatWorkflowResponse(w))),
    };
  }

  async listVersions(userId: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'listVersions', { userId });
    await this.ensureUserDefaultWorkflow(userId);

    const versions = await this.prisma.workflow.findMany({
      where: { userId, isActive: true },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        name: true,
        description: true,
        isDefault: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: { versions },
    };
  }

  async getVersion(userId: number, versionId: number) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: versionId, userId },
    });
    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: { code: 3002, message: '工作流版本不存在' },
      });
    }
    return {
      success: true,
      data: await this.formatWorkflowResponse(workflow),
    };
  }

  async getWorkflowGraph(userId: number, workflowId: number) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, userId, isActive: true },
    });
    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: { code: 3002, message: '工作流不存在' },
      });
    }

    const graph = await loadWorkflowGraph(this.prisma, workflow.id);

    return {
      success: true,
      data: {
        workflowId: workflow.id,
        version: workflow.version,
        name: workflow.name,
        nodes: graph.nodes,
        connections: graph.connections,
        agentConfigs: extractAgentConfigs(graph.nodes),
      },
    };
  }

  async publish(userId: number, publishDto: PublishWorkflowDto) {
    this.loggerService.logServiceCall('WorkflowsService', 'publish', { userId, name: publishDto.name });

    const workflow = await this.prisma.$transaction(
      async (tx) => {
        const maxVersion = await tx.workflow.aggregate({
          where: { userId },
          _max: { version: true },
        });
        const nextVersion = (maxVersion._max.version ?? 0) + 1;

        await tx.workflow.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });

        return tx.workflow.create({
          data: {
            userId,
            version: nextVersion,
            name: publishDto.name,
            description: publishDto.description,
            isDefault: true,
            isActive: true,
            publishedAt: new Date(),
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    this.loggerService.logBusinessEvent('WORKFLOW_PUBLISH', '工作流版本发布成功', {
      workflowId: workflow.id,
      version: workflow.version,
      userId,
    });

    await syncWorkflowGraph(
      this.prisma,
      workflow.id,
      publishDto.nodes,
      publishDto.connections,
    );

    const refreshed = await this.prisma.workflow.findUnique({ where: { id: workflow.id } });

    return {
      success: true,
      data: await this.formatWorkflowResponse(refreshed!),
      message: `已发布新版本 v${workflow.version}`,
    };
  }

  /** 删除工作流及其 jf_workflow_node / jf_workflow_edge 记录 */
  private async deleteWorkflowWithGraph(workflowId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowNode.deleteMany({ where: { workflowId } });
      await tx.workflowConnection.deleteMany({ where: { workflowId } });
      await tx.workflow.delete({ where: { id: workflowId } });
    });
  }

  async deleteVersion(userId: number, versionId: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'deleteVersion', { userId, versionId });

    const workflow = await this.prisma.workflow.findFirst({
      where: { id: versionId, userId, isActive: true },
    });
    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: { code: 3002, message: '工作流版本不存在' },
      });
    }

    const activeCount = await this.prisma.workflow.count({
      where: { userId, isActive: true },
    });
    if (activeCount <= 1) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '至少保留一个工作流版本' },
      });
    }

    const wasDefault = workflow.isDefault;

    await this.prisma.$transaction(async (tx) => {
      await tx.workflowNode.deleteMany({ where: { workflowId: versionId } });
      await tx.workflowConnection.deleteMany({ where: { workflowId: versionId } });
      await tx.workflow.delete({ where: { id: versionId } });

      if (wasDefault) {
        const nextDefault = await tx.workflow.findFirst({
          where: { userId, isActive: true },
          orderBy: { version: 'desc' },
        });
        if (nextDefault) {
          await tx.workflow.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
          await tx.workflow.update({
            where: { id: nextDefault.id },
            data: { isDefault: true },
          });
        }
      }
    });

    this.loggerService.logBusinessEvent('WORKFLOW_VERSION_DELETE', '工作流版本已删除', {
      workflowId: versionId,
      version: workflow.version,
      userId,
    });

    return {
      success: true,
      message: `已删除 v${workflow.version}`,
      data: {
        deletedVersionId: versionId,
        deletedVersion: workflow.version,
      },
    };
  }

  async restoreVersion(userId: number, versionId: number) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: versionId, userId },
    });
    if (!workflow) {
      throw new NotFoundException({
        success: false,
        error: { code: 3002, message: '工作流版本不存在' },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workflow.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      await tx.workflow.update({
        where: { id: versionId },
        data: { isDefault: true, updatedAt: new Date() },
      });
    });

    const restored = await this.prisma.workflow.findFirstOrThrow({
      where: { id: versionId, userId },
    });

    this.loggerService.logBusinessEvent('WORKFLOW_RESTORE', '工作流版本已恢复为当前版本', {
      workflowId: restored.id,
      version: restored.version,
      userId,
    });

    return {
      success: true,
      data: await this.formatWorkflowResponse(restored),
      message: `已恢复至 v${restored.version}`,
    };
  }

  async findDefault(userId: number, version?: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'findDefault', { userId, version });

    if (version != null) {
      const versioned = await this.prisma.workflow.findFirst({
        where: { userId, version, isActive: true },
      });
      if (!versioned) {
        throw new NotFoundException({
          success: false,
          error: { code: 3002, message: `工作流版本 v${version} 不存在` },
        });
      }
      return { success: true, data: await this.formatWorkflowResponse(versioned) };
    }

    const workflow = await this.ensureUserDefaultWorkflow(userId);
    if (workflow) {
      return { success: true, data: await this.formatWorkflowResponse(workflow) };
    }

    const template = await this.findSystemWorkflowTemplate();
    if (template) {
      return { success: true, data: await this.formatWorkflowResponse(template) };
    }

    throw new NotFoundException({
      success: false,
      error: { code: 3002, message: '工作流未初始化，请先执行数据库初始化脚本' },
    });
  }

  private async formatWorkflowResponse(workflow: Workflow) {
    const graph = await loadWorkflowGraph(this.prisma, workflow.id);

    return {
      ...workflow,
      nodes: graph.nodes,
      connections: graph.connections,
      nodeCount: graph.nodes.length,
    };
  }

  private async findUserDefaultWorkflow(userId: number) {
    return this.prisma.workflow.findFirst({
      where: { userId, isDefault: true, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  private async findSystemWorkflowTemplate() {
    return this.prisma.workflow.findFirst({
      where: { userId: 1, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { version: 'desc' }],
    });
  }

  /** 确保当前用户有可用的默认工作流；无则从系统模板克隆 */
  private async ensureUserDefaultWorkflow(userId: number) {
    let workflow = await this.findUserDefaultWorkflow(userId);
    if (workflow) return workflow;

    workflow = await this.prisma.workflow.findFirst({
      where: { userId, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (workflow) return workflow;

    const template = await this.findSystemWorkflowTemplate();
    if (!template) return null;

    if (template.userId === userId) {
      return template;
    }

    const created = await this.prisma.workflow.create({
      data: {
        userId,
        version: 1,
        name: template.name,
        description: template.description,
        isDefault: true,
        isActive: true,
        publishedAt: new Date(),
      },
    });

    await cloneWorkflowGraph(this.prisma, template.id, created.id);
    return created;
  }

  async findOne(userId: number, id: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'findOne', { userId, id });
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, userId },
    });
    if (!workflow) {
      this.loggerService.warn(`工作流不存在: userId=${userId}, id=${id}`, 'Workflow');
      return {
        success: false,
        message: '工作流不存在',
      };
    }
    return {
      success: true,
      data: await this.formatWorkflowResponse(workflow),
    };
  }

  async create(userId: number, createWorkflowDto: CreateWorkflowDto) {
    return this.publish(userId, {
      name: createWorkflowDto.name,
      description: createWorkflowDto.description,
      nodes: createWorkflowDto.nodes,
      connections: createWorkflowDto.connections,
    });
  }

  async update(userId: number, id: number, updateWorkflowDto: UpdateWorkflowDto) {
    this.loggerService.logServiceCall('WorkflowsService', 'update', { userId, id });
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      this.loggerService.warn(`工作流更新失败: 工作流不存在 - userId=${userId}, id=${id}`, 'Workflow');
      return {
        success: false,
        message: '工作流不存在',
      };
    }

    if (updateWorkflowDto.isDefault) {
      await this.prisma.workflow.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    await this.prisma.workflow.update({
      where: { id },
      data: {
        name: updateWorkflowDto.name ?? workflow.name,
        description: updateWorkflowDto.description ?? workflow.description,
        isDefault: updateWorkflowDto.isDefault ?? workflow.isDefault,
        isActive: updateWorkflowDto.isActive ?? workflow.isActive,
        updatedAt: new Date(),
      },
    });
    this.loggerService.logBusinessEvent('WORKFLOW_UPDATE', '工作流更新成功', { workflowId: id, userId });

    if (updateWorkflowDto.nodes !== undefined || updateWorkflowDto.connections !== undefined) {
      const graph = await loadWorkflowGraph(this.prisma, id);
      await syncWorkflowGraph(
        this.prisma,
        id,
        updateWorkflowDto.nodes ?? graph.nodes,
        updateWorkflowDto.connections ?? graph.connections,
      );
    }

    const refreshed = await this.prisma.workflow.findUnique({ where: { id } });

    return {
      success: true,
      data: await this.formatWorkflowResponse(refreshed!),
      message: '工作流更新成功',
    };
  }

  async remove(userId: number, id: number) {
    this.loggerService.logServiceCall('WorkflowsService', 'remove', { userId, id });
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      this.loggerService.warn(`工作流删除失败: 工作流不存在 - userId=${userId}, id=${id}`, 'Workflow');
      return {
        success: false,
        message: '工作流不存在',
      };
    }

    await this.deleteWorkflowWithGraph(id);
    this.loggerService.logBusinessEvent('WORKFLOW_DELETE', '工作流删除成功', { workflowId: id, userId });
    return {
      success: true,
      message: '工作流删除成功',
    };
  }

  /** 解析可执行的工作流：仅按数字 id 查找，找不到则返回 null（不回退默认版） */
  private async resolveWorkflowForExecution(userId: number, workflowRef: string): Promise<Workflow | null> {
    if (!/^\d+$/.test(workflowRef)) return null;

    const id = parseInt(workflowRef, 10);
    return this.prisma.workflow.findFirst({
      where: { id, userId, isActive: true },
    });
  }

  async checkExecutionHealth() {
    const multiagentHealth = await this.multiagentService.checkHealth();
    return {
      success: true,
      data: {
        multiagent: multiagentHealth,
        ready: multiagentHealth.available,
      },
    };
  }

  private async resolveTemplate(templateIdOrThemeKey: string) {
    const byId = await this.prisma.template.findUnique({
      where: { id: templateIdOrThemeKey },
    });
    if (byId) return byId;

    const activeTemplates = await this.prisma.template.findMany({ where: { isActive: true } });
    return activeTemplates.find((tpl) => getTemplateThemeKey(tpl) === templateIdOrThemeKey) || null;
  }

  private resolveOutputLanguages(dto: ExecuteWorkflowDto): ('zh' | 'en')[] {
    if (Array.isArray(dto.outputLanguages)) {
      return [...new Set(dto.outputLanguages)];
    }
    const langs: ('zh' | 'en')[] = ['zh'];
    if (dto.generateEnglish || (dto.englishVersionsCount ?? 0) > 0) {
      langs.push('en');
    }
    return langs;
  }

  /**
   * 智能执行入口
   *
   * HTTP 立即返回 executionGroupId，实际生成工作在 runExecuteInBackground 中异步完成。
   * 打开本函数即可看到完整同步阶段的步骤划分。
   */
  async execute(userId: number, workflowId: string, executeDto: ExecuteWorkflowDto) {
    // ── 1. 校验：输出模板 ──────────────────────────────────────
    const templateIds = executeDto.templateIds?.length
      ? executeDto.templateIds
      : executeDto.templateId
        ? [executeDto.templateId]
        : [];
    if (templateIds.length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请至少选择一个输出模板' },
      });
    }

    // ── 2. 校验：输出语言 ──────────────────────────────────────
    const outputLanguages = this.resolveOutputLanguages(executeDto);
    if (outputLanguages.length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请至少选择一种输出语言（zh 或 en）' },
      });
    }

    this.loggerService.logServiceCall('WorkflowsService', 'execute', {
      userId,
      workflowId,
      templateIds,
      outputLanguages,
      resumeId: executeDto.resumeId,
      filePath: executeDto.filePath,
      targetRole: executeDto.targetRole,
    });

    // ── 3. 加载简历输入（filePath → resumeId → DTO） ───────────
    let resumeData = executeDto.resumeData as Record<string, unknown> | undefined;
    let rawText = executeDto.rawText;
    let sourceResumeRecord: WorkflowResumeRecord | undefined;
    let uploadDefaultTitle: string | undefined;

    if (executeDto.filePath) {
      const loaded = await this.resumeUploadService.loadAndParseFromPath(
        userId,
        executeDto.filePath,
        executeDto.uploadFileName,
      );
      resumeData = loaded.resumeData;
      rawText = loaded.textContent || (loaded.resumeData.rawText as string | undefined);
      uploadDefaultTitle = deriveResumeTitleFromFileName(loaded.fileName);
    } else if (executeDto.resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: executeDto.resumeId, userId },
      });
      if (!resume) {
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '简历不存在' },
        });
      }
      sourceResumeRecord = toResumeRecordFromDb(resume);
      if (!resumeData) resumeData = sourceResumeRecord.data;
    }

    if (!resumeData && !rawText) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请提供 filePath、resumeData、rawText 或 resumeId' },
      });
    }

    // ── 4. 解析工作流图（不存在则 skip，后续原样透传） ─────────
    const workflow = await this.resolveWorkflowForExecution(userId, workflowId);
    const skipWorkflowGraph = !workflow;

    let resolvedWorkflowId: number;
    let workflowName: string;
    let nodes: any[];
    let connections: any[];
    let agentConfigs: Record<string, any>;

    if (skipWorkflowGraph) {
      resolvedWorkflowId = 0;
      workflowName = '智能体工作流跳过';
      nodes = [];
      connections = [];
      agentConfigs = {};
      this.loggerService.logBusinessEvent('WORKFLOW_GRAPH_SKIP', '工作流不存在，智能体编排原样输入输出', {
        requestedRef: workflowId,
        userId,
      });
    } else {
      resolvedWorkflowId = workflow.id;
      workflowName = workflow.name;
      const graph = await loadWorkflowGraph(this.prisma, resolvedWorkflowId);
      nodes = graph.nodes;
      connections = graph.connections;
      agentConfigs = extractAgentConfigs(nodes);
    }

    // ── 5. 检查多智能体服务（仅此一处 HTTP 探测，后台不再重复检查） ─
    const multiagentHealth = await this.multiagentService.checkHealth();
    if (!multiagentHealth.available) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 5000,
          message: `多智能体服务未启动，请先启动 Python 服务 (${multiagentHealth.url})`,
        },
      });
    }

    // ── 6. 准备首个模板快照 & 初始 resumeRecord ────────────────
    const firstTemplate = await this.resolveTemplate(templateIds[0]);
    if (!firstTemplate) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: `模板不存在: ${templateIds[0]}` },
      });
    }

    const firstThemeKey = getTemplateThemeKey(firstTemplate);
    const firstTemplateSnapshot = toTemplateSnapshot(firstTemplate);
    const templateScaffold = firstTemplateSnapshot.data || emptyResumeData();
    const executePayload: ExecuteWorkflowDto = { ...executeDto, rawText };
    const initialResumeRecord = buildInitialResumeRecord({
      templateSnapshot: firstTemplateSnapshot,
      themeKey: firstThemeKey,
      resumeData: resumeData!,
      rawText,
      existing: sourceResumeRecord,
      source: 'workflow',
      defaultTitle: uploadDefaultTitle,
    });

    // ── 7. 申请执行 run（幂等 + 并发控制），投递后台任务 ───────
    //    后台流程见 runExecuteInBackground：
    //    init → parse → [每模板: merge → 工作流图 → 翻译 → 保存] → complete
    const run = await acquireWorkflowExecutionRun(this.prisma, {
      userId,
      workflowId: resolvedWorkflowId,
      runType: 'execute',
      idempotencyKey: executeDto.idempotencyKey,
    });

    if (run.replay) {
      return {
        success: true,
        message: run.status === 'running' ? '工作流执行进行中（幂等返回）' : '工作流执行已存在（幂等返回）',
        data: {
          executionGroupId: run.executionGroupId,
          status: run.status,
          workflowId: resolvedWorkflowId,
          requestedWorkflowId: workflowId,
          workflowName,
          skipWorkflowGraph,
          replay: true,
        },
      };
    }

    const executionLogger = new WorkflowExecutionLogger(
      this.prisma,
      userId,
      resolvedWorkflowId,
      executeDto.resumeId ?? null,
      run.executionGroupId,
    );

    void this.runExecuteInBackground({
      userId,
      workflowId,
      resolvedWorkflowId,
      workflowName,
      executeDto: executePayload,
      templateIds,
      outputLanguages,
      nodes,
      connections,
      agentConfigs,
      resumeData: resumeData!,
      initialResumeRecord,
      firstTemplateSnapshot,
      templateScaffold,
      multiagentHealth,
      executionLogger,
      skipWorkflowGraph,
    }).catch(async (error) => {
      this.loggerService.error(
        `后台工作流执行异常: group=${executionLogger.executionGroupId} | ${error.message}`,
        error.stack,
        'Workflow',
      );
      await markExecutionRunFailed(this.prisma, executionLogger.executionGroupId, error.message);
    });

    // ── 8. 立即返回，前端凭 executionGroupId 轮询进度 ──────────
    return {
      success: true,
      message: '工作流执行已启动',
      data: {
        executionGroupId: executionLogger.executionGroupId,
        status: 'running',
        workflowId: resolvedWorkflowId,
        requestedWorkflowId: workflowId,
        workflowName,
        skipWorkflowGraph,
      },
    };
  }

  /** 设计器：使用当前画布节点测试整条工作流（不写入简历库） */
  async testWorkflow(userId: number, testDto: TestWorkflowDto) {
    if (!testDto.nodes?.length) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '请先添加工作流节点' },
      });
    }

    const multiagentHealth = await this.multiagentService.checkHealth();
    if (!multiagentHealth.available) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 5000,
          message: `多智能体服务未启动，请先启动 Python 服务 (${multiagentHealth.url})`,
        },
      });
    }

    let templateId = testDto.templateId;
    if (!templateId) {
      const firstActive = await this.prisma.template.findFirst({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      });
      if (!firstActive) {
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '没有可用的简历模板' },
        });
      }
      templateId = firstActive.id;
    }

    const template = await this.resolveTemplate(templateId);
    if (!template) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: `模板不存在: ${templateId}` },
      });
    }

    const nodes = normalizeCanvasNodes(testDto.nodes);
    const connections = normalizeWorkflowConnections(nodes, testDto.connections || []);
    const graphErrors = validateWorkflowGraph(nodes, connections);
    if (graphErrors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: graphErrors[0], details: graphErrors },
      });
    }
    const agentConfigs = extractAgentConfigs(nodes);

    const firstTemplateSnapshot = toTemplateSnapshot(template);
    const templateScaffold = firstTemplateSnapshot.data || emptyResumeData();
    let resumeData = testDto.resumeData as Record<string, unknown> | undefined;
    if (!resumeData) {
      resumeData = JSON.parse(JSON.stringify(templateScaffold)) as Record<string, unknown>;
    }

    const firstThemeKey = getTemplateThemeKey(template);
    const initialResumeRecord = buildInitialResumeRecord({
      templateSnapshot: firstTemplateSnapshot,
      themeKey: firstThemeKey,
      resumeData,
      rawText: testDto.rawText,
      source: 'workflow_test',
    });

    const resolvedWorkflowId = testDto.workflowId ?? 0;
    const workflowName = testDto.name || '设计器测试';
    const executeDto: ExecuteWorkflowDto = {
      resumeData,
      rawText: testDto.rawText,
      targetRole:
        testDto.targetRole ||
        ((resumeData as { basicInfo?: { position?: string } })?.basicInfo?.position ?? ''),
      templateIds: [templateId],
      outputLanguages: ['zh'],
      saveToDatabase: false,
    };

    this.loggerService.logServiceCall('WorkflowsService', 'testWorkflow', {
      userId,
      workflowId: resolvedWorkflowId,
      nodeCount: nodes.length,
      templateId,
    });

    const run = await acquireWorkflowExecutionRun(this.prisma, {
      userId,
      workflowId: resolvedWorkflowId || null,
      runType: 'test',
      idempotencyKey: testDto.idempotencyKey,
    });

    if (run.replay) {
      return {
        success: true,
        message: '工作流测试已存在（幂等返回）',
        data: {
          executionGroupId: run.executionGroupId,
          status: run.status,
          workflowId: resolvedWorkflowId,
          workflowName,
          replay: true,
        },
      };
    }

    const executionLogger = new WorkflowExecutionLogger(
      this.prisma,
      userId,
      resolvedWorkflowId,
      null,
      run.executionGroupId,
    );

    void this.runExecuteInBackground({
      userId,
      workflowId: String(resolvedWorkflowId || 'test'),
      resolvedWorkflowId,
      workflowName,
      executeDto,
      templateIds: [templateId],
      outputLanguages: ['zh'],
      nodes,
      connections,
      agentConfigs,
      resumeData,
      initialResumeRecord,
      firstTemplateSnapshot,
      templateScaffold,
      multiagentHealth,
      executionLogger,
    }).catch(async (error) => {
      this.loggerService.error(
        `设计器工作流测试异常: group=${executionLogger.executionGroupId} | ${error.message}`,
        error.stack,
        'Workflow',
      );
      await markExecutionRunFailed(this.prisma, executionLogger.executionGroupId, error.message);
    });

    return {
      success: true,
      message: '工作流测试已启动',
      data: {
        executionGroupId: executionLogger.executionGroupId,
        status: 'running',
        workflowId: resolvedWorkflowId,
        workflowName,
      },
    };
  }

  /**
   * 后台执行主流程（由 execute / testWorkflow 异步触发）
   *
   * 步骤与 execute 注释中的「后台流程」对应，全部平铺在本函数内：
   *   A. init → parse
   *   B. 每个模板：merge → 工作流图 → 多语言 → 保存
   *   C. complete；失败时 execute.failed
   */
  private async runExecuteInBackground(params: WorkflowBackgroundExecutionParams) {
    const {
      userId,
      workflowId,
      resolvedWorkflowId,
      workflowName,
      executeDto,
      templateIds,
      outputLanguages,
      nodes,
      connections,
      agentConfigs,
      resumeData,
      initialResumeRecord,
      firstTemplateSnapshot,
      templateScaffold,
      multiagentHealth,
      executionLogger,
      skipWorkflowGraph = false,
    } = params;

    const stepLogs: WorkflowStepLogRecord[] = [];
    const savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }> = [];
    const workflowOutputs: Array<{ templateId: string; lang: string; data: Record<string, unknown> }> = [];
    const sourceResumeTitle = initialResumeRecord.title?.trim() || '未命名简历';

    try {
      // ── A. 准备阶段 ──────────────────────────────────────────

      // A1. 记录执行请求，写入预估总步数（供进度条计算）
      const expectedStepCount = estimateExecutionStepCount({
        templateCount: templateIds.length,
        outputLanguages,
        nodeCount: nodes.length,
        skipWorkflowGraph,
        saveToDatabase: executeDto.saveToDatabase,
      });

      const { log: initLog } = await executionLogger.runStep(
        {
          stepKey: 'execute.init',
          stepName: '接收执行请求',
          stepCategory: 'system',
          inputData: {
            requestedWorkflowId: workflowId,
            resolvedWorkflowId,
            workflowName,
            templateIds,
            outputLanguages,
            executeDto,
            agentConfigs,
            nodeCount: nodes.length,
            skipWorkflowGraph,
            expectedStepCount,
            multiagentHealth,
            sourceResumeId: executeDto.resumeId ?? null,
            sourceResumeTitle,
            resumeTitle: sourceResumeTitle,
          },
        },
        async () => ({ accepted: true, expectedStepCount, sourceResumeTitle }),
      );
      stepLogs.push(initLog);

      // A2. 调用 multiagent 解析上传简历（health 已在 execute 同步阶段检查）
      const { result: parseResult, log: parseLog } = await executionLogger.runStep(
        {
          stepKey: 'api.parse_resume',
          stepName: '解析上传简历',
          stepCategory: 'api',
          inputData: buildApiStepInput({
            method: 'POST',
            path: '/api/multiagent/parse-resume',
            body: {
              resumeTitle: sourceResumeTitle,
              sourceResumeTitle,
              resumeRecordSummary: summarizeResumeRecord({ ...initialResumeRecord, title: sourceResumeTitle }),
              templateSnapshot: {
                id: firstTemplateSnapshot.id,
                name: firstTemplateSnapshot.name,
                fieldKeys: Object.keys(firstTemplateSnapshot.data || {}),
              },
              rawTextLength: executeDto.rawText?.length || 0,
              targetRole: executeDto.targetRole || '',
              templateId: templateIds[0],
            },
          }),
        },
        async () =>
          this.multiagentService.parseResume(userId, {
            resumeRecord: initialResumeRecord,
            resumeData,
            rawText: executeDto.rawText || (resumeData as any)?.rawText,
            templateSchema: templateScaffold,
            dataSchema: firstTemplateSnapshot.dataSchema,
            styleSchema: firstTemplateSnapshot.styleSchema,
            templateSnapshot: firstTemplateSnapshot as unknown as Record<string, unknown>,
            targetRole: executeDto.targetRole,
          }),
        (result) => {
          const parsedRecord = (result as any)?.output_data?.parsedRecord
            ? ((result as any).output_data.parsedRecord as WorkflowResumeRecord)
            : normalizeParsedResumeRecord(
                (((result as any)?.output_data?.parsed || {}) as Record<string, unknown>),
                initialResumeRecord,
              );
          return {
            resumeTitle: sourceResumeTitle,
            sourceResumeTitle,
            parsedRecordSummary: summarizeResumeRecord({ ...parsedRecord, title: sourceResumeTitle }),
            parsedSections: buildResumeSectionsDetail(parsedRecord.data),
            parsedData: parsedRecord.data,
            fallback: Boolean((result as any)?.output_data?.fallback),
          };
        },
      );
      stepLogs.push(parseLog);

      const parsedRecord: WorkflowResumeRecord = (parseResult as any)?.output_data?.parsedRecord
        ? ((parseResult as any).output_data.parsedRecord as WorkflowResumeRecord)
        : normalizeParsedResumeRecord(
            ((parseResult as any)?.output_data?.parsed || resumeData || {}) as Record<string, unknown>,
            initialResumeRecord,
          );
      parsedRecord.title = sourceResumeTitle;
      const parsedData = parsedRecord.data;

      // ── B. 按模板生成多语言简历 ──────────────────────────────

      for (const tid of templateIds) {
        const template = await this.resolveTemplate(tid);
        if (!template) {
          throw new BadRequestException({
            success: false,
            error: { code: 3001, message: `模板不存在: ${tid}` },
          });
        }

        const themeKey = getTemplateThemeKey(template);
        const templateDbId = template.id;
        const templateSnapshot = toTemplateSnapshot(template);
        const scaffold = templateSnapshot.data || emptyResumeData();
        const templateStyle = buildResumeStyleFromTemplate(templateSnapshot.style, templateSnapshot.config);
        const templateResumeRecord = applyResumeRecordPatch(parsedRecord, {
          templateId: templateDbId,
          style: templateStyle,
        });
        const parsedResumeData = { ...parsedRecord.data };
        const mergedInput = mergeIntoTemplateScaffold(scaffold, parsedResumeData, {
          preferParsedOnly: true,
        });
        templateResumeRecord.data = mergedInput;
        templateResumeRecord.title = sourceResumeTitle;

        // B1. 合并解析结果到模板 scaffold
        const { log: mergeLog } = await executionLogger.runStep(
          {
            stepKey: `template:${themeKey}:merge`,
            stepName: `模板数据合并 (${template.name})`,
            stepCategory: 'system',
            inputData: {
              templateId: tid,
              themeKey,
              templateName: template.name,
              resumeTitle: sourceResumeTitle,
              sourceResumeTitle,
              templateScaffoldSections: buildResumeSectionsDetail(scaffold),
              parsedResumeSections: buildResumeSectionsDetail(parsedResumeData),
              parsedData: parsedResumeData,
              templateScaffold: scaffold,
            },
          },
          async () => mergedInput,
          (result) => {
            const mergedRecord = { ...templateResumeRecord, data: result, title: sourceResumeTitle };
            return {
              templateId: tid,
              themeKey,
              templateName: template.name,
              resumeTitle: sourceResumeTitle,
              sourceResumeTitle,
              mergedSummary: summarizeResumePayload(result, sourceResumeTitle),
              mergedSections: buildResumeSectionsDetail(result),
              mergedData: result,
              resumeRecordSummary: summarizeResumeRecord(mergedRecord),
            };
          },
        );
        stepLogs.push(mergeLog);

        // B2. 跑工作流图（或 skip 时原样透传）
        let workflowOutput: Record<string, unknown>;
        let finalResumeRecord: WorkflowResumeRecord;

        if (skipWorkflowGraph) {
          const { log: passthroughLog } = await executionLogger.runStep(
            {
              stepKey: `workflow:${themeKey}:passthrough`,
              stepName: `智能体工作流原样输入输出 (${template.name})`,
              stepCategory: 'system',
              inputData: {
                templateId: tid,
                themeKey,
                reason: '工作流不存在，跳过智能体编排',
                resumeTitle: sourceResumeTitle,
                sourceResumeTitle,
                resumeRecordSummary: summarizeResumeRecord({ ...templateResumeRecord, title: sourceResumeTitle }),
                resumeSections: buildResumeSectionsDetail(mergedInput),
                resumeData: mergedInput,
              },
            },
            async () => mergedInput,
            (result) => ({
              templateId: tid,
              themeKey,
              resumeTitle: sourceResumeTitle,
              sourceResumeTitle,
              mergedSummary: summarizeResumePayload(result, sourceResumeTitle),
              resumeSections: buildResumeSectionsDetail(result),
              resumeData: result,
            }),
          );
          stepLogs.push(passthroughLog);
          workflowOutput = mergedInput;
          finalResumeRecord = { ...templateResumeRecord, data: mergedInput };
        } else {
          const graphResult = await runWorkflowGraph({
            logger: executionLogger,
            nodes,
            connections,
            context: {
              resumeData: mergedInput,
              parsedData: parsedData as Record<string, unknown>,
              resumeRecord: templateResumeRecord,
              meta: {
                templateId: tid,
                themeKey,
                targetRole: executeDto.targetRole || '',
                sourceResumeTitle,
              },
            },
            deps: {
              multiagent: this.multiagentService,
              userId,
              executeDto,
              templateThemeKey: normalizeTemplateId(themeKey),
              targetRole:
                executeDto.targetRole ||
                (mergedInput as any)?.basicInfo?.position ||
                '',
            },
          });
          stepLogs.push(...graphResult.stepLogs);
          workflowOutput = graphResult.context.resumeData;
          finalResumeRecord = graphResult.context.resumeRecord;
          finalResumeRecord.data = workflowOutput;
        }

        const requestedResumeTitle = resolveWorkflowRequestedResumeTitle(
          getWorkflowExecutionOrder(nodes, connections),
        );
        if (requestedResumeTitle) {
          finalResumeRecord = { ...finalResumeRecord, title: requestedResumeTitle };
        }
        // 持久化时使用 jf_resume_template 表 id，避免智能体返回 knowledge base 的 template_id（如 classic）
        finalResumeRecord = { ...finalResumeRecord, templateId: templateDbId };

        // B3. 生成各语言版本（中文直接使用，英文走翻译）
        const languagePayloads: Array<{ lang: 'zh' | 'en'; data: Record<string, unknown> }> = [];

        if (outputLanguages.includes('zh')) {
          languagePayloads.push({ lang: 'zh', data: workflowOutput });
        }

        if (outputLanguages.includes('en')) {
          const translateResult = await runTranslateStep({
            logger: executionLogger,
            multiagent: this.multiagentService,
            userId,
            resumeData: workflowOutput,
            targetLanguage: 'en',
            resumeTitle: pickResumeTitle(finalResumeRecord),
          });
          stepLogs.push(translateResult.log);
          languagePayloads.push({ lang: 'en', data: translateResult.data });
        }

        // B4. 写入 jf_resume 表（saveToDatabase=false 时跳过）
        for (const item of languagePayloads) {
          workflowOutputs.push({ templateId: templateDbId, lang: item.lang, data: item.data });

          if (executeDto.saveToDatabase === false) continue;

          const langLabel = item.lang === 'zh' ? '中文版' : '英文版';
          const position =
            (item.data as any)?.basicInfo?.position ||
            executeDto.targetRole ||
            '未命名职位';
          const title =
            finalResumeRecord.title?.trim() ||
            `AI简历-${position}-${template.name}-${langLabel}`;
          const saveStyle = (finalResumeRecord.style || templateStyle) as Record<string, unknown>;

          const { result: created, log: saveLog } = await executionLogger.runStep(
            {
              stepKey: `save:${themeKey}:${item.lang}`,
              stepName: `保存简历 (${template.name} · ${langLabel})`,
              stepCategory: 'database',
              inputData: {
                table: 'jf_resume',
                resumeTitle: title,
                payload: {
                  ...summarizeResumeRecord({ ...finalResumeRecord, data: item.data }),
                  title,
                  templateId: templateDbId,
                  source: finalResumeRecord.source || 'workflow',
                },
                resumeSections: buildResumeSectionsDetail(item.data),
                resumeData: item.data,
              },
            },
            async () =>
              this.prisma.resume.create({
                data: {
                  userId,
                  title,
                  data: item.data as any,
                  style: saveStyle as any,
                  templateId: templateDbId,
                  source: finalResumeRecord.source || 'workflow',
                  isFavorite: finalResumeRecord.isFavorite ?? false,
                  shareToken: finalResumeRecord.shareToken ?? undefined,
                  shareExpiresAt: finalResumeRecord.shareExpiresAt
                    ? new Date(finalResumeRecord.shareExpiresAt)
                    : undefined,
                },
              }),
            (result) => ({
              resumeId: result.id,
              title: result.title,
              templateId: templateDbId,
              lang: item.lang,
              resumeSections: buildResumeSectionsDetail(item.data),
            }),
          );
          stepLogs.push(saveLog);

          savedResumes.push({
            id: created.id,
            title: created.title,
            templateId: templateDbId,
            lang: item.lang,
          });
        }
      }

      // ── C. 完成 ──────────────────────────────────────────────
      const { log: completeLog } = await executionLogger.runStep(
        {
          stepKey: 'execute.complete',
          stepName: '执行完成',
          stepCategory: 'system',
          inputData: {
            savedCount: savedResumes.length,
            outputCount: workflowOutputs.length,
            savedResumeTitles: savedResumes.map((item) => item.title),
          },
        },
        async () => ({
          savedResumes,
          workflowOutputs,
        }),
      );
      stepLogs.push(completeLog);

      this.loggerService.logBusinessEvent('WORKFLOW_EXECUTE_SUCCESS', '智能执行完成', {
        userId,
        executionGroupId: executionLogger.executionGroupId,
        savedCount: savedResumes.length,
        stepCount: stepLogs.length,
      });

      await markExecutionRunCompleted(this.prisma, executionLogger.executionGroupId);
    } catch (error) {
      if (error instanceof WorkflowExecutionCancelledError) {
        if ((error as any)?.stepLog) {
          stepLogs.push((error as any).stepLog as WorkflowStepLogRecord);
        }

        this.loggerService.logBusinessEvent('WORKFLOW_EXECUTE_CANCELLED', '智能执行已终止', {
          userId,
          executionGroupId: executionLogger.executionGroupId,
          stepCount: stepLogs.length,
        });

        if (savedResumes.length > 0 && executeDto.saveToDatabase !== false) {
          await this.compensateWorkflowSavedResumes(userId, executionLogger, savedResumes, stepLogs);
        }

        const alreadyCancelled = await this.prisma.workflowExecution.findFirst({
          where: {
            userId,
            executionGroupId: executionLogger.executionGroupId,
            stepKey: 'execute.cancelled',
          },
          select: { id: true },
        });
        if (!alreadyCancelled) {
          const lastStep = await this.prisma.workflowExecution.findFirst({
            where: { userId, executionGroupId: executionLogger.executionGroupId },
            orderBy: { stepOrder: 'desc' },
            select: { stepOrder: true },
          });
          const now = new Date();
          await this.prisma.workflowExecution.create({
            data: {
              userId,
              workflowId: resolvedWorkflowId,
              executionGroupId: executionLogger.executionGroupId,
              stepOrder: (lastStep?.stepOrder ?? 0) + 1,
              stepKey: 'execute.cancelled',
              stepName: '执行已终止',
              stepCategory: 'system',
              status: 'completed',
              inputData: { reason: error.message },
              outputData: { cancelled: true, message: error.message },
              startedAt: now,
              completedAt: now,
              durationMs: 0,
            },
          });
        }
        return;
      }

      // ── 失败处理 ─────────────────────────────────────────────
      if ((error as any)?.stepLog) {
        stepLogs.push((error as any).stepLog as WorkflowStepLogRecord);
      }

      const message = error instanceof Error ? error.message : String(error);
      this.loggerService.error(
        `工作流执行失败: group=${executionLogger.executionGroupId} | ${message}`,
        error instanceof Error ? error.stack : undefined,
        'Workflow',
      );

      await markExecutionRunFailed(this.prisma, executionLogger.executionGroupId, message);

      if (savedResumes.length > 0 && executeDto.saveToDatabase !== false) {
        await this.compensateWorkflowSavedResumes(userId, executionLogger, savedResumes, stepLogs);
      }

      const alreadyFailed = stepLogs.some((log) => log.status === 'failed');
      if (!alreadyFailed) {
        try {
          await executionLogger.runStep(
            {
              stepKey: 'execute.failed',
              stepName: '执行失败',
              stepCategory: 'system',
              inputData: { error: message },
            },
            async () => ({ error: message }),
          );
        } catch {
          // 二次失败忽略，避免掩盖原始错误
        }
      }
    }
  }

  /** 工作流执行失败时，删除本次 run 已入库的简历（补偿回滚） */
  private async compensateWorkflowSavedResumes(
    userId: number,
    executionLogger: WorkflowExecutionLogger,
    savedResumes: Array<{ id: number; title: string; templateId: string; lang: string }>,
    stepLogs: WorkflowStepLogRecord[],
  ): Promise<void> {
    const resumeIds = savedResumes.map((item) => item.id);
    try {
      const { log } = await executionLogger.runStep(
        {
          stepKey: 'execute.compensate',
          stepName: '失败回滚：删除已保存简历',
          stepCategory: 'database',
          inputData: { savedResumes, resumeIds, count: resumeIds.length },
        },
        async () => {
          const result = await this.prisma.resume.deleteMany({
            where: { userId, id: { in: resumeIds } },
          });
          return { deletedCount: result.count, resumeIds };
        },
      );
      stepLogs.push(log);
      this.loggerService.logBusinessEvent('WORKFLOW_EXECUTE_COMPENSATE', '已回滚部分保存的简历', {
        userId,
        executionGroupId: executionLogger.executionGroupId,
        deletedCount: resumeIds.length,
      });
    } catch (compensateError) {
      this.loggerService.error(
        `工作流补偿删除失败: group=${executionLogger.executionGroupId} | ${compensateError instanceof Error ? compensateError.message : compensateError}`,
        compensateError instanceof Error ? compensateError.stack : undefined,
        'Workflow',
      );
    }
  }

  executeTool(payload: { type: string; config?: Record<string, unknown>; input?: unknown }) {
    const result = executeToolNode(payload);
    return {
      success: result.success,
      data: result.output,
      message: result.message,
    };
  }

  async listExecutions(
    userId: number,
    params: { page?: number; limit?: number; runType?: string } = {},
  ) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;
    const runType = params.runType?.trim() || 'execute';

    const where =
      runType === 'all'
        ? { userId }
        : { userId, runType };

    const [total, runs] = await Promise.all([
      this.prisma.workflowExecutionRun.count({ where }),
      this.prisma.workflowExecutionRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    if (runs.length === 0) {
      return {
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total, totalPages: 0 },
        },
      };
    }

    const groupIds = runs.map((run) => run.id);
    const workflowIds = [...new Set(runs.map((run) => run.workflowId).filter((id): id is number => id != null))];

    const [stepCountRows, initSteps, completeSteps, workflows] = await Promise.all([
      this.prisma.workflowExecution.groupBy({
        by: ['executionGroupId'],
        where: { userId, executionGroupId: { in: groupIds } },
        _count: { id: true },
      }),
      this.prisma.workflowExecution.findMany({
        where: { userId, executionGroupId: { in: groupIds }, stepKey: 'execute.init' },
        select: { executionGroupId: true, inputData: true },
      }),
      this.prisma.workflowExecution.findMany({
        where: { userId, executionGroupId: { in: groupIds }, stepKey: 'execute.complete' },
        select: { executionGroupId: true, outputData: true },
      }),
      workflowIds.length > 0
        ? this.prisma.workflow.findMany({
            where: { id: { in: workflowIds } },
            select: { id: true, name: true, version: true },
          })
        : Promise.resolve([]),
    ]);

    const stepCountMap = new Map(
      stepCountRows.map((row) => [row.executionGroupId || '', row._count.id]),
    );
    const initMap = new Map(initSteps.map((row) => [row.executionGroupId || '', row.inputData]));
    const completeMap = new Map(completeSteps.map((row) => [row.executionGroupId || '', row.outputData]));
    const workflowMap = new Map(workflows.map((wf) => [wf.id, wf]));

    const items = runs.map((run) => {
      const initInput = (initMap.get(run.id) as Record<string, unknown>) || {};
      const executeDto = (initInput.executeDto as Record<string, unknown>) || {};
      const completeOutput = (completeMap.get(run.id) as Record<string, unknown>) || {};
      const savedResumes = Array.isArray(completeOutput.savedResumes)
        ? (completeOutput.savedResumes as Array<{ id: number; title: string; templateId: string; lang: string }>)
        : [];
      const workflow = run.workflowId ? workflowMap.get(run.workflowId) : undefined;

      return {
        executionGroupId: run.id,
        workflowId: run.workflowId,
        workflowName: workflow ? `${workflow.name} v${workflow.version}` : null,
        runType: run.runType,
        status: run.status,
        errorMessage: run.errorMessage,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        stepCount: stepCountMap.get(run.id) || 0,
        savedResumeCount: savedResumes.length,
        savedResumeTitles: savedResumes.map((item) => item.title).filter(Boolean),
        templateIds: Array.isArray(executeDto.templateIds) ? executeDto.templateIds : [],
        outputLanguages: Array.isArray(executeDto.outputLanguages) ? executeDto.outputLanguages : [],
      };
    });

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async cancelExecution(userId: number, executionGroupId: string) {
    const run = await this.prisma.workflowExecutionRun.findFirst({
      where: { id: executionGroupId, userId },
    });

    if (!run) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: '执行记录不存在' },
      });
    }

    if (run.status !== 'running') {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '只能终止执行中的工作流' },
      });
    }

    const cancelled = await markExecutionRunCancelled(
      this.prisma,
      executionGroupId,
      '用户手动终止执行',
    );

    if (!cancelled) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '工作流已结束，无法终止' },
      });
    }

    const now = new Date();
    await this.prisma.workflowExecution.updateMany({
      where: { userId, executionGroupId, status: 'running' },
      data: {
        status: 'failed',
        error: '用户手动终止执行',
        completedAt: now,
      },
    });

    const lastStep = await this.prisma.workflowExecution.findFirst({
      where: { userId, executionGroupId },
      orderBy: { stepOrder: 'desc' },
      select: { stepOrder: true, workflowId: true },
    });

    const existingCancelled = await this.prisma.workflowExecution.findFirst({
      where: { userId, executionGroupId, stepKey: 'execute.cancelled' },
      select: { id: true },
    });

    if (!existingCancelled) {
      await this.prisma.workflowExecution.create({
        data: {
          userId,
          workflowId: lastStep?.workflowId ?? run.workflowId ?? 0,
          executionGroupId,
          stepOrder: (lastStep?.stepOrder ?? 0) + 1,
          stepKey: 'execute.cancelled',
          stepName: '执行已终止',
          stepCategory: 'system',
          status: 'completed',
          inputData: { reason: '用户手动终止执行' },
          outputData: { cancelled: true, message: '用户手动终止执行' },
          startedAt: now,
          completedAt: now,
          durationMs: 0,
        },
      });
    }

    this.loggerService.logBusinessEvent('WORKFLOW_EXECUTE_CANCEL_REQUESTED', '用户终止工作流执行', {
      userId,
      executionGroupId,
      runType: run.runType,
    });

    return {
      success: true,
      message: '已请求终止执行，当前步骤完成后将停止',
      data: {
        executionGroupId,
        status: 'cancelled',
      },
    };
  }

  async getExecutionLogs(userId: number, executionGroupId: string) {
    const rows = await this.prisma.workflowExecution.findMany({
      where: { userId, executionGroupId },
      orderBy: { stepOrder: 'asc' },
    });

    const stepLogs: WorkflowStepLogRecord[] = rows.map((row) => ({
      id: row.id,
      executionGroupId: row.executionGroupId || executionGroupId,
      workflowId: row.workflowId || 0,
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
    }));

    const summary = buildExecutionStatusFromLogs(stepLogs);
    const run = await this.prisma.workflowExecutionRun.findFirst({
      where: { id: executionGroupId, userId },
      select: { status: true, errorMessage: true },
    });

    const status =
      run?.status === 'cancelled'
        ? 'cancelled'
        : run?.status === 'completed'
          ? 'completed'
          : run?.status === 'failed'
            ? 'failed'
            : summary.status;
    const progress = status === 'completed' ? 100 : summary.progress;
    const errorMessage =
      run?.status === 'cancelled'
        ? run.errorMessage || summary.errorMessage
        : run?.errorMessage || summary.errorMessage;

    return {
      success: true,
      data: {
        executionGroupId,
        workflowId: rows[0]?.workflowId ?? null,
        status,
        progress: progress,
        savedResumes: summary.savedResumes,
        workflowOutputs: summary.workflowOutputs,
        errorMessage,
        stepLogs,
      },
    };
  }
}
