import { IsInt, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MatchDto {
  @ApiProperty({ description: '简历ID', example: 1 })
  @IsInt()
  resumeId: number;

  @ApiProperty({ description: '职位描述', example: '招聘前端工程师...' })
  @IsString()
  @MinLength(10, { message: '职位描述至少10个字符' })
  jobDescription: string;
}