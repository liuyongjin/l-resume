export interface ThemeConfig {
  id: string
  name: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  subtitleColor: string
  dividerColor: string
  layout: string
  /** 布局预设（schema 驱动组合渲染） */
  layoutPreset?: string
  /** 该模板使用的组件列表 */
  components: string[]
  /** 新建简历时默认隐藏的预览区块（preview section id） */
  defaultHiddenSections?: string[]
  
  avatar: {
    nameClass: string
    titleClass: string
    metaClass: string
    borderWidth: string
    variant?: 'horizontal' | 'centered'
    shape?: 'rounded' | 'circle' | 'square'
    size?: 'sm' | 'md' | 'lg'
  }
  
  section: {
    titleClass: string
    dividerClass: string
  }
  
  experience: {
    titleClass: string
    subtitleClass: string
    dateClass: string
    descriptionClass: string
    achievementClass: string
  }
  
  education: {
    titleClass: string
    subtitleClass: string
    gpaClass: string
    dateClass: string
  }
  
  skills: {
    tagClass: string
    bgColor: string
    textColor: string
    borderColor: string
  }
  
  projects: {
    cardBgColor: string
    titleClass: string
    roleClass: string
    descriptionClass: string
    dateClass: string
    techClass: string
  }
  
  summary: {
    bgColor: string
    textClass: string
  }
}

export const themes: Record<string, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: '极简专业',
    primaryColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#E5E7EB',
    layout: 'composer',
    layoutPreset: 'classic',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects'],
    
    avatar: {
      nameClass: 'text-xl text-gray-900',
      titleClass: 'text-gray-600',
      metaClass: 'text-gray-500',
      borderWidth: '2px'
    },
    
    section: {
      titleClass: 'text-lg text-gray-900',
      dividerClass: 'bg-gray-200'
    },
    
    experience: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-gray-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#E0F2FE',
      textColor: '#0369A1',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#F8FAFC',
      titleClass: 'text-gray-900',
      roleClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#F8FAFC',
      textClass: 'text-gray-600'
    }
  },
  
  modern: {
    id: 'modern',
    name: '应届大学生',
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#DBEAFE',
    layout: 'freshGraduate',
    layoutPreset: 'modern',
    components: ['basicInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certificates', 'campusActivity'],
    defaultHiddenSections: ['summary'],
    
    avatar: {
      nameClass: 'text-2xl font-bold text-gray-900 tracking-tight',
      titleClass: 'text-blue-600 font-medium',
      metaClass: 'text-gray-500',
      borderWidth: '2px',
      variant: 'horizontal',
      shape: 'rounded',
      size: 'md',
    },
    
    section: {
      titleClass: 'text-base font-bold text-gray-900 uppercase tracking-wide',
      dividerClass: 'bg-blue-200'
    },
    
    experience: {
      titleClass: 'text-gray-900 font-semibold',
      subtitleClass: 'text-blue-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-blue-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#DBEAFE',
      textColor: '#1D4ED8',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#EFF6FF',
      titleClass: 'text-gray-900',
      roleClass: 'text-blue-600',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#EFF6FF',
      textClass: 'text-gray-600'
    }
  },
  
  creative: {
    id: 'creative',
    name: '创意设计师',
    primaryColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#FECDD3',
    layout: 'composer',
    layoutPreset: 'creative',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'portfolio'],
    
    avatar: {
      nameClass: 'text-2xl font-bold text-gray-900 tracking-tight',
      titleClass: 'text-pink-600 font-medium',
      metaClass: 'text-gray-500',
      borderWidth: '3px',
      variant: 'centered',
      shape: 'circle',
      size: 'lg',
    },
    
    section: {
      titleClass: 'text-base font-bold text-gray-900',
      dividerClass: 'bg-pink-200'
    },
    
    experience: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-pink-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-pink-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#FCE7F3',
      textColor: '#BE185D',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#FFF1F2',
      titleClass: 'text-gray-900',
      roleClass: 'text-pink-600',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#FFF1F2',
      textClass: 'text-gray-600'
    }
  },
  
  data: {
    id: 'data',
    name: '数据分析师',
    primaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#BBF7D0',
    layout: 'composer',
    layoutPreset: 'data',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'dataProjects', 'certificates'],
    
    avatar: {
      nameClass: 'text-2xl font-bold text-gray-900 tracking-tight',
      titleClass: 'text-green-600 font-medium',
      metaClass: 'text-gray-500',
      borderWidth: '2px',
      variant: 'horizontal',
      shape: 'rounded',
      size: 'md',
    },
    
    section: {
      titleClass: 'text-base font-bold text-gray-900',
      dividerClass: 'bg-green-200'
    },
    
    experience: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-green-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-green-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#D1FAE5',
      textColor: '#059669',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#ECFDF5',
      titleClass: 'text-gray-900',
      roleClass: 'text-green-600',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#ECFDF5',
      textClass: 'text-gray-600'
    }
  },
  
  amber: {
    id: 'amber',
    name: '产品经理',
    primaryColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#FEF3C7',
    layout: 'productManager',
    layoutPreset: 'modern',
    components: ['basicInfo', 'summary', 'skills', 'experience', 'projects', 'productAchievements', 'education'],
    defaultHiddenSections: ['summary'],
    
    avatar: {
      nameClass: 'text-2xl font-bold text-gray-900 tracking-tight',
      titleClass: 'text-amber-600 font-medium',
      metaClass: 'text-gray-500',
      borderWidth: '2px',
      variant: 'horizontal',
      shape: 'rounded',
      size: 'md',
    },
    
    section: {
      titleClass: 'text-base font-bold text-gray-900 uppercase tracking-wide',
      dividerClass: 'bg-amber-200'
    },
    
    experience: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-amber-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-amber-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#FEF3C7',
      textColor: '#D97706',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#FFFBEB',
      titleClass: 'text-gray-900',
      roleClass: 'text-amber-600',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#FFFBEB',
      textClass: 'text-gray-600'
    }
  },
  
  purple: {
    id: 'purple',
    name: '学术研究者',
    primaryColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    subtitleColor: '#6B7280',
    dividerColor: '#EDE9FE',
    layout: 'composer',
    layoutPreset: 'classic',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'publications'],
    
    avatar: {
      nameClass: 'text-2xl font-serif font-bold text-gray-900',
      titleClass: 'text-purple-600 font-medium',
      metaClass: 'text-gray-500',
      borderWidth: '2px',
      variant: 'horizontal',
      shape: 'circle',
      size: 'md',
    },
    
    section: {
      titleClass: 'text-base font-serif font-bold text-gray-900',
      dividerClass: 'bg-purple-200'
    },
    
    experience: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-purple-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    },
    
    education: {
      titleClass: 'text-gray-900',
      subtitleClass: 'text-purple-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    },
    
    skills: {
      tagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      bgColor: '#EDE9FE',
      textColor: '#7C3AED',
      borderColor: 'transparent'
    },
    
    projects: {
      cardBgColor: '#F5F3FF',
      titleClass: 'text-gray-900',
      roleClass: 'text-purple-600',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    },
    
    summary: {
      bgColor: '#F5F3FF',
      textClass: 'text-gray-600'
    }
  },
  
  developer: {
    id: 'developer',
    name: '程序开发',
    primaryColor: '#4A9B8E',
    backgroundColor: '#FBFDFC',
    textColor: '#1E293B',
    subtitleColor: '#475569',
    dividerColor: '#E2EBE8',
    layout: 'developer',
    layoutPreset: 'developer',
    components: ['basicInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'openSource'],

    avatar: {
      nameClass: 'text-2xl font-semibold text-slate-800 tracking-tight',
      titleClass: 'text-sm font-normal',
      metaClass: 'text-slate-500',
      borderWidth: '2px',
      variant: 'horizontal',
      shape: 'rounded',
      size: 'md',
    },

    section: {
      titleClass: 'text-xs font-semibold uppercase tracking-widest text-slate-600',
      dividerClass: 'bg-emerald-100',
    },

    experience: {
      titleClass: 'text-sm font-semibold text-slate-800',
      subtitleClass: 'text-xs',
      dateClass: 'text-[10px] text-slate-400',
      descriptionClass: 'text-[11px] text-slate-600',
      achievementClass: 'text-[11px] text-slate-600',
    },

    education: {
      titleClass: 'text-xs font-medium text-slate-800',
      subtitleClass: 'text-[11px]',
      gpaClass: 'text-slate-400',
      dateClass: 'text-[10px] text-slate-400',
    },

    skills: {
      tagClass: 'px-2 py-0.5 rounded-md text-[11px] font-medium',
      bgColor: '#E8F3F0',
      textColor: '#4A9B8E',
      borderColor: '#C5DDD6',
    },

    projects: {
      cardBgColor: '#FFFFFF',
      titleClass: 'text-sm font-semibold text-slate-800',
      roleClass: 'text-[11px]',
      descriptionClass: 'text-[11px] text-slate-600',
      dateClass: 'text-[10px] text-slate-400',
      techClass: 'text-[10px] text-slate-500',
    },

    summary: {
      bgColor: '#E8F3F0',
      textClass: 'text-[12px] text-slate-600 leading-relaxed',
    },
  },

  frontendEngineer: {
    id: 'frontendEngineer',
    name: '高级前端工程师',
    primaryColor: '#2563EB',
    backgroundColor: '#FFFEFE',
    textColor: '#242424',
    subtitleColor: '#2563EB',
    dividerColor: '#2563EB',
    layout: 'frontendEngineer',
    components: ['basicInfo', 'summary', 'education', 'projects', 'experience', 'skills', 'other'],
    defaultHiddenSections: ['other'],

    avatar: {
      nameClass: 'text-2xl font-semibold text-gray-900',
      titleClass: 'text-blue-600 text-sm',
      metaClass: 'text-gray-500 text-xs',
      borderWidth: '0px'
    },

    section: {
      titleClass: 'text-sm font-semibold tracking-wider text-blue-600',
      dividerClass: 'bg-blue-600'
    },

    experience: {
      titleClass: 'text-gray-900 font-semibold text-sm',
      subtitleClass: 'text-blue-600 text-xs',
      dateClass: 'text-gray-500 text-xs',
      descriptionClass: 'text-gray-700 text-xs',
      achievementClass: 'text-gray-500 text-xs'
    },

    education: {
      titleClass: 'text-gray-900 font-semibold text-sm',
      subtitleClass: 'text-blue-600 text-xs',
      gpaClass: 'text-gray-500 text-xs',
      dateClass: 'text-gray-500 text-xs'
    },

    skills: {
      tagClass: 'text-xs',
      bgColor: 'transparent',
      textColor: '#333',
      borderColor: 'transparent'
    },

    projects: {
      cardBgColor: 'transparent',
      titleClass: 'text-gray-900 font-semibold text-sm',
      roleClass: 'text-blue-600 text-xs',
      descriptionClass: 'text-gray-700 text-xs',
      dateClass: 'text-gray-500 text-xs',
      techClass: 'text-gray-500 text-xs'
    },

    summary: {
      bgColor: 'transparent',
      textClass: 'text-gray-700 text-sm'
    }
  }
}

export const getThemeByTemplateId = (templateId: string): ThemeConfig => {
  if (themes[templateId]) {
    return themes[templateId]
  }
  const themeMap: Record<string, string> = {
    '1': 'frontendEngineer',
    '2': 'modern',
    '3': 'creative',
    '4': 'data',
    '5': 'amber',
    '6': 'purple',
    '7': 'developer'
  }
  return themes[themeMap[templateId] || 'frontendEngineer']
}

function stripTailwindTextColor(className?: string): string {
  if (!className) return ''
  return className.replace(/\btext-(?:\[[^\]]+\]|\w+(?:-\w+)*-\d+)\b/g, '').replace(/\s+/g, ' ').trim()
}

/** 将主题辅色统一为品牌色（卡片标签色 / config 主题色） */
export function applyBrandColorToTheme(theme: ThemeConfig, brandColor: string): ThemeConfig {
  const tint = (alpha: string) => `${brandColor}${alpha}`
  return {
    ...theme,
    primaryColor: brandColor,
    subtitleColor: brandColor,
    dividerColor: tint('40'),
    avatar: {
      ...theme.avatar,
      titleClass: stripTailwindTextColor(theme.avatar.titleClass),
    },
    experience: {
      ...theme.experience,
      subtitleClass: stripTailwindTextColor(theme.experience.subtitleClass),
    },
    education: {
      ...theme.education,
      subtitleClass: stripTailwindTextColor(theme.education.subtitleClass),
    },
    projects: {
      ...theme.projects,
      roleClass: stripTailwindTextColor(theme.projects.roleClass),
      cardBgColor: tint('08'),
    },
    skills: {
      ...theme.skills,
      bgColor: tint('20'),
      textColor: brandColor,
      borderColor: 'transparent',
    },
  }
}

export const getLayoutComponent = (layoutType: string) => {
  const layoutMap: Record<string, string> = {
    classic: 'ResumeLayoutClassic',
    modern: 'ResumeLayoutModern',
    creative: 'ResumeLayoutCreative',
    data: 'ResumeLayoutData',
    developer: 'ResumeLayoutDeveloper',
    frontendEngineer: 'ResumeLayoutFrontendEngineer',
    productManager: 'ResumeLayoutProductManager',
    freshGraduate: 'ResumeLayoutFreshGraduate',
  }
  return layoutMap[layoutType] || 'ResumeLayoutClassic'
}
