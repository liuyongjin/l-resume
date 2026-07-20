import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

/** 禁止浏览器/代理缓存 API 响应，避免列表与详情数据不一致 */
@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        // SSE / 文件下载等已手动写响应时不可再 setHeader，否则会 ERR_HTTP_HEADERS_SENT 并拖垮进程
        if (response.headersSent || response.writableEnded) {
          return;
        }
        response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');
      }),
    );
  }
}
