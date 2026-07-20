import { IsInt, IsString, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeMatchDto {
  @ApiPropertyOptional({ description: '简历ID（与 resumeData 二选一）', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiPropertyOptional({ description: '简历数据（与 resumeId 二选一）' })
  @IsOptional()
  @IsObject()
  resumeData?: any;

  @ApiProperty({ description: '职位描述', example: '招聘前端工程师...' })
  @IsString()
  @MinLength(10, { message: '职位描述至少10个字符' })
  jobDescription: string;

  @ApiPropertyOptional({ description: '工作流节点 Agent 配置' })
  @IsOptional()
  @IsObject()
  agentConfigs?: Record<string, any>;
}
