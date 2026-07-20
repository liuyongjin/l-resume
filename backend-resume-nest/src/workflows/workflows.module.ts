import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { LlmModelsService } from './llm-models.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { MultiagentModule } from '../multiagent/multiagent.module';
import { ResumesModule } from '../resumes/resumes.module';

@Module({
  imports: [PrismaModule, LoggerModule, MultiagentModule, ResumesModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, LlmModelsService],
  exports: [WorkflowsService, LlmModelsService],
})
export class WorkflowsModule {}