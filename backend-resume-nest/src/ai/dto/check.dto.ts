import { IsInt, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckDto {
  @ApiPropertyOptional({ description: '简历ID', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiPropertyOptional({ description: '简历数据（可选，优先于 resumeId）' })
  @IsOptional()
  @IsObject()
  resumeData?: any;
}