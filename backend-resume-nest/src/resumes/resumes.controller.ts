import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, HttpCode, HttpStatus, DefaultValuePipe, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { ResumeUploadService } from './resume-upload.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { ShareDto } from './dto/share.dto';
import { Public } from '../auth/public.decorator';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
  };
}

@ApiTags('简历')
@ApiBearerAuth()
@Controller('resumes')
export class ResumesController {
  constructor(
    private resumesService: ResumesService,
    private resumeUploadService: ResumeUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取用户的所有简历' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.resumesService.findAll(req.user.userId, page, limit);
    return {
      success: true,
      data: result,
    };
  }

  @Get('search')
  @ApiOperation({ summary: '搜索简历' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.resumesService.search(req.user.userId, query, page, limit);
    return {
      success: true,
      data: result,
    };
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '上传简历文件' })
  @ApiResponse({ status: 200, description: '上传成功' })
  async uploadResume(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName?: string,
  ) {
    const validFile = this.resumeUploadService.validateFile(file);
    const result = await this.resumeUploadService.saveUploadedFile(req.user.userId, validFile, fileName);
    return {
      success: true,
      message: '简历上传成功',
      data: result,
    };
  }

  @Post('avatar/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '上传简历头像' })
  @ApiResponse({ status: 200, description: '上传成功' })
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const validFile = this.resumeUploadService.validateAvatarFile(file);
    const result = await this.resumeUploadService.saveAvatarFile(req.user.userId, validFile);
    return {
      success: true,
      message: '头像上传成功',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个简历' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.resumesService.findOne(req.user.userId, parseInt(id));
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建简历' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Request() req: AuthenticatedRequest, @Body() createResumeDto: CreateResumeDto) {
    const result = await this.resumesService.create(req.user.userId, createResumeDto);
    return {
      success: true,
      message: '简历创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新简历' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    const result = await this.resumesService.update(req.user.userId, parseInt(id), updateResumeDto);
    return {
      success: true,
      message: '简历更新成功',
      data: result,
    };
  }

  @Delete('batch/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDelete(@Request() req: AuthenticatedRequest, @Body() batchDeleteDto: BatchDeleteDto) {
    const result = await this.resumesService.batchDelete(req.user.userId, batchDeleteDto);
    return {
      success: true,
      message: result.message,
      data: { deletedCount: result.deletedCount },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.resumesService.remove(req.user.userId, parseInt(id));
    return {
      success: true,
      message: result.message,
    };
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '复制简历' })
  @ApiResponse({ status: 201, description: '复制成功' })
  async duplicate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.resumesService.duplicate(req.user.userId, parseInt(id));
    return {
      success: true,
      message: '简历复制成功',
      data: result,
    };
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '收藏/取消收藏简历' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async toggleFavorite(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.resumesService.toggleFavorite(req.user.userId, parseInt(id));
    return {
      success: true,
      message: result.message,
      data: { isFavorite: result.isFavorite },
    };
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成分享链接' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async createShare(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() shareDto: ShareDto,
  ) {
    const result = await this.resumesService.createShare(req.user.userId, parseInt(id), shareDto);
    return {
      success: true,
      message: '分享链接生成成功',
      data: result,
    };
  }

  @Delete(':id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消分享链接' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async removeShare(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.resumesService.removeShare(req.user.userId, parseInt(id));
    return {
      success: true,
      message: result.message,
    };
  }

  @Public()
  @Get('share/:token')
  @ApiOperation({ summary: '通过分享链接查看简历（公开访问）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '链接无效或已过期' })
  async getSharedResume(@Param('token') token: string) {
    const result = await this.resumesService.getSharedResume(token);
    return {
      success: true,
      data: result,
    };
  }
}