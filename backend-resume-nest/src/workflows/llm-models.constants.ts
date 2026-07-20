import { readFileSync } from 'fs';
import { join } from 'path';

export interface LlmModelSeedRow {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  resumeText?: boolean;
}

interface LlmModelCatalog {
  defaultModelId: string;
  legacyAliases: Record<string, string>;
  provider?: {
    id: string;
    name?: string;
    apiUrl: string;
    apiKeyEnv?: string;
  };
  agentRuntime?: {
    qpsLimit: number;
    temperature: number;
    maxTokens: number;
    timeoutSeconds: number;
    logApiCalls: boolean;
  };
  nestRuntime?: {
    multiagentHealthTimeoutMs: number;
    multiagentCallTimeoutMs: number;
    multiagentStreamTimeoutMs?: number;
    httpToolTimeoutMs: number;
  };
  workflowNodeDefaults?: {
    temperature: number;
    topP: number;
    maxTokens: number;
    outputFormat: 'json' | 'text' | 'markdown';
    maxRetries: number;
    memoryTurns: number;
    systemPrompt: string;
  };
  models: LlmModelSeedRow[];
}

let cachedCatalog: LlmModelCatalog | null = null;

function loadCatalog(): LlmModelCatalog {
  if (!cachedCatalog) {
    const catalogPath = join(process.cwd(), 'config/llm-models.json');
    cachedCatalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as LlmModelCatalog;
  }
  return cachedCatalog;
}

export function getLlmModelCatalog(): LlmModelCatalog {
  return loadCatalog();
}

export function getLlmProviderConfig() {
  const catalog = loadCatalog();
  return (
    catalog.provider ?? {
      id: 'zhipu',
      name: '智谱清言',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      apiKeyEnv: 'ZHIPU_API_KEY',
    }
  );
}

export function getAgentRuntimeConfig() {
  const catalog = loadCatalog();
  return (
    catalog.agentRuntime ?? {
      qpsLimit: 1,
      temperature: 0.7,
      maxTokens: 2048,
      timeoutSeconds: 60,
      logApiCalls: true,
    }
  );
}

export function getNestRuntimeConfig() {
  const catalog = loadCatalog();
  return (
    catalog.nestRuntime ?? {
      multiagentHealthTimeoutMs: 5000,
      multiagentCallTimeoutMs: 180000,
      multiagentStreamTimeoutMs: 300000,
      httpToolTimeoutMs: 30000,
    }
  );
}

export function getWorkflowNodeDefaults() {
  const catalog = loadCatalog();
  return (
    catalog.workflowNodeDefaults ?? {
      temperature: 0.4,
      topP: 0.9,
      maxTokens: 2048,
      outputFormat: 'json' as const,
      maxRetries: 2,
      memoryTurns: 10,
      systemPrompt:
        '你是一位专业的简历优化专家。请根据提供的信息优化简历内容，突出候选人的优势，提升简历的专业性和竞争力。',
    }
  );
}

export const DEFAULT_LLM_MODEL_ID = loadCatalog().defaultModelId;

export const FREE_ZHIPU_LLM_MODELS: LlmModelSeedRow[] = loadCatalog().models.filter((m) => m.isActive !== false);

export const RESUME_TEXT_LLM_MODELS: LlmModelSeedRow[] = FREE_ZHIPU_LLM_MODELS.filter((m) => m.resumeText === true);

export const LEGACY_LLM_MODEL_ALIASES: Record<string, string> = loadCatalog().legacyAliases;

function resolveNormalizedId(modelId?: string | null): string {
  if (!modelId?.trim()) return DEFAULT_LLM_MODEL_ID;
  const key = modelId.trim().toLowerCase();
  const aliased = LEGACY_LLM_MODEL_ALIASES[key] ?? key;
  const match = FREE_ZHIPU_LLM_MODELS.find((m) => m.id.toLowerCase() === aliased);
  return match?.id ?? aliased;
}

export function normalizeLlmModelId(modelId?: string | null): string {
  return resolveNormalizedId(modelId);
}

export function isSupportedLlmModelId(modelId?: string | null): boolean {
  const normalized = resolveNormalizedId(modelId);
  return FREE_ZHIPU_LLM_MODELS.some((m) => m.id === normalized);
}

export function isResumeTextLlmModelId(modelId?: string | null): boolean {
  const normalized = resolveNormalizedId(modelId);
  return RESUME_TEXT_LLM_MODELS.some((m) => m.id === normalized);
}

/** 工作流/简历场景：非文本模型回退到默认文本模型 */
export function normalizeResumeLlmModelId(modelId?: string | null): string {
  const normalized = resolveNormalizedId(modelId);
  if (isResumeTextLlmModelId(normalized)) return normalized;
  const defaultRow = RESUME_TEXT_LLM_MODELS.find((m) => m.isDefault) ?? RESUME_TEXT_LLM_MODELS[0];
  return defaultRow?.id ?? DEFAULT_LLM_MODEL_ID;
}
