export type ResumeLanguage = 'zh' | 'en';

/** 从简历 data 中递归收集文本 */
export function collectResumeText(data: unknown, parts: string[] = []): string {
  if (data == null) return parts.join(' ');
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed) parts.push(trimmed);
    return parts.join(' ');
  }
  if (Array.isArray(data)) {
    for (const item of data) collectResumeText(item, parts);
    return parts.join(' ');
  }
  if (typeof data === 'object') {
    for (const value of Object.values(data as Record<string, unknown>)) {
      collectResumeText(value, parts);
    }
  }
  return parts.join(' ');
}

/** 检测简历主体语言（中文 / 英文） */
export function detectResumeLanguage(data: unknown): ResumeLanguage {
  const text = collectResumeText(data);
  if (!text.trim()) return 'zh';

  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;

  if (cjk === 0 && latin > 0) return 'en';
  if (latin === 0 && cjk > 0) return 'zh';
  return cjk >= latin ? 'zh' : 'en';
}

export function getOppositeLanguage(lang: ResumeLanguage): ResumeLanguage {
  return lang === 'zh' ? 'en' : 'zh';
}

export function getTranslatePrompt(target: ResumeLanguage): string {
  return target === 'en' ? '请将整份简历翻译为英文版本' : '请将整份简历翻译为中文版本';
}

export function getTranslateReplyMessage(target: ResumeLanguage): string {
  return target === 'en'
    ? '已将简历翻译为英文版本。请查看修改内容，确认后可应用到简历预览。'
    : '已将简历翻译为中文版本。请查看修改内容，确认后可应用到简历预览。';
}
