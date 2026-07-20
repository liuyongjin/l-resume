import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.path;
    const body = request.body;
    const query = request.query;
    const startTime = Date.now();

    this.loggerService.logRequest(method, path, body, query);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const res = context.switchToHttp().getResponse();
          const statusCode = res?.statusCode ?? 200;
          this.loggerService.logResponse(method, path, statusCode, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.loggerService.logError(method, path, error, duration);
        },
      }),
    );
  }
}
