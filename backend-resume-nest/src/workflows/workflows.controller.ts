import { Controller, Get, Post, Put, Delete, Body, Param, Request, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { PublishWorkflowDto } from './dto/publish-workflow.dto';
import { TestWorkflowDto } from './dto/test-workflow.dto';
import { Public } from '../auth/public.decorator';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: number;
  };
}

function getUserId(req: AuthenticatedRequest): number {
  return req.user!.userId;
}

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.workflowsService.findAll(getUserId(req));
  }

  @Public()
  @Get('node-library')
  getNodeLibrary() {
    return this.workflowsService.getNodeLibrary();
  }

  @Public()
  @Get('llm-models')
  listLlmModels() {
    return this.workflowsService.listLlmModels();
  }

  @Get('default')
  findDefault(
    @Request() req: AuthenticatedRequest,
    @Query('version') version?: string,
  ) {
    const parsedVersion = version ? Number.parseInt(version, 10) : undefined;
    return this.workflowsService.findDefault(
      getUserId(req),
      Number.isFinite(parsedVersion) ? parsedVersion : undefined,
    );
  }

  @Get('versions')
  listVersions(@Request() req: AuthenticatedRequest) {
    return this.workflowsService.listVersions(getUserId(req));
  }

  @Get('versions/:versionId')
  getVersion(
    @Request() req: AuthenticatedRequest,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.workflowsService.getVersion(getUserId(req), versionId);
  }

  @Post('publish')
  publish(@Request() req: AuthenticatedRequest, @Body() publishWorkflowDto: PublishWorkflowDto) {
    return this.workflowsService.publish(getUserId(req), publishWorkflowDto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test(@Request() req: AuthenticatedRequest, @Body() testWorkflowDto: TestWorkflowDto) {
    return this.workflowsService.testWorkflow(getUserId(req), testWorkflowDto);
  }

  @Post('versions/:versionId/restore')
  restoreVersion(@Request() req: AuthenticatedRequest, @Param('versionId', ParseIntPipe) versionId: number) {
    return this.workflowsService.restoreVersion(getUserId(req), versionId);
  }

  @Delete('versions/:versionId')
  deleteVersion(@Request() req: AuthenticatedRequest, @Param('versionId', ParseIntPipe) versionId: number) {
    return this.workflowsService.deleteVersion(getUserId(req), versionId);
  }

  @Public()
  @Get('health')
  checkHealth() {
    return this.workflowsService.checkExecutionHealth();
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowsService.create(getUserId(req), createWorkflowDto);
  }

  @Public()
  @Post('tools/execute')
  @HttpCode(HttpStatus.OK)
  executeTool(@Body() body: { type: string; config?: Record<string, unknown>; input?: unknown }) {
    return this.workflowsService.executeTool(body);
  }

  @Get('executions')
  listExecutions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('runType') runType?: string,
  ) {
    const parsedPage = page ? Number.parseInt(page, 10) : undefined;
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.workflowsService.listExecutions(getUserId(req), {
      page: Number.isFinite(parsedPage) ? parsedPage : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      runType,
    });
  }

  @Post('executions/:groupId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelExecution(
    @Request() req: AuthenticatedRequest,
    @Param('groupId') groupId: string,
  ) {
    return this.workflowsService.cancelExecution(getUserId(req), groupId);
  }

  @Get('executions/:groupId')
  getExecutionLogs(
    @Request() req: AuthenticatedRequest,
    @Param('groupId') groupId: string,
  ) {
    return this.workflowsService.getExecutionLogs(getUserId(req), groupId);
  }

  @Get(':id/graph')
  getWorkflowGraph(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workflowsService.getWorkflowGraph(getUserId(req), id);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.findOne(getUserId(req), id);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  execute(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() executeWorkflowDto: ExecuteWorkflowDto,
  ) {
    return this.workflowsService.execute(getUserId(req), id, executeWorkflowDto);
  }

  @Put(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(getUserId(req), id, updateWorkflowDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.workflowsService.remove(getUserId(req), id);
  }
}
