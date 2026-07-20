import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { MultiagentService } from './multiagent.service';
import { MultiagentController } from './multiagent.controller';

@Module({
  imports: [ConfigModule, PrismaModule, LoggerModule],
  controllers: [MultiagentController],
  providers: [MultiagentService],
  exports: [MultiagentService],
})
export class MultiagentModule {}