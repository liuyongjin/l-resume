import { IsString, IsObject, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowResumeRecord } from '../../common/resume-record.util';

export class ParseResumeDto {
  @ApiPropertyOptional({ description: '已提取的简历 data 字段' })
  @IsOptional()
  @IsObject()
  resumeData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '完整 resumes 表记录（不含 id/userId/timestamps）' })
  @IsOptional()
  @IsObject()
  resumeRecord?: WorkflowResumeRecord | Record<string, unknown>;

  @ApiPropertyOptional({ description: '原始文本' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ description: '模板 data 结构（字段骨架，兼容旧参数）' })
  @IsOptional()
  @IsObject()
  templateSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'templates.data_schema：data 各字段含义与前端组件映射' })
  @IsOptional()
  @IsObject()
  dataSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'templates.style_schema：style 各字段含义与前端样式映射' })
  @IsOptional()
  @IsObject()
  styleSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '当前选中模板的完整快照（id/name/data/style/config 等）' })
  @IsOptional()
  @IsObject()
  templateSnapshot?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '目标职位' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRole?: string;
}
