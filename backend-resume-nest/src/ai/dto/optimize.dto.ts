import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OptimizeDto {
  @ApiPropertyOptional({ description: '简历ID', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiProperty({ description: '要优化的部分', example: 'personalSummary' })
  @IsString()
  section: string;

  @ApiProperty({ description: '要优化的内容', example: '我是一名软件工程师...' })
  @IsString()
  content: string;
}