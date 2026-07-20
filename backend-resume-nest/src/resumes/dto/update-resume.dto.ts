import { IsString, IsObject, IsOptional, MaxLength, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResumeDto {
  @ApiPropertyOptional({ description: '简历标题', example: '我的简历' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '标题最多200个字符' })
  title?: string;

  @ApiPropertyOptional({ description: '简历数据', example: {} })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ description: '样式配置', example: {} })
  @IsOptional()
  @IsObject()
  style?: any;

  @ApiPropertyOptional({ description: '模板ID', example: 'template-1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  templateId?: string;

  @ApiPropertyOptional({ description: '乐观锁：客户端持有的 updatedAt（ISO 8601），不一致则拒绝更新' })
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}