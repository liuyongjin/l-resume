import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchDeleteDto {
  @ApiProperty({ description: '简历ID数组', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}