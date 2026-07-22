import { IsString, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  nodes?: any;

  @IsOptional()
  @IsArray()
  connections?: any;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}