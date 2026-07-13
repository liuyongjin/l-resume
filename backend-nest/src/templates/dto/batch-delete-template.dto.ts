import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchDeleteTemplateDto {
  @ApiProperty({ description: '模板ID数组', example: ['template-1', 'template-2'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}