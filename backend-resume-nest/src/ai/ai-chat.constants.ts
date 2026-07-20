/** 简历 AI 对话推荐问题池（前端每次随机抽取展示） */
export const RESUME_AI_CHAT_PROMPTS = [
  '从招聘方视角分析我的简历，并给出优化建议',
  '针对某个具体岗位，优化我的简历内容',
  '优化我的经历描述，突出成果和量化数据',
  '根据我的全部经历，生成一段个人总结',
  '推荐适合我的简历模板风格',
  '用毒舌 HR 的视角，严厉点评我的简历',
  '把第一条工作经历改写成 STAR 法则描述',
  '修改基本信息：把城市改为北京，手机号改为 13900001111',
  '在教育背景第一段补充荣誉奖项描述',
  '给第一个项目经历增加两条量化成果描述',
  '在证书板块添加 PMP 项目管理认证',
  '添加一条校园活动经历：志愿者协会干事',
  '把简历文档名称改为「前端工程师-投递版」',
  '检查简历中是否有语法错误或表述不当之处',
  '帮我补充项目经历中缺失的技术栈描述',
  '优化技能板块，使其更匹配前端工程师岗位',
  '将自我评价改得更专业、更有说服力',
  '分析我的简历与互联网大厂要求的差距',
  '为校招场景优化我的教育背景和实习经历',
  '生成一份适合投递外企的英文个人简介',
  '精简简历内容，控制在一页纸的篇幅内',
];

export function pickRandomChatPrompts(count = 6): string[] {
  const pool = [...RESUME_AI_CHAT_PROMPTS];
  const picked: string[] = [];
  const limit = Math.min(count, pool.length);
  while (picked.length < limit && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function deriveSessionTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '新对话';
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}
