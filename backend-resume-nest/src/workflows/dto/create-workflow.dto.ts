import { IsString, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';

export class CreateWorkflowDto {
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

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}