import type { LucideIcon } from 'lucide-vue-next'
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  FolderKanban,
  Github,
  GraduationCap,
  Image,
  LineChart,
  MessageSquare,
  MoreHorizontal,
  Palette,
  Sparkles,
  TrendingUp,
  User,
  UserRound,
  Users,
} from 'lucide-vue-next'

/** 简历编辑器区块图标 */
export const RESUME_SECTION_ICONS: Record<string, LucideIcon> = {
  basicInfo: UserRound,
  workExperience: Briefcase,
  education: GraduationCap,
  projectExperience: FolderKanban,
  skills: Award,
  summary: MessageSquare,
  certificates: Award,
  campusActivity: Users,
  portfolio: Image,
  dataProjects: BarChart3,
  productAchievements: TrendingUp,
  publications: FileText,
  openSource: Github,
  other: MoreHorizontal,
}

export function getResumeSectionIcon(key: string): LucideIcon {
  return RESUME_SECTION_ICONS[key] ?? MoreHorizontal
}

/** 模板中心图标 */
export const TEMPLATE_THEME_ICONS: Record<string, LucideIcon> = {
  frontendEngineer: User,
  modern: Briefcase,
  creative: Palette,
  data: BarChart3,
  amber: Sparkles,
  purple: BookOpen,
  developer: Code2,
}

export function getTemplateThemeIcon(themeKey: string): LucideIcon {
  return TEMPLATE_THEME_ICONS[themeKey] ?? FileText
}
