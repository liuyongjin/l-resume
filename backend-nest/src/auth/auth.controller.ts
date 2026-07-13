import { Controller, Post, Get, Put, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '用户已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: '注册成功',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '认证失败' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: '登录成功',
      data: result,
    };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    const result = await this.authService.getProfile(req.user.userId);
    return {
      success: true,
      data: result,
    };
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() updateProfileDto: UpdateProfileDto) {
    const result = await this.authService.updateProfile(req.user.userId, updateProfileDto);
    return {
      success: true,
      message: '资料更新成功',
      data: result,
    };
  }

  @Put('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 401, description: '当前密码错误' })
  async changePassword(@Request() req: AuthenticatedRequest, @Body() changePasswordDto: ChangePasswordDto) {
    const result = await this.authService.changePassword(req.user.userId, changePasswordDto);
    return {
      success: true,
      message: result.message,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout(@Request() req: AuthenticatedRequest) {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    const result = await this.authService.logout(token);
    return {
      success: true,
      message: result.message,
    };
  }
}