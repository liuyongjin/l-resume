import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class PublishWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  nodes: any;

  @IsArray()
  connections: any;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
