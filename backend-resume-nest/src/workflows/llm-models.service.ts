import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_LLM_MODEL_ID,
  FREE_ZHIPU_LLM_MODELS,
  normalizeLlmModelId,
  normalizeResumeLlmModelId,
  RESUME_TEXT_LLM_MODELS,
} from './llm-models.constants';

export interface LlmModelOption {
  label: string;
  value: string;
  provider: string;
  maxTokens: number;
  isDefault: boolean;
  description?: string | null;
}

@Injectable()
export class LlmModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(resumeTextOnly = true): Promise<LlmModelOption[]> {
    const rows = await this.prisma.llmModel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    if (!resumeTextOnly) {
      return rows.map((row) => this.toOption(row));
    }

    const allowedIds = new Set(RESUME_TEXT_LLM_MODELS.map((m) => m.id));

    return rows.filter((row) => allowedIds.has(row.id)).map((row) => this.toOption(row));
  }

  /** 返回 jf_llm_model 表中全部 is_active 记录（供模型选择器等 UI 使用） */
  async listAllActive(): Promise<LlmModelOption[]> {
    const rows = await this.prisma.llmModel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toOption(row));
  }

  private toOption(row: {
    id: string;
    name: string;
    provider: string;
    maxTokens: number;
    isDefault: boolean;
    description: string | null;
  }): LlmModelOption {
    return {
      label: row.name,
      value: row.id,
      provider: row.provider,
      maxTokens: row.maxTokens,
      isDefault: row.isDefault,
      description: row.description,
    };
  }

  /** 校验并解析模型 ID（存在且启用则原样返回，否则回退默认） */
  async resolveActiveModelId(modelId?: string | null): Promise<string> {
    const candidates = new Set<string>();
    if (modelId?.trim()) candidates.add(modelId.trim());
    candidates.add(normalizeLlmModelId(modelId));

    const rows = await this.prisma.llmModel.findMany({
      where: { isActive: true, id: { in: [...candidates] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    if (rows.length > 0) return rows[0].id;

    return this.getDefaultModelId();
  }

  async getDefaultModelId(): Promise<string> {
    const row = await this.prisma.llmModel.findFirst({
      where: { isActive: true, isDefault: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    if (row && RESUME_TEXT_LLM_MODELS.some((m) => m.id === row.id)) return row.id;

    const fallback = await this.prisma.llmModel.findFirst({
      where: { isActive: true, id: { in: RESUME_TEXT_LLM_MODELS.map((m) => m.id) } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return fallback?.id ?? DEFAULT_LLM_MODEL_ID;
  }

  normalizeModelId(modelId?: string | null): string {
    return normalizeResumeLlmModelId(modelId);
  }

  /** 确保存在默认大模型种子（无数据时写入） */
  async ensureSeeded(): Promise<void> {
    const count = await this.prisma.llmModel.count();
    if (count > 0) return;

    await this.prisma.llmModel.createMany({
      data: FREE_ZHIPU_LLM_MODELS.map((row) => ({
        id: row.id,
        name: row.name,
        provider: row.provider,
        description: row.description,
        maxTokens: row.maxTokens,
        isDefault: row.isDefault,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
      })),
    });
  }

  /** 与 config/llm-models.json 同步（init 脚本调用） */
  async syncFromCatalog(): Promise<void> {
    for (const row of FREE_ZHIPU_LLM_MODELS) {
      await this.prisma.llmModel.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          provider: row.provider,
          description: row.description,
          maxTokens: row.maxTokens,
          isDefault: row.isDefault,
          isActive: row.isActive,
          sortOrder: row.sortOrder,
        },
        update: {
          name: row.name,
          provider: row.provider,
          description: row.description,
          maxTokens: row.maxTokens,
          isDefault: row.isDefault,
          isActive: row.isActive,
          sortOrder: row.sortOrder,
        },
      });
    }

    const catalogIds = new Set(FREE_ZHIPU_LLM_MODELS.map((m) => m.id));
    await this.prisma.llmModel.updateMany({
      where: { id: { notIn: [...catalogIds] } },
      data: { isActive: false, isDefault: false },
    });
  }
}
