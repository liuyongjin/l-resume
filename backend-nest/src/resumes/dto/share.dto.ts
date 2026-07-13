import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ShareDto {
  @ApiPropertyOptional({ description: '有效期（小时）', example: 72, default: 72 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  expiresInHours?: number;
}