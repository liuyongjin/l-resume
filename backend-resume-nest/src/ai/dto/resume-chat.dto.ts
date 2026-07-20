import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ResumeChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content: string;
}

export class ResumeChatDto {
  @ApiProperty({ description: '简历 ID' })
  @IsInt()
  resumeId: number;

  @ApiPropertyOptional({ description: '会话 ID（不传则自动创建）' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ description: '用户消息' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ description: '大模型 ID' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: '快捷操作类型', enum: ['chat', 'translate', 'translate_en', 'translate_zh'] })
  @IsOptional()
  @IsIn(['chat', 'translate', 'translate_en', 'translate_zh'])
  actionType?: 'chat' | 'translate' | 'translate_en' | 'translate_zh';

  @ApiPropertyOptional({ description: '对话历史（不含当前 message，无 sessionId 时使用）' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResumeChatHistoryItemDto)
  history?: ResumeChatHistoryItemDto[];

  @ApiPropertyOptional({ description: '当前简历 data（前端未保存的编辑态）' })
  @IsOptional()
  @IsObject()
  resumeData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '当前简历 style（前端未保存的编辑态）' })
  @IsOptional()
  @IsObject()
  style?: Record<string, unknown>;
}
