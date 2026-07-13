import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 5001;
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        const nestedError = resp.error as { code?: number; message?: string } | undefined;
        if (nestedError && typeof nestedError === 'object') {
          message = nestedError.message || message;
          code = nestedError.code || code;
        } else if (typeof resp.message === 'string') {
          message = resp.message;
        } else if (Array.isArray(resp.message)) {
          message = resp.message.join('; ');
          code = 1001;
        }
        if (typeof resp.code === 'number') {
          code = resp.code;
        }
        details = resp.details as string[] | undefined;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // Prisma 错误处理
      const prismaError = exception as any;
      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = '资源已存在';
        code = 3002;
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = '资源不存在';
        code = 3001;
      } else {
        message = exception.message;
      }
    }

    const errorResponse: any = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details) {
      errorResponse.error.details = details;
    }

    response.status(status).json(errorResponse);
  }
}