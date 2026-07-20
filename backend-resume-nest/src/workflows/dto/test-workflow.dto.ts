import { IsString, IsOptional, IsArray, IsObject, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TestWorkflowDto {
  @IsArray()
  nodes: any[];

  @IsArray()
  connections: any[];

  @ApiPropertyOptional({ description: '关联的工作流版本 ID（用于执行日志）' })
  @IsOptional()
  @IsInt()
  workflowId?: number;

  @ApiPropertyOptional({ description: '工作流名称（日志展示）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '工作流描述（仅日志/兼容设计器 payload）' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '工作流配置（兼容设计器 payload）' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '测试用简历数据' })
  @IsOptional()
  @IsObject()
  resumeData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '测试用原始文本' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ description: '目标职位' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: '输出模板 ID 或 themeKey，默认第一个模板' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: '幂等键：防止重复触发测试执行' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
