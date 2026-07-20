import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { BatchDeleteTemplateDto } from './dto/batch-delete-template.dto';

@ApiTags('模板')
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    const result = await this.templatesService.findAll(page, limit, isActiveBool);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async findOne(@Param('id') id: string) {
    const result = await this.templatesService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '模板已存在' })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    const result = await this.templatesService.create(createTemplateDto);
    return {
      success: true,
      message: '模板创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const result = await this.templatesService.update(id, updateTemplateDto);
    return {
      success: true,
      message: '模板更新成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @ApiResponse({ status: 409, description: '模板正在被使用中' })
  async remove(@Param('id') id: string) {
    const result = await this.templatesService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }

  @Delete('batch/delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量删除模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDelete(@Body() batchDeleteDto: BatchDeleteTemplateDto) {
    const result = await this.templatesService.batchDelete(batchDeleteDto);
    return {
      success: true,
      message: result.message,
      data: { deletedCount: result.deletedCount },
    };
  }
}