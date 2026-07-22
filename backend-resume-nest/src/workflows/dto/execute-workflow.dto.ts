import { IsString, IsOptional, IsArray, IsObject, IsInt, IsBoolean, Min, Max, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional({ description: '源简历ID' })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiPropertyOptional({ description: '简历数据（与 resumeId 二选一）' })
  @IsOptional()
  @IsObject()
  resumeData?: any;

  @ApiPropertyOptional({ description: '粘贴的简历原文（与 filePath / resumeId 三选一）' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ description: '已上传简历文件的存储路径（由 /resumes/upload 返回）' })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({ description: '上传文件的原始文件名（由 /resumes/upload 返回的 fileName）' })
  @IsOptional()
  @IsString()
  uploadFileName?: string;

  @ApiPropertyOptional({ description: '目标职位' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ description: '单个模板 themeKey 或模板 ID（兼容旧版）' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: '输出模板 ID/themeKey 列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateIds?: string[];

  @ApiPropertyOptional({ description: '输出语言：zh / en', example: ['zh', 'en'] })
  @IsOptional()
  @IsArray()
  @IsIn(['zh', 'en'], { each: true })
  outputLanguages?: ('zh' | 'en')[];

  @ApiPropertyOptional({ description: '是否保存到数据库', default: true })
  @IsOptional()
  @IsBoolean()
  saveToDatabase?: boolean;

  @ApiPropertyOptional({ description: '中文版本数量', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  versionsCount?: number;

  @ApiPropertyOptional({ description: '风格列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ description: '是否生成英文版本（兼容旧版，优先 outputLanguages）' })
  @IsOptional()
  @IsBoolean()
  generateEnglish?: boolean;

  @ApiPropertyOptional({ description: '英文版本数量' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  englishVersionsCount?: number;

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '经验级别' })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({ description: '优化重点' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optimizationFocus?: string[];

  @ApiPropertyOptional({ description: '幂等键：相同用户重复提交时返回同一 executionGroupId，防止重复执行' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
