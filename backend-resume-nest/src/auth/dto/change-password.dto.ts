import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码', example: 'oldpassword' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: '新密码', example: 'newpassword123' })
  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}