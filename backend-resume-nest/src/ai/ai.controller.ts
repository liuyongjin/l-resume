import { Controller, Post, Body, Request, HttpCode, HttpStatus, Get, Query, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OptimizeDto } from './dto/optimize.dto';
import { CheckDto } from './dto/check.dto';
import { RewriteDto } from './dto/rewrite.dto';
import { GenerateDto } from './dto/generate.dto';
import { AnalyzeDto } from './dto/analyze.dto';
import { MatchDto } from './dto/match.dto';
import { ResumeChatDto } from './dto/resume-chat.dto';
import { AssistantChatDto } from './dto/assistant-chat.dto';
import { Public } from '../auth/public.decorator';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { Request as ExpressRequest, Response } from 'express';
import { MultiagentService } from '../multiagent/multiagent.service';
import { LoggerService } from '../logger/logger.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}

@ApiTags('AI功能')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private multiagentService: MultiagentService,
    private loggerService: LoggerService,
  ) {}

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '优化简历内容' })
  @ApiResponse({ status: 200, description: '优化成功' })
  async optimize(@Request() req: AuthenticatedRequest, @Body() optimizeDto: OptimizeDto) {
    const result = await this.aiService.optimize(req.user.userId, optimizeDto);
    return {
      success: true,
      message: '优化成功',
      data: result,
    };
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '检查简历' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async check(@Request() req: AuthenticatedRequest, @Body() checkDto: CheckDto) {
    const result = await this.aiService.check(req.user.userId, checkDto);
    return {
      success: true,
      message: '检查完成',
      data: result,
    };
  }

  @Post('rewrite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '改写简历内容' })
  @ApiResponse({ status: 200, description: '改写成功' })
  async rewrite(@Request() req: AuthenticatedRequest, @Body() rewriteDto: RewriteDto) {
    const result = await this.aiService.rewrite(req.user.userId, rewriteDto);
    return {
      success: true,
      message: '改写成功',
      data: result,
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '智能填写简历内容' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generate(@Request() req: AuthenticatedRequest, @Body() generateDto: GenerateDto) {
    const result = await this.aiService.generate(req.user.userId, generateDto);
    return {
      success: true,
      message: '生成成功',
      data: result,
    };
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '关键词分析' })
  @ApiResponse({ status: 200, description: '分析成功' })
  async analyze(@Request() req: AuthenticatedRequest, @Body() analyzeDto: AnalyzeDto) {
    const result = await this.aiService.analyze(req.user.userId, analyzeDto);
    return {
      success: true,
      message: '分析完成',
      data: result,
    };
  }

  @Post('match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '职位匹配' })
  @ApiResponse({ status: 200, description: '匹配成功' })
  async match(@Request() req: AuthenticatedRequest, @Body() matchDto: MatchDto) {
    const result = await this.aiService.match(req.user.userId, matchDto);
    return {
      success: true,
      message: '匹配完成',
      data: result,
    };
  }

  @Post('resume-chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI 对话编辑简历' })
  @ApiResponse({ status: 200, description: '对话成功' })
  async resumeChat(@Request() req: AuthenticatedRequest, @Body() resumeChatDto: ResumeChatDto) {
    const result = await this.aiService.resumeChat(req.user.userId, resumeChatDto);
    return {
      success: true,
      message: '对话成功',
      data: result,
    };
  }

  @Public()
  @Get('assistant-skills')
  @ApiOperation({ summary: '全局 AI 助手可用 Skills' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async assistantSkills() {
    const data = await this.multiagentService.getAssistantSkills();
    return {
      success: true,
      data,
    };
  }

  @Public()
  @Post('assistant-chat/stream')
  @ApiOperation({ summary: '全局 AI 助手流式对话（SSE）' })
  @ApiResponse({ status: 200, description: 'SSE 文本流' })
  async assistantChatStream(@Body() dto: AssistantChatDto, @Res() res: Response) {
    let upstream: globalThis.Response | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const safeEnd = () => {
      if (!res.writableEnded && !res.destroyed) {
        try {
          res.end();
        } catch {
          // ignore
        }
      }
    };

    const safeWrite = (chunk: string) => {
      if (res.writableEnded || res.destroyed) return false;
      try {
        return res.write(chunk);
      } catch {
        return false;
      }
    };

    try {
      upstream = await this.multiagentService.streamAssistantChat({
        message: dto.message,
        history: dto.history,
        modelId: dto.modelId,
      });

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      if (!upstream.body) {
        safeWrite(`data: ${JSON.stringify({ error: '上游无响应流' })}\n\n`);
        safeWrite('data: [DONE]\n\n');
        safeEnd();
        return;
      }

      reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      // 客户端断开时取消上游，避免占住 Agent worker
      const onClose = () => {
        void reader?.cancel().catch(() => undefined);
      };
      res.on('close', onClose);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && !safeWrite(decoder.decode(value, { stream: true }))) {
            break;
          }
        }
        safeEnd();
      } finally {
        res.off('close', onClose);
      }
    } catch (error) {
      const message = (error as Error)?.message || '流式对话失败';
      this.loggerService.warn(`全局助手 SSE 转发中断: ${message}`, 'AiController');
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: { code: 5000, message },
        });
        return;
      }
      safeWrite(`data: ${JSON.stringify({ error: message })}\n\n`);
      safeWrite('data: [DONE]\n\n');
      safeEnd();
    } finally {
      try {
        await reader?.cancel();
      } catch {
        // ignore
      }
    }
  }

  @Public()
  @Get('chat-prompts')
  @ApiOperation({ summary: '获取随机推荐问题' })
  async getChatPrompts(@Query('count') count?: string) {
    const parsed = count ? Number.parseInt(count, 10) : 6;
    const result = this.aiService.getChatPrompts(Number.isFinite(parsed) ? parsed : 6);
    return { success: true, data: result };
  }

  @Get('chat-sessions')
  @ApiOperation({ summary: '获取简历 AI 对话会话列表' })
  async listChatSessions(
    @Request() req: AuthenticatedRequest,
    @Query('resumeId', ParseIntPipe) resumeId: number,
  ) {
    const result = await this.aiService.listChatSessions(req.user.userId, resumeId);
    return { success: true, data: result };
  }

  @Post('chat-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '新建 AI 对话会话' })
  async createChatSession(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateChatSessionDto,
  ) {
    const result = await this.aiService.createChatSession(req.user.userId, dto);
    return { success: true, message: '会话已创建', data: result };
  }

  @Get('chat-sessions/:sessionId')
  @ApiOperation({ summary: '获取 AI 对话会话详情' })
  async getChatSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.aiService.getChatSession(req.user.userId, sessionId);
    return { success: true, data: result };
  }
}