import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { GenerateVersionsDto } from './dto/generate-versions.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { AnalyzeMatchDto } from './dto/analyze-match.dto';
import { TranslateResumeDto } from './dto/translate-resume.dto';
import { ParseResumeDto } from './dto/parse-resume.dto';
import { WorkflowResumeRecord, buildInitialResumeRecord, normalizeParsedResumeRecord, toTemplateSnapshot } from '../common/resume-record.util';
import { getDefaultDataSchema, getDefaultStyleSchema } from '../templates/template-field-schemas';
import {
  mergeIntoTemplateScaffold,
  parseRawTextHeuristic,
  hasMeaningfulStructuredSections,
} from '../common/resume-data.util';
import { getAgentRuntimeConfig, getNestRuntimeConfig } from '../workflows/llm-models.constants';

@Injectable()
export class MultiagentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  private getMultiagentUrl(): string {
    return this.configService.get('MULTIAGENT_SERVICE_URL') || 'http://127.0.0.1:5001';
  }

  private getNestRuntime() {
    return getNestRuntimeConfig();
  }

  private getAgentRuntime() {
    return getAgentRuntimeConfig();
  }

  /** 探测 Python 多智能体服务是否可用 */
  async checkHealth(): Promise<{ available: boolean; url: string; detail?: Record<string, unknown> }> {
    const url = this.getMultiagentUrl();
    this.loggerService.logServiceCall('MultiagentService', 'checkHealth', { url });
    try {
      const response = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(this.getNestRuntime().multiagentHealthTimeoutMs),
      });
      if (!response.ok) {
        this.loggerService.warn(`多智能体健康检查失败: HTTP ${response.status}`, 'Multiagent');
        return { available: false, url };
      }
      const detail = (await response.json()) as Record<string, unknown>;
      this.loggerService.logBusinessEvent('MULTIAGENT_HEALTH', '多智能体服务可用', { url, status: detail.status });
      return { available: true, url, detail };
    } catch (error) {
      this.loggerService.warn(`多智能体服务不可用: ${error.message}`, 'Multiagent');
      return { available: false, url };
    }
  }

  private summarizeResumeData(resumeData: unknown): Record<string, unknown> {
    if (!resumeData || typeof resumeData !== 'object') return { empty: true };
    const data = resumeData as Record<string, unknown>;
    const basic = (data.basicInfo as Record<string, unknown>) || {};
    return {
      keys: Object.keys(data),
      name: basic.name || '',
      position: basic.position || basic.title || '',
      textLength: typeof data.professionalSummary === 'string' ? data.professionalSummary.length : 0,
      rawTextLength: typeof data.rawText === 'string' ? data.rawText.length : 0,
    };
  }

  private async parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
    const rawText = await response.text();
    if (!rawText.trim()) {
      throw new Error(`多智能体服务返回空响应 (HTTP ${response.status})`);
    }
    try {
      return JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      throw new Error(`多智能体服务响应格式错误 (HTTP ${response.status})`);
    }
  }

  private async callMultiagent<T = unknown>(
    path: string,
    body: Record<string, unknown>,
    action: string,
  ): Promise<T> {
    const url = `${this.getMultiagentUrl()}${path}`;
    const inputSummary = {
      action,
      path,
      resumeSummary: this.summarizeResumeData(body.resumeData),
      targetRole: body.targetRole || '',
      templateId: body.templateId,
      workflowNodesCount: Array.isArray(body.workflowNodes) ? body.workflowNodes.length : 0,
      agentConfigKeys: body.agentConfigs ? Object.keys(body.agentConfigs as object) : [],
    };
    this.loggerService.logBusinessEvent('MULTIAGENT_CALL_START', action, inputSummary);

    const startedAt = Date.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.getNestRuntime().multiagentCallTimeoutMs),
      });

      const result = await this.parseJsonResponse(response);
      const durationMs = Date.now() - startedAt;

      if (!response.ok || !result.success) {
        const message = (result?.error as { message?: string } | undefined)?.message || `HTTP ${response.status}`;
        this.loggerService.error(
          `[MULTIAGENT_CALL_FAIL] ${action} | ${durationMs}ms | ${message}`,
          JSON.stringify(result),
          'Multiagent',
        );
        throw new Error(message);
      }

      const payload = (result.data ?? result) as Record<string, unknown>;
      const outputData = (payload.output_data ?? payload) as Record<string, unknown>;
      this.loggerService.logBusinessEvent('MULTIAGENT_CALL_SUCCESS', action, {
        durationMs,
        qpsLimit: this.getAgentRuntime().qpsLimit,
        outputKeys: Object.keys(outputData),
        versionsCount: Array.isArray(outputData.versions) ? outputData.versions.length : 0,
        status: outputData.status,
      });
      this.loggerService.debug(`[MULTIAGENT_OUTPUT] ${action}: ${JSON.stringify(outputData).slice(0, 2000)}`, 'Multiagent');

      return payload as T;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.loggerService.error(
        `[MULTIAGENT_CALL_ERROR] ${action} | ${durationMs}ms | ${error.message}`,
        error.stack,
        'Multiagent',
      );
      throw error;
    }
  }

  async getCapabilities() {
    this.loggerService.logServiceCall('MultiagentService', 'getCapabilities', {});
    const health = await this.checkHealth();
    try {
      if (health.available) {
        const response = await fetch(`${this.getMultiagentUrl()}/api/agents/capabilities`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            this.loggerService.logBusinessEvent('MULTIAGENT_CAPABILITIES', '获取多智能体能力成功', {
              workflows: result.data.workflows?.length || 0,
              serviceAvailable: true,
            });
            return { ...result.data, serviceAvailable: true };
          }
        }
      }
    } catch (error) {
      this.loggerService.warn(`多智能体能力查询失败: ${error.message}`, 'Multiagent');
    }

    this.loggerService.warn('多智能体服务不可用，返回本地能力列表', 'Multiagent');
    return {
      serviceAvailable: health.available,
      workflows: [
        {
          type: 'generate_versions',
          name: '多版本生成',
          description: '基于原始简历生成多个不同风格的版本',
          agents: ['analyzer', 'writer', 'reviewer'],
          estimated_time: '30-60秒',
        },
        {
          type: 'optimize_resume',
          name: '简历优化',
          description: '分析并优化现有简历内容',
          agents: ['analyzer', 'optimizer', 'reviewer'],
          estimated_time: '20-40秒',
        },
        {
          type: 'analyze_match',
          name: '匹配度分析',
          description: '分析简历与目标职位的匹配程度',
          agents: ['analyzer'],
          estimated_time: '10-20秒',
        },
        {
          type: 'translate',
          name: '简历翻译',
          description: '将中文简历翻译成英文',
          agents: ['translator'],
          estimated_time: '10-30秒',
        },
      ],
      agent_types: [
        { type: 'planner', role: '规划者', description: '制定任务执行计划' },
        { type: 'analyzer', role: '分析者', description: '分析简历内容和职位要求' },
        { type: 'writer', role: '撰写者', description: '生成和撰写简历内容' },
        { type: 'reviewer', role: '审核者', description: '审核和评估简历质量' },
        { type: 'optimizer', role: '优化者', description: '优化和改进简历内容' },
        { type: 'translator', role: '翻译者', description: '翻译简历内容' },
      ],
    };
  }

  async generateVersions(userId: number, generateVersionsDto: GenerateVersionsDto) {
    const {
      resumeId,
      resumeData,
      targetRole,
      templateId,
      versionsCount = 2,
      styles = ['专业', '创意'],
      generateEnglish = false,
      englishVersionsCount = 0,
      industry,
      experienceLevel,
      workflowNodes,
      agentConfigs,
    } = generateVersionsDto;
    this.loggerService.logServiceCall('MultiagentService', 'generateVersions', { userId, resumeId, targetRole, templateId, versionsCount, generateEnglish });

    let dataToSend = resumeData;

    if (resumeId && !resumeData) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        this.loggerService.warn(`多版本生成失败: 简历不存在 - userId=${userId}, resumeId=${resumeId}`, 'Multiagent');
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '简历不存在' },
        });
      }
      dataToSend = resume.data;
    }

    if (!dataToSend) {
      this.loggerService.warn(`多版本生成失败: 简历数据为空 - userId=${userId}`, 'Multiagent');
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '简历数据不能为空（请提供 resumeData 或 resumeId）' },
      });
    }

    try {
      const result = await this.callMultiagent('/api/agents/generate-versions', {
        resumeData: dataToSend,
        targetRole: targetRole || '',
        templateId: this.normalizeTemplateId(templateId || 'classic'),
        versionsCount,
        styles,
        generateEnglish,
        englishVersionsCount,
        industry: industry || '互联网',
        experienceLevel: experienceLevel || 'mid',
        workflowNodes: workflowNodes || [],
        agentConfigs: agentConfigs || {},
      }, 'generateVersions') as Record<string, any>;

      this.loggerService.logBusinessEvent('MULTIAGENT_GENERATE', '多版本生成成功', { userId, resumeId, versionsCount });
      return result;
    } catch (error) {
      this.loggerService.error(`多版本生成失败: ${error.message}`, error.stack, 'Multiagent');
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 5000,
          message: error.message || '多智能体服务暂时不可用，请确保 Python 服务已启动',
        },
      });
    }
  }

  private normalizeTemplateId(templateId: string): string {
    const map: Record<string, string> = {
      frontendEngineer: 'classic',
      modern: 'modern',
      creative: 'creative',
      data: 'data',
      amber: 'amber',
      purple: 'purple',
      developer: 'developer',
    };
    return map[templateId] || templateId;
  }

  /** 按工作流设计器节点配置执行单个智能体节点 */
  async runWorkflowNode(
    userId: number,
    params: {
      node: Record<string, unknown>;
      resumeData: Record<string, unknown>;
      resumeRecord?: WorkflowResumeRecord;
      targetRole?: string;
      templateId?: string;
      industry?: string;
      experienceLevel?: string;
      styles?: string[];
      agentConfigs?: Record<string, any>;
    },
  ) {
    this.loggerService.logServiceCall('MultiagentService', 'runWorkflowNode', {
      userId,
      nodeId: params.node?.id,
      nodeType: params.node?.type,
      agentType: params.node?.agentType,
      model: (params.node?.config as Record<string, unknown> | undefined)?.model,
      hasSystemPrompt: Boolean((params.node?.config as Record<string, unknown> | undefined)?.systemPrompt),
      agentConfigKeys: Object.keys(params.agentConfigs || {}),
    });

    try {
      const result = await this.callMultiagent(
        '/api/agents/run-node',
        {
          node: params.node,
          context: {
            resumeData: params.resumeData,
            resumeRecord: params.resumeRecord || {},
            targetRole: params.targetRole || '',
            templateId: this.normalizeTemplateId(params.templateId || 'classic'),
            industry: params.industry || '互联网',
            experienceLevel: params.experienceLevel || 'mid',
            styles: params.styles || ['专业版'],
            agentConfigs: params.agentConfigs || {},
          },
        },
        'runWorkflowNode',
      ) as Record<string, any>;

      const payload = result?.data || result;
      if (payload?.status === 'failed' || payload?.output_data?.error) {
        throw new Error(payload?.output_data?.error || '节点执行失败');
      }

      return payload;
    } catch (error) {
      this.loggerService.error(`工作流节点执行失败: ${error.message}`, error.stack, 'Multiagent');
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 5000,
          message: error.message || '多智能体节点执行失败',
        },
      });
    }
  }

  async optimize(userId: number, optimizeResumeDto: OptimizeResumeDto) {
    const { resumeId, resumeData, optimizationFocus = [], agentConfigs } = optimizeResumeDto;

    let dataToSend = resumeData;

    if (resumeId && !resumeData) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '简历不存在' },
        });
      }
      dataToSend = resume.data;
    }

    if (!dataToSend) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '简历数据不能为空（请提供 resumeData 或 resumeId）' },
      });
    }

    try {
      const response = await fetch(`${this.getMultiagentUrl()}/api/agents/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: dataToSend,
          optimizationFocus,
          agentConfigs: agentConfigs || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Multiagent service error: ${response.status}`);
      }

      const result = await response.json();

      return result.data || result;
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: { code: 5000, message: '多智能体服务暂时不可用' },
      });
    }
  }

  async analyzeMatch(userId: number, analyzeMatchDto: AnalyzeMatchDto) {
    const { resumeId, resumeData, jobDescription, agentConfigs } = analyzeMatchDto;

    if (!jobDescription) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '职位描述不能为空' },
      });
    }

    let dataToSend = resumeData;

    if (resumeId && !resumeData) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '简历不存在' },
        });
      }
      dataToSend = resume.data;
    }

    if (!dataToSend) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '简历数据不能为空（请提供 resumeData 或 resumeId）' },
      });
    }

    try {
      const response = await fetch(`${this.getMultiagentUrl()}/api/agents/analyze-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: dataToSend,
          jobDescription,
          agentConfigs: agentConfigs || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Multiagent service error: ${response.status}`);
      }

      const result = await response.json();

      return result.data || result;
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: { code: 5000, message: '多智能体服务暂时不可用' },
      });
    }
  }

  async parseResume(userId: number, parseResumeDto: ParseResumeDto) {
    const {
      resumeData,
      resumeRecord,
      rawText,
      templateSchema,
      dataSchema,
      styleSchema,
      templateSnapshot,
      targetRole,
    } = parseResumeDto;
    this.loggerService.logServiceCall('MultiagentService', 'parseResume', {
      userId,
      hasResumeData: Boolean(resumeData),
      hasResumeRecord: Boolean(resumeRecord),
      rawTextLength: rawText?.length || 0,
      hasTemplateSchema: Boolean(templateSchema),
      hasDataSchema: Boolean(dataSchema),
      hasStyleSchema: Boolean(styleSchema),
      hasTemplateSnapshot: Boolean(templateSnapshot),
    });

    const snapshot = templateSnapshot
      ? toTemplateSnapshot(templateSnapshot as Parameters<typeof toTemplateSnapshot>[0])
      : null;
    const scaffold = (templateSchema as Record<string, unknown>) || snapshot?.data || {};
    const resolvedDataSchema = dataSchema || snapshot?.dataSchema;
    const resolvedStyleSchema = styleSchema || snapshot?.styleSchema;

    const baseRecord: WorkflowResumeRecord = resumeRecord
      ? normalizeParsedResumeRecord(resumeRecord as Record<string, unknown>, {
          title: (resumeRecord.title as string) || '未命名简历',
          data: (resumeRecord.data as Record<string, unknown>) || (resumeData as Record<string, unknown>) || {},
          style: resumeRecord.style as Record<string, unknown> | undefined,
          templateId: resumeRecord.templateId as string | undefined,
          source: resumeRecord.source as string | undefined,
          isFavorite: resumeRecord.isFavorite as boolean | undefined,
          shareToken: resumeRecord.shareToken as string | null | undefined,
          shareExpiresAt: resumeRecord.shareExpiresAt as string | null | undefined,
        })
      : buildInitialResumeRecord({
          templateSnapshot: snapshot || {
            id: 'classic',
            name: '默认模板',
            data: scaffold,
            style: {},
            dataSchema: (resolvedDataSchema as Record<string, unknown>) || getDefaultDataSchema(),
            styleSchema: (resolvedStyleSchema as Record<string, unknown>) || getDefaultStyleSchema(),
            config: {},
          },
          themeKey: snapshot?.id || 'classic',
          resumeData: resumeData as Record<string, unknown>,
          rawText,
        });

    const mergedInput = mergeIntoTemplateScaffold(scaffold, {
      ...baseRecord.data,
      rawText: rawText || (baseRecord.data as any)?.rawText,
    }, { preferParsedOnly: true });

    try {
      const result = (await this.callMultiagent(
        '/api/agents/parse-resume',
        {
          resumeRecord: { ...baseRecord, data: mergedInput },
          resumeData: mergedInput,
          rawText: rawText || (mergedInput as any).rawText || '',
          templateSchema: scaffold,
          templateSnapshot: snapshot,
          dataSchema: resolvedDataSchema,
          styleSchema: resolvedStyleSchema,
          targetRole: targetRole || '',
        },
        'parseResume',
      )) as Record<string, any>;

      const parsedRaw = result?.output_data?.parsed || result?.parsed || baseRecord;
      let parsed = normalizeParsedResumeRecord(
        parsedRaw as Record<string, unknown>,
        { ...baseRecord, data: mergedInput },
      );

      const text = rawText || (mergedInput as Record<string, unknown>).rawText as string || '';
      // LLM 常返回空骨架（含占位 skills），需用 rawText 规则解析回填
      let usedHeuristic = false;
      if (text && !hasMeaningfulStructuredSections(parsed.data as Record<string, unknown>)) {
        usedHeuristic = true;
        this.loggerService.warn(
          `AI 解析结果缺少有效结构化字段，启用本地规则解析 (rawText=${text.length})`,
          'Multiagent',
        );
        const heuristic = parseRawTextHeuristic(text);
        parsed = normalizeParsedResumeRecord(
          { ...parsed, data: mergeIntoTemplateScaffold(parsed.data, heuristic, { preferParsedOnly: true }) },
          parsed,
        );
      }

      return {
        output_data: {
          parsed: parsed.data,
          parsedRecord: parsed,
          fallback: usedHeuristic,
        },
      };
    } catch (error) {
      this.loggerService.warn(`智能体解析失败，使用本地规则解析: ${error.message}`, 'Multiagent');
      const text = rawText || (mergedInput as Record<string, unknown>).rawText as string || '';
      const heuristic = text ? parseRawTextHeuristic(text) : mergedInput;
      const fallback = normalizeParsedResumeRecord(
        { ...baseRecord, data: mergeIntoTemplateScaffold(mergedInput, heuristic, { preferParsedOnly: true }) },
        baseRecord,
      );
      return { output_data: { parsed: fallback.data, parsedRecord: fallback, fallback: true } };
    }
  }

  async translate(userId: number, translateResumeDto: TranslateResumeDto) {
    const { resumeData, targetLanguage = 'en' } = translateResumeDto;

    if (!resumeData) {
      throw new BadRequestException({
        success: false,
        error: { code: 1001, message: '简历数据不能为空' },
      });
    }

    try {
      const response = await fetch(`${this.getMultiagentUrl()}/api/agents/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Multiagent service error: ${response.status}`);
      }

      const result = await response.json();

      return result.data || result;
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: { code: 5000, message: '多智能体服务暂时不可用，请确保Python服务已启动' },
      });
    }
  }

  async resumeChatEdit(body: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    modelId?: string;
    resumeData: Record<string, unknown>;
    resumeRecord: Record<string, unknown>;
    templateSnapshot: Record<string, unknown>;
    dataSchema: Record<string, unknown>;
    styleSchema: Record<string, unknown>;
  }) {
    return this.callMultiagent('/api/agents/resume-chat-edit', body, 'resumeChatEdit');
  }

  /** 全局助手可用 Skills 列表 */
  async getAssistantSkills(): Promise<{ skills: unknown[] }> {
    const url = `${this.getMultiagentUrl()}/api/agents/assistant-skills`;
    this.loggerService.logServiceCall('MultiagentService', 'getAssistantSkills', {});
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.getNestRuntime().multiagentHealthTimeoutMs),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = (await response.json()) as {
        success?: boolean;
        data?: { skills?: unknown[] };
      };
      return { skills: result.data?.skills || [] };
    } catch (error) {
      this.loggerService.warn(`获取助手 Skills 失败: ${error.message}`, 'Multiagent');
      return {
        skills: [
          {
            id: 'create_resume_from_template',
            name: '根据模板创建简历',
            description: '打开模板中心或按指定模板创建简历并进入编辑器',
          },
          {
            id: 'start_smart_execution',
            name: '智能执行创建简历',
            description: '打开智能执行页，上传简历经工作流生成多版本',
          },
        ],
      };
    }
  }

  /** 全局助手流式对话：返回上游 Response，由调用方管道转发 SSE */
  async streamAssistantChat(body: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    modelId?: string;
  }): Promise<globalThis.Response> {
    const url = `${this.getMultiagentUrl()}/api/agents/assistant-chat/stream`;
    const nestRuntime = this.getNestRuntime();
    const streamTimeoutMs =
      nestRuntime.multiagentStreamTimeoutMs ||
      Math.max(nestRuntime.multiagentCallTimeoutMs || 180000, 300000);

    this.loggerService.logServiceCall('MultiagentService', 'streamAssistantChat', {
      messageLength: body.message?.length || 0,
      historyLen: body.history?.length || 0,
      modelId: body.modelId,
      streamTimeoutMs,
    });

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        // 覆盖整段 SSE 读写；助手回复常 >40s，需长于普通 JSON 调用
        signal: AbortSignal.timeout(streamTimeoutMs),
      });
    } catch (error) {
      const msg = (error as Error)?.message || String(error);
      this.loggerService.warn(`全局助手流式请求失败: ${msg}`, 'Multiagent');
      const timedOut = /abort|timeout/i.test(msg);
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 5000,
          message: timedOut
            ? '助手回复超时，请稍后重试（模型响应较慢或 Agent 繁忙）'
            : '多智能体服务暂时不可用，请确保 Python Agent 已启动',
        },
      });
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      let message = `多智能体流式接口错误 (HTTP ${response.status})`;
      try {
        const json = JSON.parse(text) as { error?: { message?: string }; message?: string };
        message = json?.error?.message || json?.message || message;
      } catch {
        const trimmed = text.replace(/\s+/g, ' ').trim();
        if (trimmed && trimmed.length < 300) message = trimmed;
      }
      this.loggerService.warn(`全局助手上游失败: ${message}`, 'Multiagent');
      throw new InternalServerErrorException({
        success: false,
        error: { code: 5000, message },
      });
    }

    return response;
  }
}