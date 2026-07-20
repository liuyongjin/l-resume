import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || 'Application' });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context: context || 'Application', stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || 'Application' });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || 'Application' });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || 'Application' });
  }

  logRequest(method: string, path: string, body?: any, query?: any) {
    this.log(`[REQUEST] ${method} ${path}`, 'HTTP');
    if (body) {
      this.debug(`[REQUEST BODY] ${JSON.stringify(body)}`, 'HTTP');
    }
    if (query) {
      this.debug(`[REQUEST QUERY] ${JSON.stringify(query)}`, 'HTTP');
    }
  }

  logResponse(method: string, path: string, statusCode: number, durationMs: number) {
    this.log(`[RESPONSE] ${method} ${path} | ${statusCode} | ${durationMs}ms`, 'HTTP');
  }

  logError(method: string, path: string, error: any, durationMs: number) {
    this.error(`[ERROR] ${method} ${path} | ${durationMs}ms | ${error.message}`, error.stack, 'HTTP');
  }

  logBusinessEvent(eventType: string, message: string, data?: any) {
    this.log(`[BUSINESS] ${eventType}: ${message}`, 'Business');
    if (data) {
      this.debug(`[BUSINESS DATA] ${JSON.stringify(data)}`, 'Business');
    }
  }

  logServiceCall(service: string, method: string, params?: any) {
    this.debug(`[SERVICE] ${service}.${method} called`, 'Service');
    if (params) {
      this.debug(`[SERVICE PARAMS] ${JSON.stringify(params)}`, 'Service');
    }
  }

  logDatabaseOperation(operation: string, table: string, data?: any) {
    this.debug(`[DATABASE] ${operation} ${table}`, 'Database');
    if (data) {
      this.debug(`[DATABASE DATA] ${JSON.stringify(data)}`, 'Database');
    }
  }
}
