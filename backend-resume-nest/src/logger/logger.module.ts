import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './winston.config';
import { LoggerService } from './logger.service';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [WinstonModule.forRoot(createWinstonOptions())],
  providers: [
    LoggerService,
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [LoggerService, LoggingInterceptor, WinstonModule],
})
export class LoggerModule {}
