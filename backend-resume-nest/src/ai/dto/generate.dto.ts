import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({ description: '要生成的部分', example: 'personalSummary' })
  @IsString()
  section: string;

  @ApiPropertyOptional({ description: '上下文信息', example: { position: '前端工程师', years: '3年' } })
  @IsOptional()
  @IsObject()
  context?: any;
}