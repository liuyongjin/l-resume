import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { MultiagentService } from '../multiagent/multiagent.service';
import { LlmModelsService } from '../workflows/llm-models.service';
import { OptimizeDto } from './dto/optimize.dto';
import { CheckDto } from './dto/check.dto';
import { RewriteDto } from './dto/rewrite.dto';
import { GenerateDto } from './dto/generate.dto';
import { AnalyzeDto } from './dto/analyze.dto';
import { MatchDto } from './dto/match.dto';
import { ResumeChatDto } from './dto/resume-chat.dto';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import {
  deriveSessionTitle,
  pickRandomChatPrompts,
} from './ai-chat.constants';
import {
  getTemplateThemeKey,
  mergeIntoTemplateScaffold,
  extractTranslatedResumeData,
} from '../common/resume-data.util';
import {
  detectResumeLanguage,
  getOppositeLanguage,
  getTranslatePrompt,
  getTranslateReplyMessage,
} from '../common/resume-language.util';
import {
  toTemplateSnapshot,
} from '../common/resume-record.util';
import {
  resolveTemplateDataSchema,
  resolveTemplateStyleSchema,
  filterDataSchemaByComponents,
} from '../templates/template-field-schemas';

function assertAgentChatReply(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '已完成简历修改建议。';

  const isLlmAuthFailure =
    /401|身份认证失败|API Key 未配置|invalid api key|authentication failed/i.test(trimmed);
  const isAgentFailure = /^处理失败:/i.test(trimmed) || /API HTTP Error/i.test(trimmed);

  if (isLlmAuthFailure) {
    throw new BadRequestException({
      success: false,
      error: {
        code: 5001,
        message: '大模型 API 认证失败，请检查 backend-agent-python/.env 中的 ZHIPU_API_KEY（模型配置见 config/llm-models.json）并重启 Python 服务',
      },
    });
  }

  if (isAgentFailure) {
    throw new InternalServerErrorException({
      success: false,
      error: {
        code: 5000,
        message: trimmed.replace(/^处理失败:\s*/i, '') || 'AI 对话服务暂时不可用',
      },
    });
  }

  return trimmed;
}

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private loggerService: LoggerService,
    private multiagentService: MultiagentService,
    private llmModelsService: LlmModelsService,
  ) {}

  // 模拟 AI 优化功能
  private optimizeContent(content: string, section: string): string[] {
    const optimizations: Record<string, string[]> = {
      personalSummary: [
        '具有丰富的工作经验和专业技术能力',
        '擅长团队协作，具备良好的沟通能力',
        '工作认真负责，注重细节，追求卓越',
      ],
      workExperience: [
        '主导并完成了多个重要项目',
        '提升了团队整体效率和产品质量',
        '优化了工作流程，降低了运营成本',
      ],
      projectExperience: [
        '采用先进的技术方案，解决了关键技术难题',
        '项目获得了客户的高度认可和好评',
        '技术方案具有可复用性和推广价值',
      ],
    };

    return optimizations[section] || ['内容已优化'];
  }

  // 模拟 AI 检查功能
  private checkResume(resumeData: any): { issues: string[]; score: number } {
    const issues = [];
    let score = 100;

    const summary = resumeData.professionalSummary || resumeData.personalSummary || '';
    const workExp = resumeData.workExperience || resumeData.experiences || [];
    const education = resumeData.education || [];
    const skills = resumeData.skills || [];
    const email = resumeData.basicInfo?.email || resumeData.contact?.email;

    if (!summary || String(summary).length < 20) {
      issues.push('个人简介过于简短，建议详细描述');
      score -= 15;
    }

    if (!Array.isArray(workExp) || workExp.length === 0) {
      issues.push('缺少工作经历描述');
      score -= 25;
    }

    const skillCount = Array.isArray(skills)
      ? skills.reduce((n: number, s: any) => n + (Array.isArray(s?.items) ? s.items.length : 1), 0)
      : 0;
    if (skillCount < 3) {
      issues.push('技能描述不足，建议添加更多技能');
      score -= 10;
    }

    if (!Array.isArray(education) || education.length === 0) {
      issues.push('缺少教育背景信息');
      score -= 15;
    }

    if (!email) {
      issues.push('缺少联系方式');
      score -= 10;
    }

    if (Array.isArray(workExp)) {
      workExp.forEach((work: any, index: number) => {
        const desc = work.description;
        const descText = Array.isArray(desc) ? desc.join('') : String(desc || '');
        if (descText.length < 10) {
          issues.push(`第${index + 1}份工作描述过于简短`);
          score -= 5;
        }
      });
    }

    return { issues, score: Math.max(0, score) };
  }

  // 模拟 AI 改写功能
  private rewriteContent(content: string, style: string): string {
    const rewriteStyles: Record<string, string> = {
      professional: '采用专业、正式的语言风格，强调工作能力和成就',
      concise: '简明扼要地表达核心信息，去除冗余内容',
      creative: '使用更具创意和表现力的表达方式',
    };

    return content ? `${rewriteStyles[style] || '已改写'}：${content}` : '内容已改写完成';
  }

  // 模拟 AI 智能填写功能
  private generateContent(section: string, context: any): any {
    const generatedContents = {
      personalSummary: [
        `作为一名${context.position || '软件工程师'}，我拥有${context.years || '3年以上'}的工作经验，擅长${context.skills || '全栈开发'}，具备良好的团队协作能力和项目管理经验。`,
        `本人${context.age || '30岁'}，${context.degree || '本科'}学历，在${context.industry || '互联网行业'}深耕${context.years || '5年'}，积累了丰富的实战经验。`,
        `性格开朗，学习能力强，能够快速适应新环境。具备扎实的专业基础和良好的沟通能力，善于解决复杂问题。`,
      ],
      workExperience: [
        `负责公司核心业务系统的设计与开发，主导完成了多个重要项目，提升了系统性能${context.performance || '30%'}。`,
        `带领团队完成技术架构升级，引入${context.tech || '微服务'}架构，提高了开发效率和系统稳定性。`,
        `参与需求分析、技术选型、方案设计等全过程，与产品、测试团队紧密协作，确保项目按时高质量交付。`,
      ],
      projectExperience: [
        `${context.project || '电商平台'}项目：负责后端系统开发，采用${context.tech || 'Spring Boot'}技术栈，实现了高并发、高性能的业务处理能力。`,
        `${context.project || '移动端App'}后端开发：设计RESTful API接口，支持百万级用户访问，保证了系统的稳定性和扩展性。`,
        `技术攻关项目：解决了${context.issue || '性能瓶颈'}问题，优化了系统响应速度，获得公司技术创新奖。`,
      ],
      skills: [
        'Java/Python/Go等主流编程语言',
        'Spring Boot/Django/Node.js等框架',
        'MySQL/PostgreSQL/Redis等数据库',
        'Docker/Kubernetes等容器化技术',
        'Git/SVN等版本控制工具',
      ],
      education: {
        school: ['北京大学', '清华大学', '浙江大学', '上海交通大学', '复旦大学'],
        major: ['计算机科学与技术', '软件工程', '信息管理与信息系统', '电子信息工程'],
        degree: ['本科', '硕士', '博士'],
      },
    };

    return generatedContents;
  }

  // 模拟 AI 关键词分析功能
  private analyzeKeywords(resumeData: any): any {
    const text = JSON.stringify(resumeData);
    const techKeywords = ['Java', 'Python', 'JavaScript', 'React', 'Vue', 'Spring', 'Node.js', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', '微服务'];
    const softSkills = ['沟通', '团队协作', '项目管理', '责任心', '学习能力', '创新', '抗压能力'];
    const experienceKeywords = ['项目经验', '工作经历', '实习', '创业', '管理经验'];

    const foundTech = techKeywords.filter(k => text.includes(k));
    const foundSoft = softSkills.filter(k => text.includes(k));
    const foundExp = experienceKeywords.filter(k => text.includes(k));

    return {
      technical: foundTech,
      softSkills: foundSoft,
      experience: foundExp,
      suggestions: [
        foundTech.length === 0 && '建议添加更多技术关键词',
        foundSoft.length < 3 && '建议突出软技能',
        foundExp.length === 0 && '建议详细描述项目经验',
      ].filter(Boolean),
    };
  }

  // 模拟 AI 职位匹配功能
  private matchJob(resumeData: any, jobDescription: string): any {
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const jobText = jobDescription.toLowerCase();

    const requiredSkills = ['java', 'python', 'react', 'spring', 'mysql', 'node', 'docker'];
    const preferredSkills = ['kubernetes', 'aws', '微服务', 'redis'];

    let requiredMatch = 0;
    let preferredMatch = 0;

    requiredSkills.forEach(skill => {
      if (resumeText.includes(skill) && jobText.includes(skill)) {
        requiredMatch++;
      }
    });

    preferredSkills.forEach(skill => {
      if (resumeText.includes(skill) && jobText.includes(skill)) {
        preferredMatch++;
      }
    });

    const matchScore = Math.round(((requiredMatch / requiredSkills.length) * 60) + ((preferredMatch / preferredSkills.length) * 40));

    const missingSkills = requiredSkills.filter(skill =>
      jobText.includes(skill) && !resumeText.includes(skill),
    );

    const recommendedSkills = preferredSkills.filter(skill =>
      jobText.includes(skill) && !resumeText.includes(skill),
    );

    return {
      matchScore,
      matchLevel: matchScore >= 80 ? '高度匹配' : matchScore >= 60 ? '较好匹配' : matchScore >= 40 ? '部分匹配' : '匹配度较低',
      matchedSkills: {
        required: requiredSkills.filter(s => resumeText.includes(s) && jobText.includes(s)),
        preferred: preferredSkills.filter(s => resumeText.includes(s) && jobText.includes(s)),
      },
      missingSkills,
      recommendedSkills,
      suggestions: [
        ...missingSkills.map(s => `建议补充技能：${s}`),
        ...recommendedSkills.map(s => `建议学习技能：${s}`),
      ],
    };
  }

  async optimize(userId: number, optimizeDto: OptimizeDto) {
    const { resumeId, section, content } = optimizeDto;
    this.loggerService.logServiceCall('AiService', 'optimize', { userId, resumeId, section });

    const optimizedContent = this.optimizeContent(content, section);

    this.loggerService.logBusinessEvent('AI_OPTIMIZE', 'AI优化完成', { userId, resumeId, section });

    return {
      optimized: optimizedContent,
      suggestions: [
        '建议使用量化数据展示工作成果',
        '突出个人核心竞争力',
        '注意语言的精炼和准确性',
      ],
    };
  }

  async check(userId: number, checkDto: CheckDto) {
    const { resumeId, resumeData: dtoResumeData } = checkDto;
    this.loggerService.logServiceCall('AiService', 'check', { userId, resumeId });

    let resumeData: any = dtoResumeData || {};

    if (!dtoResumeData && resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        this.loggerService.warn(`AI检查失败: 简历不存在 - userId=${userId}, resumeId=${resumeId}`, 'AI');
        throw new NotFoundException({
          success: false,
          error: {
            code: 3001,
            message: '简历不存在',
          },
        });
      }

      resumeData = resume.data as any || {};
    }

    const result = this.checkResume(resumeData);

    this.loggerService.logBusinessEvent('AI_CHECK', 'AI检查完成', { userId, resumeId, score: result.score });

    return {
      issues: result.issues,
      score: result.score,
    };
  }

  async rewrite(userId: number, rewriteDto: RewriteDto) {
    const { resumeId, section, style } = rewriteDto;

    let content = '';

    if (resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 3001,
            message: '简历不存在',
          },
        });
      }

      const data = resume.data as Record<string, unknown>;
      const sectionFieldMap: Record<string, string> = {
        summary: 'professionalSummary',
        personalSummary: 'professionalSummary',
        experience: 'workExperience',
        experiences: 'workExperience',
        projects: 'projectExperience',
      };
      const field = sectionFieldMap[section] || section;
      content = String(data[field] ?? data[section] ?? '');
    }

    const rewritten = this.rewriteContent(content, style || 'professional');

    return {
      rewritten,
    };
  }

  async generate(userId: number, generateDto: GenerateDto) {
    const { section, context } = generateDto;

    const generated = this.generateContent(section, context || {});
    const content = generated[section] ?? generated;

    return {
      content,
      generated: content,
    };
  }

  async analyze(userId: number, analyzeDto: AnalyzeDto) {
    const { resumeId, resumeData: dtoResumeData } = analyzeDto;

    let resumeData: any = dtoResumeData || {};

    if (!dtoResumeData && resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 3001,
            message: '简历不存在',
          },
        });
      }

      resumeData = resume.data as any || {};
    }

    const result = this.analyzeKeywords(resumeData);

    return {
      technical: result.technical,
      softSkills: result.softSkills,
      experience: result.experience,
      suggestions: result.suggestions,
    };
  }

  async match(userId: number, matchDto: MatchDto) {
    const { resumeId, jobDescription } = matchDto;

    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '职位描述不能为空',
        },
      });
    }

    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    const result = this.matchJob(resume.data as any || {}, jobDescription);

    return {
      matchScore: result.matchScore,
      matchLevel: result.matchLevel,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      recommendedSkills: result.recommendedSkills,
      suggestions: result.suggestions,
    };
  }

  private async resolveTemplateByThemeKey(templateIdOrThemeKey: string) {
    const byId = await this.prisma.template.findUnique({
      where: { id: templateIdOrThemeKey },
    });
    if (byId) return byId;

    const activeTemplates = await this.prisma.template.findMany({
      where: { isActive: true },
    });
    return (
      activeTemplates.find((tpl) => getTemplateThemeKey(tpl) === templateIdOrThemeKey) || null
    );
  }

  private async assertResumeOwned(userId: number, resumeId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: '简历不存在' },
      });
    }
    return resume;
  }

  getChatPrompts(count = 6) {
    return { prompts: pickRandomChatPrompts(count) };
  }

  async listChatSessions(userId: number, resumeId: number) {
    await this.assertResumeOwned(userId, resumeId);
    const sessions = await this.prisma.resumeAiChatSession.findMany({
      where: { userId, resumeId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        modelId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        modelId: s.modelId,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };
  }

  async createChatSession(userId: number, dto: CreateChatSessionDto) {
    await this.assertResumeOwned(userId, dto.resumeId);
    const modelId = dto.modelId
      ? await this.llmModelsService.resolveActiveModelId(dto.modelId)
      : await this.llmModelsService.getDefaultModelId();

    const session = await this.prisma.resumeAiChatSession.create({
      data: {
        userId,
        resumeId: dto.resumeId,
        title: dto.title?.trim() || '新对话',
        modelId,
      },
    });

    return { session };
  }

  async getChatSession(userId: number, sessionId: string) {
    const session = await this.prisma.resumeAiChatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: '会话不存在' },
      });
    }

    return {
      session: {
        id: session.id,
        resumeId: session.resumeId,
        title: session.title,
        modelId: session.modelId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          createdAt: m.createdAt,
        })),
      },
    };
  }

  private async resolveChatSession(
    userId: number,
    resumeId: number,
    sessionId: string | undefined,
    modelId: string,
    firstMessage: string,
  ) {
    if (sessionId) {
      const existing = await this.prisma.resumeAiChatSession.findFirst({
        where: { id: sessionId, userId, resumeId },
      });
      if (!existing) {
        throw new NotFoundException({
          success: false,
          error: { code: 3001, message: '会话不存在' },
        });
      }
      if (modelId && existing.modelId !== modelId) {
        await this.prisma.resumeAiChatSession.update({
          where: { id: existing.id },
          data: { modelId },
        });
      }
      return existing;
    }

    return this.prisma.resumeAiChatSession.create({
      data: {
        userId,
        resumeId,
        title: deriveSessionTitle(firstMessage),
        modelId,
      },
    });
  }

  private async loadSessionHistoryForAgent(sessionId: string) {
    const rows = await this.prisma.resumeAiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    return rows.map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }));
  }

  private async persistChatMessages(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    metadata: Record<string, unknown>,
    isNewSession: boolean,
    sessionTitle?: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.resumeAiChatMessage.create({
        data: {
          sessionId,
          role: 'user',
          content: userMessage,
          metadata: {},
        },
      }),
      this.prisma.resumeAiChatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: assistantMessage,
          metadata: metadata as object,
        },
      }),
      this.prisma.resumeAiChatSession.update({
        where: { id: sessionId },
        data: {
          ...(isNewSession && sessionTitle ? { title: sessionTitle } : {}),
          updatedAt: new Date(),
        },
      }),
    ]);
  }

  async resumeChat(userId: number, dto: ResumeChatDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: dto.resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: { code: 3001, message: '简历不存在' },
      });
    }

    const resumeData = (dto.resumeData || resume.data) as Record<string, unknown>;
    const style = (dto.style || resume.style || {}) as Record<string, unknown>;
    const modelId = await this.llmModelsService.resolveActiveModelId(dto.modelId);
    const actionType = dto.actionType || 'chat';
    const isNewSession = !dto.sessionId;

    const session = await this.resolveChatSession(
      userId,
      dto.resumeId,
      dto.sessionId,
      modelId,
      dto.message,
    );

    this.loggerService.logServiceCall('AiService', 'resumeChat', {
      userId,
      resumeId: dto.resumeId,
      sessionId: session.id,
      templateId: resume.templateId,
      modelId,
      actionType,
      messageLength: dto.message.length,
    });

    try {
      if (actionType === 'translate' || actionType === 'translate_en' || actionType === 'translate_zh') {
        const sourceLang = detectResumeLanguage(resumeData);
        const targetLang =
          actionType === 'translate_en'
            ? 'en'
            : actionType === 'translate_zh'
              ? 'zh'
              : getOppositeLanguage(sourceLang);
        const translateResult = await this.multiagentService.translate(userId, {
          resumeData,
          targetLanguage: targetLang,
        });
        const translated = extractTranslatedResumeData(translateResult);
        const mergedResumeData = mergeIntoTemplateScaffold(resumeData, translated, {
          preserveExistingFields: false,
        });
        const userMessage =
          dto.message?.trim() || getTranslatePrompt(targetLang);
        const replyMessage = getTranslateReplyMessage(targetLang);

        await this.persistChatMessages(
          session.id,
          userMessage,
          replyMessage,
          { resumeData: mergedResumeData, actionType: 'translate', targetLanguage: targetLang },
          isNewSession,
          targetLang === 'en' ? '翻译为英文' : '翻译为中文',
        );

        return {
          sessionId: session.id,
          message: replyMessage,
          resumeData: mergedResumeData,
          modelId,
          actionType: 'translate',
          targetLanguage: targetLang,
        };
      }

      const template = await this.resolveTemplateByThemeKey(resume.templateId || 'frontendEngineer');
      if (!template) {
        throw new BadRequestException({
          success: false,
          error: { code: 3001, message: `模板不存在: ${resume.templateId}` },
        });
      }

      const templateSnapshot = toTemplateSnapshot(template);
      const templateConfig = (templateSnapshot.config || {}) as Record<string, unknown>;
      const components = Array.isArray(templateConfig.components)
        ? (templateConfig.components as string[])
        : undefined;
      const dataSchema = filterDataSchemaByComponents(
        resolveTemplateDataSchema(template.dataSchema),
        components,
      );
      const styleSchema = resolveTemplateStyleSchema(template.styleSchema);
      const history = dto.sessionId
        ? await this.loadSessionHistoryForAgent(session.id)
        : (dto.history || []);

      const agentResult = await this.multiagentService.resumeChatEdit({
        message: dto.message,
        history,
        modelId,
        resumeData,
        resumeRecord: {
          title: resume.title,
          templateId: resume.templateId,
          style,
        },
        templateSnapshot: templateSnapshot as unknown as Record<string, unknown>,
        dataSchema,
        styleSchema,
      });

      const output = (agentResult as any)?.output_data || agentResult || {};
      const replyMessage = assertAgentChatReply(
        typeof output.message === 'string' ? output.message : '',
      );

      const patchData =
        output.resumeData && typeof output.resumeData === 'object'
          ? (output.resumeData as Record<string, unknown>)
          : output.resume_data && typeof output.resume_data === 'object'
            ? (output.resume_data as Record<string, unknown>)
            : null;

      const mergedResumeData = patchData
        ? mergeIntoTemplateScaffold(resumeData, patchData, { preserveExistingFields: true })
        : undefined;

      const titlePatch =
        typeof output.title === 'string' && output.title.trim() ? output.title.trim() : undefined;
      const stylePatch =
        output.style && typeof output.style === 'object'
          ? { ...style, ...(output.style as Record<string, unknown>) }
          : undefined;

      const assistantMetadata: Record<string, unknown> = { actionType: 'chat' };
      if (mergedResumeData) assistantMetadata.resumeData = mergedResumeData;
      if (titlePatch) assistantMetadata.title = titlePatch;
      if (stylePatch) assistantMetadata.style = stylePatch;

      await this.persistChatMessages(
        session.id,
        dto.message,
        replyMessage,
        assistantMetadata,
        isNewSession,
        deriveSessionTitle(dto.message),
      );

      return {
        sessionId: session.id,
        message: replyMessage,
        resumeData: mergedResumeData,
        title: titlePatch,
        style: stylePatch,
        modelId,
        actionType,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as Error;
      this.loggerService.error(`AI 简历对话失败: ${err.message}`, err.stack, 'AiService');
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 5000,
          message: err.message || 'AI 对话服务暂时不可用',
        },
      });
    }
  }
}