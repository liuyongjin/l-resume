import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AssistantChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(8000)
  content: string;
}

export class AssistantChatDto {
  @ApiProperty({ description: '用户消息' })
  @IsString()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ type: [AssistantChatHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantChatHistoryItemDto)
  history?: AssistantChatHistoryItemDto[];

  @ApiPropertyOptional({ description: '可选模型 ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelId?: string;
}
