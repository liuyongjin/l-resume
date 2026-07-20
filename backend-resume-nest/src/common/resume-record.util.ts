import { mergeIntoTemplateScaffold, buildResumeStyleFromTemplate } from './resume-data.util';
import { defaultStyle, emptyResumeData } from '../resumes/resume-defaults';
import {
  resolveTemplateDataSchema,
  resolveTemplateStyleSchema,
} from '../templates/template-field-schemas';

/** jf_resume 表可写字段（不含 id / userId / created_at / updated_at） */
export const RESUME_WRITABLE_FIELDS = [
  'title',
  'data',
  'style',
  'templateId',
  'source',
  'isFavorite',
  'shareToken',
  'shareExpiresAt',
] as const;

export type ResumeWritableField = (typeof RESUME_WRITABLE_FIELDS)[number];

export interface WorkflowResumeRecord {
  title?: string;
  data: Record<string, unknown>;
  style?: Record<string, unknown>;
  templateId?: string;
  source?: string;
  isFavorite?: boolean;
  shareToken?: string | null;
  shareExpiresAt?: string | null;
}

export type WorkflowResumeRecordPatch = Partial<Omit<WorkflowResumeRecord, 'data'>> & {
  data?: Record<string, unknown>;
};

export interface TemplateSnapshot {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  data: Record<string, unknown>;
  style: Record<string, unknown>;
  dataSchema: Record<string, unknown>;
  styleSchema: Record<string, unknown>;
  config: Record<string, unknown>;
  isActive?: boolean;
}

export function toTemplateSnapshot(template: {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  data: unknown;
  style: unknown;
  dataSchema?: unknown;
  styleSchema?: unknown;
  config: unknown;
  isActive?: boolean;
}): TemplateSnapshot {
  return {
    id: template.id,
    name: template.name,
    description: template.description ?? null,
    previewUrl: template.previewUrl ?? null,
    data: (template.data as Record<string, unknown>) || emptyResumeData(),
    style: (template.style as Record<string, unknown>) || defaultStyle(),
    dataSchema: resolveTemplateDataSchema(template.dataSchema),
    styleSchema: resolveTemplateStyleSchema(template.styleSchema),
    config: (template.config as Record<string, unknown>) || {},
    isActive: template.isActive ?? true,
  };
}

export function toResumeRecordFromDb(resume: {
  title: string;
  data: unknown;
  style: unknown;
  templateId?: string | null;
  source?: string | null;
  isFavorite?: boolean;
  shareToken?: string | null;
  shareExpiresAt?: Date | null;
}): WorkflowResumeRecord {
  return {
    title: resume.title,
    data: (resume.data as Record<string, unknown>) || emptyResumeData(),
    style: (resume.style as Record<string, unknown>) || defaultStyle(),
    templateId: resume.templateId ?? undefined,
    source: resume.source ?? undefined,
    isFavorite: resume.isFavorite ?? false,
    shareToken: resume.shareToken ?? null,
    shareExpiresAt: resume.shareExpiresAt?.toISOString() ?? null,
  };
}

export function buildInitialResumeRecord(params: {
  templateSnapshot: TemplateSnapshot;
  themeKey: string;
  resumeData?: Record<string, unknown>;
  rawText?: string;
  existing?: WorkflowResumeRecord;
  source?: string;
  defaultTitle?: string;
}): WorkflowResumeRecord {
  const {
    templateSnapshot,
    themeKey,
    resumeData,
    rawText,
    existing,
    source = 'workflow',
    defaultTitle,
  } = params;

  const templateStyle = buildResumeStyleFromTemplate(templateSnapshot.style, templateSnapshot.config);
  const baseData = resumeData || emptyResumeData();
  const data: Record<string, unknown> = {
    ...baseData,
    ...(rawText ? { rawText } : {}),
  };

  return {
    title: existing?.title || defaultTitle || '未命名简历',
    data,
    style: existing?.style || templateStyle,
    templateId: existing?.templateId || templateSnapshot.id,
    source: existing?.source || source,
    isFavorite: existing?.isFavorite ?? false,
    shareToken: existing?.shareToken ?? null,
    shareExpiresAt: existing?.shareExpiresAt ?? null,
  };
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** 从上传文件名推导 jf_resume.title（去掉扩展名） */
export function deriveResumeTitleFromFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return '未命名简历';
  const withoutExt = trimmed.replace(/\.[^.]+$/, '').trim();
  return withoutExt || trimmed;
}

function pickNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return pickString(value);
}

/** 将解析/智能体输出归一化为 jf_resume 表字段结构 */
export function normalizeParsedResumeRecord(
  parsed: Record<string, unknown>,
  base: WorkflowResumeRecord,
): WorkflowResumeRecord {
  const hasRecordShape =
    parsed.title !== undefined ||
    parsed.data !== undefined ||
    parsed.style !== undefined ||
    parsed.templateId !== undefined ||
    parsed.source !== undefined;

  if (hasRecordShape) {
    const dataSource =
      parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
        ? (parsed.data as Record<string, unknown>)
        : parsed;
    return {
      title: pickString(parsed.title) ?? pickString(parsed.resumeTitle) ?? base.title,
      data: mergeIntoTemplateScaffold(base.data, dataSource, {
        preferParsedOnly: true,
        preserveExistingFields: true,
      }),
      style:
        parsed.style && typeof parsed.style === 'object' && !Array.isArray(parsed.style)
          ? { ...(base.style || defaultStyle()), ...(parsed.style as Record<string, unknown>) }
          : base.style,
      templateId: pickString(parsed.templateId) ?? base.templateId,
      source: pickString(parsed.source) ?? base.source,
      isFavorite:
        typeof parsed.isFavorite === 'boolean' ? parsed.isFavorite : base.isFavorite,
      shareToken:
        parsed.shareToken !== undefined
          ? (parsed.shareToken as string | null)
          : base.shareToken,
      shareExpiresAt:
        parsed.shareExpiresAt !== undefined
          ? pickNullableString(parsed.shareExpiresAt) ?? null
          : base.shareExpiresAt,
    };
  }

  return {
    ...base,
    data: mergeIntoTemplateScaffold(base.data, parsed, {
      preferParsedOnly: true,
      preserveExistingFields: true,
    }),
  };
}

export function applyResumeRecordPatch(
  base: WorkflowResumeRecord,
  patch: WorkflowResumeRecordPatch,
  options?: { preferParsedOnly?: boolean },
): WorkflowResumeRecord {
  if (!patch || typeof patch !== 'object') return base;

  const preferParsedOnly = options?.preferParsedOnly === true;

  return {
    title: pickString(patch.title) ?? pickString((patch as Record<string, unknown>).resumeTitle) ?? base.title,
    data: patch.data
      ? mergeIntoTemplateScaffold(base.data, patch.data, { preferParsedOnly })
      : base.data,
    style:
      patch.style && typeof patch.style === 'object'
        ? { ...(base.style || defaultStyle()), ...(patch.style as Record<string, unknown>) }
        : base.style,
    templateId: pickString(patch.templateId) ?? base.templateId,
    source: pickString(patch.source) ?? base.source,
    isFavorite:
      typeof patch.isFavorite === 'boolean' ? patch.isFavorite : base.isFavorite,
    shareToken: patch.shareToken !== undefined ? patch.shareToken : base.shareToken,
    shareExpiresAt:
      patch.shareExpiresAt !== undefined ? patch.shareExpiresAt : base.shareExpiresAt,
  };
}

export function summarizeResumeRecord(record: WorkflowResumeRecord): Record<string, unknown> {
  return {
    title: record.title,
    templateId: record.templateId,
    source: record.source,
    isFavorite: record.isFavorite,
    hasShareToken: Boolean(record.shareToken),
    styleKeys: record.style ? Object.keys(record.style) : [],
    dataKeys: record.data ? Object.keys(record.data) : [],
  };
}
