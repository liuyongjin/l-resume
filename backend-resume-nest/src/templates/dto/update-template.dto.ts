import { IsString, IsObject, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '模板名称', example: '简约模板' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '模板描述', example: '简约风格的简历模板' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '预览图片URL', example: 'https://example.com/preview.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  previewUrl?: string;

  @ApiPropertyOptional({ description: '模板配置', example: {} })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiPropertyOptional({ description: '模板默认简历数据结构' })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ description: '模板默认样式' })
  @IsOptional()
  @IsObject()
  style?: any;

  @ApiPropertyOptional({ description: 'data 字段说明（Agent 解析用）' })
  @IsOptional()
  @IsObject()
  dataSchema?: any;

  @ApiPropertyOptional({ description: 'style 字段说明（Agent 解析用）' })
  @IsOptional()
  @IsObject()
  styleSchema?: any;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}