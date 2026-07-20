import { Controller, Get, Post, Body, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MultiagentService } from './multiagent.service';
import { GenerateVersionsDto } from './dto/generate-versions.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { AnalyzeMatchDto } from './dto/analyze-match.dto';
import { TranslateResumeDto } from './dto/translate-resume.dto';
import { ParseResumeDto } from './dto/parse-resume.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}

@ApiTags('多智能体')
@ApiBearerAuth()
@Controller('multiagent')
export class MultiagentController {
  constructor(private multiagentService: MultiagentService) {}

  @Get('capabilities')
  @ApiOperation({ summary: '获取多智能体能力列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCapabilities() {
    const result = await this.multiagentService.getCapabilities();
    const health = await this.multiagentService.checkHealth();
    return {
      success: true,
      data: result,
      serviceAvailable: health.available,
    };
  }

  @Post('generate-versions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '多智能体生成简历多版本' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateVersions(@Request() req: AuthenticatedRequest, @Body() generateVersionsDto: GenerateVersionsDto) {
    const result = await this.multiagentService.generateVersions(req.user.userId, generateVersionsDto);
    return {
      success: true,
      message: '多版本生成完成',
      data: result,
    };
  }

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '多智能体优化简历' })
  @ApiResponse({ status: 200, description: '优化成功' })
  async optimize(@Request() req: AuthenticatedRequest, @Body() optimizeResumeDto: OptimizeResumeDto) {
    const result = await this.multiagentService.optimize(req.user.userId, optimizeResumeDto);
    return {
      success: true,
      message: '简历优化完成',
      data: result,
    };
  }

  @Post('analyze-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '多智能体分析简历匹配度' })
  @ApiResponse({ status: 200, description: '分析成功' })
  async analyzeMatch(@Request() req: AuthenticatedRequest, @Body() analyzeMatchDto: AnalyzeMatchDto) {
    const result = await this.multiagentService.analyzeMatch(req.user.userId, analyzeMatchDto);
    return {
      success: true,
      message: '匹配度分析完成',
      data: result,
    };
  }

  @Post('parse-resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解析上传简历为结构化数据' })
  @ApiResponse({ status: 200, description: '解析成功' })
  async parseResume(@Request() req: AuthenticatedRequest, @Body() parseResumeDto: ParseResumeDto) {
    const result = await this.multiagentService.parseResume(req.user.userId, parseResumeDto);
    return {
      success: true,
      message: '简历解析完成',
      data: result,
    };
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '翻译简历' })
  @ApiResponse({ status: 200, description: '翻译成功' })
  async translate(@Request() req: AuthenticatedRequest, @Body() translateResumeDto: TranslateResumeDto) {
    const result = await this.multiagentService.translate(req.user.userId, translateResumeDto);
    return {
      success: true,
      message: '简历翻译完成',
      data: result,
    };
  }
}