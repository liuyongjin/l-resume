import { IsInt, IsArray, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OptimizeResumeDto {
  @ApiPropertyOptional({ description: '简历ID（与 resumeData 二选一）', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiPropertyOptional({ description: '简历数据（与 resumeId 二选一）' })
  @IsOptional()
  @IsObject()
  resumeData?: any;

  @ApiPropertyOptional({ description: '优化重点', example: ['工作经历', '技能'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optimizationFocus?: string[];

  @ApiPropertyOptional({ description: '工作流节点 Agent 配置' })
  @IsOptional()
  @IsObject()
  agentConfigs?: Record<string, any>;
}
