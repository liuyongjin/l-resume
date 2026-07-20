import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { ShareDto } from './dto/share.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          templateId: true,
          source: true,
          isFavorite: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      includesBody: false,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(userId: number, query: string, page: number = 1, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '搜索关键词不能为空',
        },
      });
    }

    const skip = (page - 1) * limit;
    const where = {
      userId,
      OR: [{ title: { contains: query } }],
    };

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          templateId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      includesBody: false,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: number, id: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    return { resume, includesBody: true };
  }

  async create(userId: number, createResumeDto: CreateResumeDto) {
    const { title, data, style, templateId, source } = createResumeDto;

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        title,
        data: data as any,
        style: style as any || {},
        templateId: templateId || null,
        source: source || 'manual',
      },
    });

    return { resume };
  }

  async update(userId: number, id: number, updateResumeDto: UpdateResumeDto) {
    // 检查简历是否存在且属于当前用户
    const existingResume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existingResume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    const { title, data, style, templateId, expectedUpdatedAt } = updateResumeDto;

    const updatePayload = {
      ...(title && { title }),
      ...(data && { data: data as any }),
      ...(style && { style: style as any }),
      ...(templateId !== undefined && { templateId }),
    };

    if (expectedUpdatedAt) {
      const expectedDate = new Date(expectedUpdatedAt);
      if (Number.isNaN(expectedDate.getTime())) {
        throw new BadRequestException({
          success: false,
          error: { code: 1001, message: 'expectedUpdatedAt 格式无效' },
        });
      }

      const updated = await this.prisma.resume.updateMany({
        where: {
          id,
          userId,
          updatedAt: expectedDate,
        },
        data: updatePayload,
      });

      if (updated.count === 0) {
        throw new ConflictException({
          success: false,
          error: {
            code: 4090,
            message: '简历已被其他窗口修改，请刷新后重试',
            currentUpdatedAt: existingResume.updatedAt.toISOString(),
          },
        });
      }

      const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
      return { resume };
    }

    const resume = await this.prisma.resume.update({
      where: { id },
      data: updatePayload,
    });

    return { resume };
  }

  async remove(userId: number, id: number) {
    // 检查简历是否存在且属于当前用户
    const existingResume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existingResume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    await this.prisma.resume.delete({
      where: { id },
    });

    return { message: '简历删除成功' };
  }

  async duplicate(userId: number, id: number) {
    const sourceResume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!sourceResume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    const duplicate = await this.prisma.resume.create({
      data: {
        userId,
        title: `${sourceResume.title} (副本)`,
        data: sourceResume.data as any,
        style: sourceResume.style as any,
        templateId: sourceResume.templateId,
      },
    });

    return { resume: duplicate };
  }

  async batchDelete(userId: number, batchDeleteDto: BatchDeleteDto) {
    const { ids } = batchDeleteDto;

    if (!ids || ids.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 1001,
          message: '请提供要删除的简历ID列表',
        },
      });
    }

    const result = await this.prisma.resume.deleteMany({
      where: {
        id: { in: ids.map(Number) },
        userId,
      },
    });

    return {
      deletedCount: result.count,
      message: `成功删除 ${result.count} 份简历`,
    };
  }

  async toggleFavorite(userId: number, id: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    const updated = await this.prisma.resume.update({
      where: { id },
      data: { isFavorite: !resume.isFavorite },
      select: { id: true, isFavorite: true },
    });

    return {
      isFavorite: updated.isFavorite,
      message: updated.isFavorite ? '收藏成功' : '取消收藏成功',
    };
  }

  async createShare(userId: number, resumeId: number, shareDto: ShareDto) {
    const { expiresInHours = 72 } = shareDto;

    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareExpiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const updated = await this.prisma.resume.update({
      where: { id: resumeId },
      data: { shareToken, shareExpiresAt },
      select: { shareToken: true, shareExpiresAt: true },
    });

    const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3001';
    const shareUrl = `${baseUrl}/api/resumes/share/${shareToken}`;

    return {
      shareUrl,
      expiresAt: updated.shareExpiresAt,
    };
  }

  async removeShare(userId: number, resumeId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '简历不存在',
        },
      });
    }

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { shareToken: null, shareExpiresAt: null },
    });

    return { message: '分享链接已取消' };
  }

  async getSharedResume(token: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        shareToken: token,
        shareExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        title: true,
        data: true,
        style: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resume) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 3001,
          message: '分享链接无效或已过期',
        },
      });
    }

    return { resume };
  }
}