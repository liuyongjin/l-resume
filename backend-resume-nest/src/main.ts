import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { resolveLogsDir } from './logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
  });

  const nestLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(nestLogger);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 配置
  app.enableCors();

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('简流 API')
    .setDescription('简流后端 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 全局前缀
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3001;
  const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;
  const agentUrl = process.env.MULTIAGENT_SERVICE_URL || 'http://127.0.0.1:5001';

  try {
    // 显式绑定 IPv4，避免 Windows 上 localhost→::1 与代理不通导致数秒超时
    await app.listen(port, '0.0.0.0');
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === 'EADDRINUSE') {
      console.error(`\n❌ 端口 ${port} 已被占用，无法启动后端服务。`);
      console.error('请先释放端口，再重新启动：');
      console.error(`  npm run port:free`);
      console.error('或手动查找并结束进程：');
      console.error(`  netstat -ano | findstr :${port}`);
      console.error('  taskkill /PID <进程ID> /F\n');
      process.exit(1);
    }
    throw error;
  }

  nestLogger.log(`简流后端服务已启动 | 端口=${port}`, 'Bootstrap');
  nestLogger.log('--- 服务地址 ---', 'Bootstrap');
  nestLogger.log(`服务根地址: ${baseUrl}`, 'Bootstrap');
  nestLogger.log(`API 地址:   ${baseUrl}/api`, 'Bootstrap');
  nestLogger.log(`API 文档:   ${baseUrl}/api-docs`, 'Bootstrap');
  nestLogger.log(`静态资源: ${baseUrl}/api/uploads/`, 'Bootstrap');
  nestLogger.log(`Agent 代理: ${agentUrl} (经 /api/multiagent/*)`, 'Bootstrap');
  nestLogger.log('主要接口:', 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/auth`, 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/resumes`, 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/templates`, 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/workflows`, 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/ai`, 'Bootstrap');
  nestLogger.log(`  - ${baseUrl}/api/multiagent`, 'Bootstrap');
  nestLogger.log(`日志目录: ${resolveLogsDir()}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('后端启动失败:', error);
  process.exit(1);
});
