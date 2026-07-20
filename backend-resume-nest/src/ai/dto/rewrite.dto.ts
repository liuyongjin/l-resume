import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RewriteDto {
  @ApiPropertyOptional({ description: '简历ID', example: 1 })
  @IsOptional()
  @IsInt()
  resumeId?: number;

  @ApiProperty({ description: '要改写的部分', example: 'personalSummary' })
  @IsString()
  section: string;

  @ApiPropertyOptional({ description: '改写风格', example: 'professional' })
  @IsOptional()
  @IsString()
  style?: string;
}