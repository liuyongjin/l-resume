import { emptyResumeData, defaultStyle } from '../resumes/resume-defaults';

/** 从工作流/多智能体输出中提取 ResumeData */
export function extractWorkflowResumeData(result: any): Record<string, unknown> {
  if (result?.status === 'failed' || result?.output_data?.error) {
    throw new Error(result?.output_data?.error || '工作流执行失败');
  }

  const outputData = result?.output_data || result?.data?.output_data || result?.data || result;

  if (outputData?.resume_data && typeof outputData.resume_data === 'object') {
    return outputData.resume_data as Record<string, unknown>;
  }

  const versions = outputData?.versions || [];
  if (versions.length > 0) {
    return versions[0].content || versions[0];
  }

  const optimized = outputData?.optimized_content || outputData?.all_optimized?.[0] || outputData?.final_content;
  if (optimized) {
    return optimized.final_content || optimized.content || optimized;
  }

  throw new Error('工作流未返回有效的简历数据');
}

/** 从 systemPrompt / 描述中解析「修改简历名称」类指令的目标标题 */
export function extractRequestedResumeTitleFromPrompt(prompt: string | undefined): string | undefined {
  if (!prompt?.trim()) return undefined;
  const text = prompt.trim();

  // 修改为「xxx」/ "xxx" / "xxx" — 兼容中文弯引号 U+201C/U+201D
  const renameMatch = text.match(
    /(?:修改|改|设置|设为)[为成]?\s*[\u201c"\u300c「'`‘]([^\u201d"\u300d」'`’\n]+)[\u201d"\u300d」'`’]/,
  );
  if (renameMatch?.[1]?.trim()) return renameMatch[1].trim();

  if (!/简历名称|文档名称|简历标题|文件名/.test(text)) return undefined;

  const patterns = [
    /简历(?:名称|标题|文档名称)[\s\S]*?(?:修改|改|设置|设为)[\s\S]*?[\u201c"\u300c「'`‘]([^\u201d"\u300d」'`’\n]+)[\u201d"\u300d」'`’]/,
    /(?:名称|标题)[\s\S]*?(?:修改|改|设置|设为)[\s\S]*?[\u201c"\u300c「'`‘]([^\u201d"\u300d」'`’\n]+)[\u201d"\u300d」'`’]/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

/** 从工作流智能体节点配置中解析最终请求的简历文档标题（按执行顺序，后者覆盖前者） */
export function resolveWorkflowRequestedResumeTitle(nodes: unknown): string | undefined {
  if (!Array.isArray(nodes)) return undefined;
  let title: string | undefined;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const record = node as Record<string, unknown>;
    const config = record.config as Record<string, unknown> | undefined;
    const parts = [config?.systemPrompt, record.description, config?.system_prompt]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    const parsed = extractRequestedResumeTitleFromPrompt(parts.join('\n'));
    if (parsed) title = parsed;
  }
  return title;
}

/** 从工作流/多智能体输出中提取简历文档标题（非 basicInfo.name、非 versions[].title） */
export function extractWorkflowResumeTitle(result: any): string | undefined {
  const outputData = result?.output_data || result?.data?.output_data || result?.data || result;
  const direct = outputData?.resume_title || outputData?.resumeTitle;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const agentResult = outputData?.agent_result;
  if (agentResult && typeof agentResult === 'object') {
    const fromAgent = extractWorkflowResumeTitle({ output_data: agentResult });
    if (fromAgent) return fromAgent;
  }

  const versions = outputData?.versions || agentResult?.versions || [];
  if (Array.isArray(versions) && versions.length > 0 && versions[0] && typeof versions[0] === 'object') {
    const v0 = versions[0] as Record<string, unknown>;
    for (const key of ['resumeTitle', 'resume_title'] as const) {
      const value = v0[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  const optimized = outputData?.optimized_versions || agentResult?.optimized_versions || [];
  if (Array.isArray(optimized) && optimized.length > 0 && optimized[0] && typeof optimized[0] === 'object') {
    const o0 = optimized[0] as Record<string, unknown>;
    for (const key of ['resumeTitle', 'resume_title'] as const) {
      const value = o0[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return undefined;
}

/** 从工作流/多智能体输出中提取样式 patch */
export function extractWorkflowResumeStyle(result: any): Record<string, unknown> | undefined {
  const outputData = result?.output_data || result?.data?.output_data || result?.data || result;
  const direct = outputData?.resume_style || outputData?.resumeStyle || outputData?.style;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }

  const agentResult = outputData?.agent_result;
  const versions = outputData?.versions || agentResult?.versions || [];
  if (Array.isArray(versions) && versions.length > 0 && versions[0] && typeof versions[0] === 'object') {
    const v0 = versions[0] as Record<string, unknown>;
    for (const key of ['resumeStyle', 'resume_style', 'style']) {
      const value = v0[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }
  }

  return undefined;
}

/** 从工作流节点输出提取 jf_resume 表字段 patch（不含 timestamps） */
export function extractWorkflowResumeRecordPatch(
  result: any,
  options?: { systemPrompt?: string },
): Record<string, unknown> {
  const outputData = result?.output_data || result?.data?.output_data || result?.data || result;
  const patch: Record<string, unknown> = {};

  const requestedTitle = extractRequestedResumeTitleFromPrompt(options?.systemPrompt);
  const title = requestedTitle || extractWorkflowResumeTitle(result);
  if (title) patch.title = title;

  const style = extractWorkflowResumeStyle(result);
  if (style) patch.style = style;

  // templateId 由工作流执行上下文中的 templates.id 决定，不接受智能体返回值覆盖
  for (const key of ['source', 'isFavorite', 'shareToken', 'shareExpiresAt'] as const) {
    if (outputData?.[key] !== undefined) patch[key] = outputData[key];
  }

  return patch;
}

export function extractTranslatedResumeData(result: any): Record<string, unknown> {
  const output = result?.output_data || result;
  return output?.translated || output?.parsed || output;
}

function coalesceNonEmptyArray(...candidates: unknown[]): unknown[] {
  for (const val of candidates) {
    if (Array.isArray(val) && val.length > 0) return val;
  }
  return [];
}

/** 按 id 合并数组条目；无 id 或 patch 更长时整表替换 */
function mergeArrayById<T extends Record<string, unknown>>(
  base: T[],
  patch: T[],
  preserveExisting: boolean,
): T[] {
  if (!Array.isArray(patch)) return preserveExisting ? base : [];
  if (patch.length === 0) return preserveExisting ? base : [];

  const patchHasIds = patch.some((item) => item?.id != null && String(item.id));
  if (!patchHasIds || patch.length >= base.length) return patch;

  const patchById = new Map<string, T>();
  const extras: T[] = [];
  for (const item of patch) {
    const id = item?.id != null ? String(item.id) : '';
    if (id) patchById.set(id, item);
    else extras.push(item);
  }

  const merged = base.map((item) => {
    const id = item?.id != null ? String(item.id) : '';
    if (id && patchById.has(id)) {
      const p = patchById.get(id)!;
      patchById.delete(id);
      return { ...item, ...p } as T;
    }
    return item;
  });
  for (const item of patchById.values()) merged.push(item);
  return [...merged, ...extras];
}

function hasStructuredResumeSections(data: Record<string, unknown>): boolean {
  const sectionKeys = [
    'workExperience',
    'education',
    'projectExperience',
    'skills',
    'certificates',
    'campusActivity',
    'portfolio',
    'dataProjects',
    'productAchievements',
    'publications',
    'openSourceProject',
  ];
  return sectionKeys.some((key) => Array.isArray(data[key]) && (data[key] as unknown[]).length > 0);
}

function isRawTextDumpSummary(summary: string, rawText: string): boolean {
  const s = summary.trim();
  const r = rawText.trim();
  if (!s || !r) return false;
  if (s === r) return true;
  if (s.length > 600 && r.startsWith(s.slice(0, Math.min(200, s.length)))) return true;
  if (s.length > 600 && r.length > 600 && s.length / r.length > 0.85) return true;
  return false;
}

const RESUME_SECTION_MARKERS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'professionalSummary', pattern: /(?:^|\n)\s*(个人总结|自我评价|专业摘要|PROFILE|SUMMARY)\s*(?:\n|$)/i },
  { key: 'education', pattern: /(?:^|\n)\s*(教育经历|教育背景|EDUCATION)\s*(?:\n|$)/i },
  { key: 'workExperience', pattern: /(?:^|\n)\s*(工作经历|工作经验|实习经历|WORK(?:\s+EXPERIENCE)?)\s*(?:\n|$)/i },
  { key: 'projectExperience', pattern: /(?:^|\n)\s*(项目经历|项目经验|PROJECT(?:\s+EXPERIENCE)?)\s*(?:\n|$)/i },
  { key: 'skills', pattern: /(?:^|\n)\s*(技能|专业技能|技术栈|SKILLS?)\s*(?:\n|$)/i },
];

const DATE_RANGE_RE = /(\d{4}[.\-/年]\d{1,2})\s*[-–—~至到]\s*(\d{4}[.\-/年]\d{1,2}|至今|现在|present)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d{2,3}[-\s]?)?1[3-9]\d{9}|\d{3,4}-\d{7,8}/;
const GITHUB_RE = /https?:\/\/github\.com\/[^\s\n]+/i;

function splitRawTextSections(rawText: string): Record<string, string> & { header: string } {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\n--\s*\d+\s+of\s+\d+\s*--\s*\n/g, '\n');
  const markers: Array<{ key: string; index: number; length: number }> = [];

  for (const marker of RESUME_SECTION_MARKERS) {
    const match = normalized.match(marker.pattern);
    if (match?.index !== undefined) {
      markers.push({ key: marker.key, index: match.index, length: match[0].length });
    }
  }

  markers.sort((a, b) => a.index - b.index);
  const sections: Record<string, string> & { header: string } = { header: '' };

  if (markers.length === 0) {
    sections.header = normalized.trim();
    return sections;
  }

  sections.header = normalized.slice(0, markers[0].index).trim();
  for (let i = 0; i < markers.length; i += 1) {
    const start = markers[i].index + markers[i].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : normalized.length;
    sections[markers[i].key] = normalized.slice(start, end).trim();
  }
  return sections;
}

function parseBasicInfoFromHeader(header: string, fullText: string): Record<string, string> {
  const lines = header.split('\n').map((l) => l.trim()).filter(Boolean);
  const basicInfo: Record<string, string> = {
    name: '',
    position: '',
    phone: '',
    email: '',
    city: '',
    github: '',
  };

  if (lines[0] && lines[0].length <= 20 && !/https?:\/\//.test(lines[0])) {
    basicInfo.name = lines[0];
  }
  if (lines[1] && !/https?:\/\//.test(lines[1]) && !EMAIL_RE.test(lines[1])) {
    basicInfo.position = lines[1];
  }

  const github = fullText.match(GITHUB_RE);
  if (github) basicInfo.github = github[0];

  const email = fullText.match(EMAIL_RE);
  if (email) basicInfo.email = email[0];

  const phone = fullText.match(PHONE_RE);
  if (phone) basicInfo.phone = phone[0];

  return basicInfo;
}

function parseEducationBlocks(section: string): unknown[] {
  if (!section.trim()) return [];
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const items: unknown[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (!current || (current.school && current.major && current.degree)) {
      current = { id: String(items.length + 1), school: line, major: '', degree: '', startDate: '', endDate: '', description: '' };
      items.push(current);
      continue;
    }
    if (!current.major) {
      current.major = line;
    } else if (!current.degree) {
      current.degree = line;
    }
  }
  return items;
}

function parseExperienceBlocks(section: string, type: 'work' | 'project'): unknown[] {
  if (!section.trim()) return [];
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  const dateIndices = lines
    .map((line, idx) => (DATE_RANGE_RE.test(line) ? idx : -1))
    .filter((idx) => idx >= 0);

  if (dateIndices.length === 0) {
    return parseLooseExperienceBlocks(lines, type);
  }

  const items: unknown[] = [];
  for (let d = 0; d < dateIndices.length; d += 1) {
    const dateIdx = dateIndices[d];
    const nextDateIdx = d + 1 < dateIndices.length ? dateIndices[d + 1] : lines.length;
    const prevDateIdx = d > 0 ? dateIndices[d - 1] : -1;
    const headerStart = prevDateIdx >= 0 ? prevDateIdx + 1 : 0;
    const headerLines = lines.slice(Math.max(headerStart, dateIdx - 2), dateIdx).filter(Boolean);
    const dateMatch = lines[dateIdx].match(DATE_RANGE_RE);

    let descStart = dateIdx + 1;
    if (descStart < lines.length && lines[descStart].length <= 8 && !DATE_RANGE_RE.test(lines[descStart])) {
      descStart += 1;
    }
    const descEnd = nextDateIdx > dateIdx + 1 ? nextDateIdx - Math.min(2, nextDateIdx - dateIdx - 1) : lines.length;
    const description = lines.slice(descStart, Math.max(descStart, descEnd)).filter((l) => !DATE_RANGE_RE.test(l));

    const titleLine = headerLines[0] || lines[Math.max(0, dateIdx - 2)] || '';
    const roleLine = headerLines[1] || headerLines[0] || '';

    items.push({
      id: String(items.length + 1),
      ...(type === 'work'
        ? { company: titleLine, position: roleLine || titleLine }
        : { name: titleLine, role: roleLine || titleLine }),
      startDate: dateMatch?.[1] || '',
      endDate: dateMatch?.[2] || '',
      description,
    });
  }

  return items;
}

function parseLooseExperienceBlocks(lines: string[], type: 'work' | 'project'): unknown[] {
  const items: unknown[] = [];
  let current: Record<string, unknown> | null = null;

  for (const line of lines) {
    const looksLikeTitle = line.length <= 40;
    if (!current || ((current.description as string[]).length > 2 && looksLikeTitle && !line.startsWith('负责') && !line.startsWith('技术栈'))) {
      current = type === 'work'
        ? { id: String(items.length + 1), company: line, position: '', startDate: '', endDate: '', description: [] as string[] }
        : { id: String(items.length + 1), name: line, role: '', startDate: '', endDate: '', description: [] as string[] };
      items.push(current);
      continue;
    }

    if (type === 'work' && !current.position && looksLikeTitle && !line.includes('：') && !line.includes(':')) {
      current.position = line;
      continue;
    }
    if (type === 'project' && !current.role && looksLikeTitle && !line.includes('：') && !line.includes(':')) {
      current.role = line;
      continue;
    }

    (current.description as string[]).push(line);
  }

  return items;
}

function parseSkillsBlocks(section: string): unknown[] {
  if (!section.trim()) return [];
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: unknown[] = [];
  let current: { id: string; category: string; items: string[] } | null = null;

  for (const line of lines) {
    const isCategory = line.length <= 20 && !line.includes(',') && !line.includes('，');
    if (!current || (current.items.length > 0 && isCategory)) {
      current = { id: String(items.length + 1), category: line, items: [] };
      items.push(current);
      continue;
    }
    const parts = line.split(/[,，、/|]/).map((s) => s.trim()).filter(Boolean);
    current.items.push(...parts);
  }
  return items.filter((s) => (s as { items: string[] }).items.length > 0 || (s as { category: string }).category);
}

/** 本地规则解析 rawText（multiagent 不可用或 AI 解析失败时的兜底） */
export function parseRawTextHeuristic(rawText: string): Record<string, unknown> {
  if (!rawText?.trim()) return { rawText: rawText || '' };

  const sections = splitRawTextSections(rawText);
  const basicInfo = parseBasicInfoFromHeader(sections.header, rawText);
  const professionalSummary = sections.professionalSummary?.replace(/\s+/g, ' ').trim() || '';
  const education = parseEducationBlocks(sections.education || '');
  const workExperience = parseExperienceBlocks(sections.workExperience || '', 'work');
  const projectExperience = parseExperienceBlocks(sections.projectExperience || '', 'project');
  const skills = parseSkillsBlocks(sections.skills || '');

  return normalizeResumeDataShape({
    basicInfo,
    professionalSummary,
    workExperience,
    education,
    projectExperience,
    skills: skills.length > 0 ? skills : [{ id: 'skill1', category: '专业技能', items: [] }],
    rawText,
  });
}

export function hasMeaningfulStructuredSections(data: Record<string, unknown>): boolean {
  if (hasStructuredResumeSections(data)) return true;
  const basic = data.basicInfo as Record<string, unknown> | undefined;
  return Boolean(basic?.name || basic?.position || basic?.email || basic?.phone);
}

/** 统一 AI/解析输出字段名，避免 experience/summary 等别名导致无法落入模板字段 */
export function normalizeResumeDataShape(source: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...source };

  if (!out.professionalSummary && typeof out.summary === 'string') {
    out.professionalSummary = out.summary;
  }

  const workExperience = coalesceNonEmptyArray(out.workExperience, out.experience);
  if (workExperience.length > 0) out.workExperience = workExperience;

  const projectExperience = coalesceNonEmptyArray(out.projectExperience, out.projects);
  if (projectExperience.length > 0) out.projectExperience = projectExperience;

  const openSourceProject = coalesceNonEmptyArray(out.openSourceProject, out.openSource);
  if (openSourceProject.length > 0) out.openSourceProject = openSourceProject;

  const rawText = typeof out.rawText === 'string' ? out.rawText : '';
  const summary = typeof out.professionalSummary === 'string' ? out.professionalSummary : '';
  if (rawText && summary && isRawTextDumpSummary(summary, rawText)) {
    if (hasStructuredResumeSections(out)) {
      out.professionalSummary = '';
    }
  }

  delete out.summary;
  delete out.experience;
  delete out.projects;
  delete out.openSource;

  return out;
}

export interface MergeIntoTemplateScaffoldOptions {
  /** 智能执行/解析场景：不使用模板示例数据回填空字段 */
  preferParsedOnly?: boolean;
  /** 合并智能体 patch 时：parsed 字段为空则保留 base 已有内容 */
  preserveExistingFields?: boolean;
}

/** 将解析结果合并进模板 data 结构（保留模板字段骨架） */
export function mergeIntoTemplateScaffold(
  scaffold: Record<string, unknown> | null | undefined,
  parsed: Record<string, unknown>,
  options?: MergeIntoTemplateScaffoldOptions,
): Record<string, unknown> {
  const preferParsedOnly = options?.preferParsedOnly === true;
  const preserveExistingFields = options?.preserveExistingFields === true;
  const base = preserveExistingFields && scaffold && typeof scaffold === 'object'
    ? JSON.parse(JSON.stringify(scaffold))
    : preferParsedOnly
      ? emptyResumeData()
      : scaffold && typeof scaffold === 'object'
        ? JSON.parse(JSON.stringify(scaffold))
        : emptyResumeData();
  const source = normalizeResumeDataShape(parsed && typeof parsed === 'object' ? parsed : {});

  const mergeBasicField = (key: string, sourceVal: unknown, baseVal: unknown) => {
    if (typeof sourceVal === 'string' && sourceVal.trim()) return sourceVal;
    if (preserveExistingFields && typeof baseVal === 'string' && baseVal.trim()) return baseVal;
    return sourceVal ?? baseVal ?? '';
  };

  const basicInfo = {
    ...(base.basicInfo as Record<string, unknown> || {}),
    ...((source.basicInfo as Record<string, unknown>) || {}),
  };

  const personalInfo = source.personalInfo as Record<string, unknown> | undefined;
  if (personalInfo) {
    const contact = (personalInfo.contact || {}) as Record<string, string>;
    basicInfo.name = mergeBasicField('name', personalInfo.name, basicInfo.name);
    basicInfo.position = mergeBasicField('position', personalInfo.title || personalInfo.position, basicInfo.position);
    basicInfo.phone = mergeBasicField('phone', contact.phone, basicInfo.phone);
    basicInfo.email = mergeBasicField('email', contact.email, basicInfo.email);
    basicInfo.city = mergeBasicField('city', contact.location, basicInfo.city);
  }

  const pickArray = (key: string, altKey?: string) => {
    const val = source[key] ?? (altKey ? source[altKey] : undefined);
    const baseVal = base[key];
    if (Array.isArray(val) && val.length > 0) {
      if (preserveExistingFields && Array.isArray(baseVal) && baseVal.length > 0) {
        return mergeArrayById(
          baseVal as Record<string, unknown>[],
          val as Record<string, unknown>[],
          true,
        );
      }
      return val;
    }
    if (preserveExistingFields && Array.isArray(baseVal) && baseVal.length > 0) return baseVal;
    if (Array.isArray(val)) {
      if (preferParsedOnly) return val;
      return val.length > 0 ? val : (baseVal || []);
    }
    if (preferParsedOnly) return [];
    return baseVal || [];
  };

  const summaryFromSource =
    typeof source.professionalSummary === 'string' ? source.professionalSummary.trim() : '';
  const rawTextFromSource = typeof source.rawText === 'string' ? source.rawText : '';
  const baseSummary = typeof base.professionalSummary === 'string' ? base.professionalSummary.trim() : '';
  let professionalSummary = summaryFromSource
    || (preserveExistingFields ? baseSummary : '')
    || (preferParsedOnly ? '' : baseSummary);
  if (rawTextFromSource && professionalSummary && isRawTextDumpSummary(professionalSummary, rawTextFromSource)) {
    professionalSummary = hasStructuredResumeSections(source) || hasStructuredResumeSections(base as Record<string, unknown>)
      ? (preserveExistingFields ? baseSummary : '')
      : professionalSummary;
  }

  return {
    ...base,
    basicInfo,
    professionalSummary,
    rawText: rawTextFromSource || (base.rawText as string | undefined) || '',
    workExperience: pickArray('workExperience', 'experience'),
    education: pickArray('education'),
    projectExperience: pickArray('projectExperience', 'projects'),
    skills: pickArray('skills'),
    certificates: pickArray('certificates'),
    openSourceProject: pickArray('openSourceProject', 'openSource'),
    github: pickArray('github'),
    campusActivity: pickArray('campusActivity'),
    portfolio: pickArray('portfolio'),
    dataProjects: pickArray('dataProjects'),
    productAchievements: pickArray('productAchievements'),
    publications: pickArray('publications'),
    otherTags: pickArray('otherTags'),
    githubDesc: source.githubDesc || (preferParsedOnly ? '' : (base.githubDesc as string) || ''),
  };
}

export function getTemplateThemeKey(template: { id: string; config: unknown }): string {
  const cfg = template.config;
  if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
    const themeKey = (cfg as Record<string, unknown>).themeKey;
    if (typeof themeKey === 'string' && themeKey) return themeKey;
  }
  return template.id;
}

export function buildResumeStyleFromTemplate(
  templateStyle: unknown,
  templateConfig: unknown,
): Record<string, unknown> {
  const style = templateStyle && typeof templateStyle === 'object' ? { ...(templateStyle as object) } : defaultStyle();
  const cfg = templateConfig && typeof templateConfig === 'object' ? (templateConfig as Record<string, unknown>) : {};
  if (cfg.primaryColor) {
    (style as Record<string, unknown>).theme = cfg.primaryColor;
  }
  const styleRecord = style as Record<string, unknown>;
  if (!('hiddenSections' in styleRecord) && Array.isArray(cfg.defaultHiddenSections)) {
    styleRecord.hiddenSections = [...cfg.defaultHiddenSections];
  }
  return style;
}
