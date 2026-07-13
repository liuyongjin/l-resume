import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { BatchDeleteTemplateDto } from './dto/batch-delete-template.dto';
import {
  getDefaultDataSchema,
  getDefaultStyleSchema,
} from './template-field-schemas';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '模板不存在',
        },
      });
    }

    return { template };
  }

  async create(createTemplateDto: CreateTemplateDto) {
    const { id, name, description, previewUrl, config, data, style, dataSchema, styleSchema } =
      createTemplateDto;

    if (!id || !name) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '模板ID和名称不能为空',
        },
      });
    }

    const existing = await this.prisma.template.findUnique({
      where: { id },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: 3002,
          message: '模板已存在',
        },
      });
    }

    const template = await this.prisma.template.create({
      data: {
        id,
        name,
        description: description || '',
        previewUrl: previewUrl || null,
        data: (data as any) || {},
        style: (style as any) || {},
        dataSchema: (dataSchema as any) || getDefaultDataSchema(),
        styleSchema: (styleSchema as any) || getDefaultStyleSchema(),
        config: config as any || {},
      },
    });

    return { template };
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    const existing = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '模板不存在',
        },
      });
    }

    const { name, description, previewUrl, config, data, style, dataSchema, styleSchema, isActive } =
      updateTemplateDto;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (previewUrl !== undefined) updateData.previewUrl = previewUrl;
    if (config !== undefined) updateData.config = config as any;
    if (data !== undefined) updateData.data = data as any;
    if (style !== undefined) updateData.style = style as any;
    if (dataSchema !== undefined) updateData.dataSchema = dataSchema as any;
    if (styleSchema !== undefined) updateData.styleSchema = styleSchema as any;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '请提供要更新的字段',
        },
      });
    }

    const template = await this.prisma.template.update({
      where: { id },
      data: updateData,
    });

    return { template };
  }

  async remove(id: string) {
    const existing = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '模板不存在',
        },
      });
    }

    const usageCount = await this.prisma.resume.count({
      where: { templateId: id },
    });

    if (usageCount > 0) {
      throw new ConflictException({
        success: false,
        error: {
          code: 3003,
          message: `模板正在被 ${usageCount} 份简历使用，无法删除`,
        },
      });
    }

    await this.prisma.template.delete({
      where: { id },
    });

    return { message: '模板删除成功' };
  }

  async batchDelete(batchDeleteDto: BatchDeleteTemplateDto) {
    const { ids } = batchDeleteDto;

    if (!ids || ids.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '请提供要删除的模板ID列表',
        },
      });
    }

    const usageCount = await this.prisma.resume.count({
      where: { templateId: { in: ids } },
    });

    if (usageCount > 0) {
      throw new ConflictException({
        success: false,
        error: {
          code: 3003,
          message: `有 ${usageCount} 份简历正在使用这些模板，无法删除`,
        },
      });
    }

    const result = await this.prisma.template.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      deletedCount: result.count,
      message: `成功删除 ${result.count} 个模板`,
    };
  }
}