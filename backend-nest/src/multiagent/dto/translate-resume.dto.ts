import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateResumeDto {
  @ApiProperty({ description: '简历数据', example: {} })
  @IsObject()
  resumeData: any;

  @ApiPropertyOptional({ description: '目标语言', example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  targetLanguage?: string;
}