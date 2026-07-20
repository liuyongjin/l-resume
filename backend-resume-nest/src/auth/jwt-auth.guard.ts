import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from './token-blacklist.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 2001,
          message: '未提供认证令牌',
        },
      });
    }

    const token = authHeader.substring(7);

    if (this.tokenBlacklistService.has(token)) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 2003,
          message: '令牌已失效，请重新登录',
        },
      });
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (err) {
      const error = err as Error & { name?: string };
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 2002,
            message: '令牌已过期',
          },
        });
      }
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 2001,
          message: '无效的认证令牌',
        },
      });
    }
  }
}
