import { readFileSync } from 'fs';
import { join } from 'path';

const schemaDir = join(process.cwd(), 'src/templates/schemas');

let cachedDataSchema: Record<string, unknown> | null = null;
let cachedStyleSchema: Record<string, unknown> | null = null;

export function getDefaultDataSchema(): Record<string, unknown> {
  if (!cachedDataSchema) {
    cachedDataSchema = JSON.parse(
      readFileSync(join(schemaDir, 'resume-data-schema.json'), 'utf8'),
    ) as Record<string, unknown>;
  }
  return cachedDataSchema;
}

export function getDefaultStyleSchema(): Record<string, unknown> {
  if (!cachedStyleSchema) {
    cachedStyleSchema = JSON.parse(
      readFileSync(join(schemaDir, 'resume-style-schema.json'), 'utf8'),
    ) as Record<string, unknown>;
  }
  return cachedStyleSchema;
}

export function resolveTemplateDataSchema(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && Object.keys(value as object).length > 0) {
    return value as Record<string, unknown>;
  }
  return getDefaultDataSchema();
}

export function resolveTemplateStyleSchema(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && Object.keys(value as object).length > 0) {
    return value as Record<string, unknown>;
  }
  return getDefaultStyleSchema();
}

/** 预览组件 id → resumes.data 字段名 */
const PREVIEW_COMPONENT_TO_DATA_FIELD: Record<string, string[]> = {
  basicInfo: ['basicInfo'],
  summary: ['professionalSummary'],
  experience: ['workExperience'],
  education: ['education'],
  skills: ['skills'],
  projects: ['projectExperience'],
  certificates: ['certificates'],
  campusActivity: ['campusActivity'],
  portfolio: ['portfolio'],
  dataProjects: ['dataProjects'],
  productAchievements: ['productAchievements'],
  publications: ['publications'],
  openSource: ['openSourceProject'],
  other: ['otherTags', 'githubDesc'],
};

/** 按模板启用的 components 过滤 schema，避免 AI 修改不可见区块 */
export function filterDataSchemaByComponents(
  schema: Record<string, unknown>,
  components: string[] | undefined,
): Record<string, unknown> {
  if (!components?.length) return schema;

  const allFields = (schema.fields as Record<string, unknown>) || {};
  const allowed = new Set<string>(['basicInfo']);

  for (const comp of components) {
    const keys = PREVIEW_COMPONENT_TO_DATA_FIELD[comp] || [comp];
    for (const key of keys) allowed.add(key);
  }

  const filteredFields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (allFields[key]) filteredFields[key] = allFields[key];
  }

  const sectionKeyMap = (schema.sectionKeyMap as Record<string, unknown>) || {};
  const filteredSectionMap: Record<string, unknown> = {};
  for (const key of allowed) {
    if (sectionKeyMap[key]) filteredSectionMap[key] = sectionKeyMap[key];
  }

  return {
    ...schema,
    fields: Object.keys(filteredFields).length ? filteredFields : allFields,
    sectionKeyMap: Object.keys(filteredSectionMap).length ? filteredSectionMap : sectionKeyMap,
    enabledComponents: components,
  };
}
