import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    private loggerService: LoggerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;
    this.loggerService.logBusinessEvent('REGISTER', '用户注册请求', { username, email });

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      this.loggerService.warn(`用户注册失败: 用户名或邮箱已存在 - ${username}/${email}`, 'Auth');
      throw {
        status: 409,
        response: {
          success: false,
          error: {
            code: 3002,
            message: '用户名或邮箱已存在',
          },
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({ userId: user.id });

    this.loggerService.logBusinessEvent('REGISTER_SUCCESS', '用户注册成功', { userId: user.id, username });

    return {
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { phone, username, password } = loginDto;
    const account = phone || username || '';
    this.loggerService.logBusinessEvent('LOGIN', '用户登录请求', { phone, username });

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: account },
          { username: account },
        ],
      },
    });

    if (!user) {
      this.loggerService.warn(`用户登录失败: 用户不存在 - ${account}`, 'Auth');
      throw {
        status: 401,
        response: {
          success: false,
          error: {
            code: 2001,
            message: '账号或密码错误',
          },
        },
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      this.loggerService.warn(`用户登录失败: 密码错误 - ${account}`, 'Auth');
      throw {
        status: 401,
        response: {
          success: false,
          error: {
            code: 2001,
            message: '账号或密码错误',
          },
        },
      };
    }

    const token = this.generateToken({ userId: user.id });

    this.loggerService.logBusinessEvent('LOGIN_SUCCESS', '用户登录成功', { userId: user.id, username: user.username });

    return {
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw {
        status: 401,
        response: {
          success: false,
          error: {
            code: 2001,
            message: '用户不存在',
          },
        },
      };
    }

    return { user };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const { username, email } = updateProfileDto;

    if (!username && !email) {
      throw {
        status: 400,
        response: {
          success: false,
          error: {
            code: 1001,
            message: '请提供要更新的字段',
          },
        },
      };
    }

    // 检查用户名或邮箱是否已被使用
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw {
        status: 409,
        response: {
          success: false,
          error: {
            code: 3002,
            message: '用户名或邮箱已被使用',
          },
        },
      };
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { user };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    if (newPassword.length < 6) {
      throw {
        status: 400,
        response: {
          success: false,
          error: {
            code: 1001,
            message: '新密码至少6个字符',
          },
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw {
        status: 401,
        response: {
          success: false,
          error: {
            code: 2001,
            message: '用户不存在',
          },
        },
      };
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw {
        status: 401,
        response: {
          success: false,
          error: {
            code: 2001,
            message: '当前密码错误',
          },
        },
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  async logout(token: string) {
    if (token) {
      this.tokenBlacklistService.add(token);
    }
    return { message: '退出登录成功' };
  }

  private generateToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });
  }
}