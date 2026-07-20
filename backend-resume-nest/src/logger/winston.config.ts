import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

/** 解析 backend-resume-nest/logs 绝对路径 */
export function resolveLogsDir(): string {
  const fromCwd = path.resolve(process.cwd(), 'logs');
  const fromModule = path.resolve(__dirname, '..', '..', 'logs');
  // npm run start:dev / node dist/main 均在 backend-resume-nest 目录执行
  if (path.basename(process.cwd()) === 'backend-resume-nest') {
    return fromCwd;
  }
  return fromModule;
}

function ensureLogsDir(logsDir: string): void {
  fs.mkdirSync(logsDir, { recursive: true });
}

function fileLineFormat() {
  return winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
    const ctx = context ? `[${context}] ` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackLine = stack ? `\n${stack}` : '';
    return `${timestamp} | ${String(level).toUpperCase().padEnd(5)} | ${ctx}${message}${extra}${stackLine}`;
  });
}

export function createWinstonOptions(): winston.LoggerOptions {
  const logsDir = resolveLogsDir();
  ensureLogsDir(logsDir);

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const combinedFile = path.join(logsDir, `nest_${date}.log`);
  const errorFile = path.join(logsDir, `nest_error_${date}.log`);

  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    fileLineFormat(),
  );

  return {
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike('ResumeBuilder', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      new winston.transports.File({
        filename: errorFile,
        level: 'error',
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: combinedFile,
        format: fileFormat,
      }),
    ],
  };
}

export function createWinstonLogger(): winston.Logger {
  return winston.createLogger(createWinstonOptions());
}
