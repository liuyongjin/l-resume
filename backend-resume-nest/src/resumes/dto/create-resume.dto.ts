import { IsString, IsObject, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {
  @ApiProperty({ description: '简历标题', example: '我的简历' })
  @IsString()
  @MaxLength(200, { message: '标题最多200个字符' })
  title: string;

  @ApiProperty({ description: '简历数据', example: {} })
  @IsObject()
  data: any;

  @ApiPropertyOptional({ description: '样式配置', example: {} })
  @IsOptional()
  @IsObject()
  style?: any;

  @ApiPropertyOptional({ description: '模板ID', example: 'template-1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  templateId?: string;

  @ApiPropertyOptional({ description: '简历来源', example: 'manual | workflow | template' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  source?: string;
}