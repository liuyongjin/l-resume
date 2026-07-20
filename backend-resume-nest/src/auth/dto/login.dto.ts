import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '手机号', example: '12345678900' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '用户名（可选）', example: 'testuser' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  password: string;
}