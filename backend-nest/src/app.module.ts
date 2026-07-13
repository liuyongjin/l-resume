import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResumesModule } from './resumes/resumes.module';
import { TemplatesModule } from './templates/templates.module';
import { MultiagentModule } from './multiagent/multiagent.module';
import { AiModule } from './ai/ai.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { LoggerModule } from './logger/logger.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransformInterceptor } from './common/transform.interceptor';
import { NoCacheInterceptor } from './common/no-cache.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { TokenBlacklistService } from './auth/token-blacklist.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    AuthModule,
    ResumesModule,
    TemplatesModule,
    MultiagentModule,
    AiModule,
    WorkflowsModule,
  ],
  providers: [
    TokenBlacklistService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NoCacheInterceptor,
    },
  ],
})
export class AppModule {}