import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: number;
    message: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const res = context.switchToHttp().getResponse<{ headersSent?: boolean; writableEnded?: boolean }>();
    return next.handle().pipe(
      map((data) => {
        // 已手动写完响应（如 SSE）时跳过二次包装，避免干扰
        if (res?.headersSent || res?.writableEnded) {
          return data as Response<T>;
        }
        // 如果返回的数据已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        // 否则包装成标准格式
        return {
          success: true,
          data,
        };
      }),
    );
  }
}