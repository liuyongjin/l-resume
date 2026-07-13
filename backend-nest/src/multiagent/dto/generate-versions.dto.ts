import { IsInt, IsString, IsArray, IsOptional, IsObject, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateVersionsDto {
  @ApiPropertyOptional({ description: '源简历ID（可选，与resumeData二选一）', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiPropertyOptional({ description: '简历数据（可选，与resumeId二选一）', example: {} })
  @IsOptional()
  @IsObject()
  resumeData?: any;

  @ApiPropertyOptional({ description: '目标职位', example: '前端工程师' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: '简历模板ID（7个默认模板之一）', example: 'classic', enum: ['classic', 'modern', 'creative', 'data', 'amber', 'purple', 'developer'] })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: '生成版本数量', example: 2, default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  versionsCount?: number;

  @ApiPropertyOptional({ description: '风格列表', example: ['专业', '创意'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ description: '是否同时生成英文版本', example: false })
  @IsOptional()
  @IsBoolean()
  generateEnglish?: boolean;

  @ApiPropertyOptional({ description: '英文版本数量', example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  englishVersionsCount?: number;

  @ApiPropertyOptional({ description: '行业', example: '互联网' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '经验级别', example: 'mid' })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({ description: '工作流节点列表（来自设计器）' })
  @IsOptional()
  @IsArray()
  workflowNodes?: any[];

  @ApiPropertyOptional({ description: 'Agent 配置（提示词、模型参数等）' })
  @IsOptional()
  @IsObject()
  agentConfigs?: Record<string, any>;
}