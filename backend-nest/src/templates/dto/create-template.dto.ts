import { IsString, IsObject, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: '模板ID', example: 'template-1' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ description: '模板名称', example: '简约模板' })
  @IsString()
  @MaxLength(100)
  name: string;

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
}