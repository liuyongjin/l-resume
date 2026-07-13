import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiProperty({ description: '简历 ID' })
  @IsInt()
  resumeId: number;

  @ApiPropertyOptional({ description: '默认大模型 ID' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
