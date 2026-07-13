<template>
  <div class="overflow-hidden">
    <!-- Hero -->
    <section class="relative min-h-0 lg:min-h-[88vh] flex items-center overflow-hidden hero-section py-14 sm:py-16 md:py-20 lg:py-24">
      <div class="absolute inset-0 overflow-hidden pointer-events-none hero-section__bg" />
      <div class="absolute inset-0 overflow-hidden pointer-events-none hero-section__grid" aria-hidden="true" />
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="hero-section__orb hero-section__orb--1" />
        <div class="hero-section__orb hero-section__orb--2" />
        <div class="hero-section__orb hero-section__orb--3" />
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div
            class="hero-copy text-center lg:text-left order-2 lg:order-1"
            :class="{ 'hero-copy--zh': isZh }"
          >
            <Badge
              variant="secondary"
              class="hero-copy__badge animate-fade-in-down"
            >
              <Sparkles class="hero-copy__badge-icon shrink-0" />
              <span class="hero-tag-line">
                <template v-for="(item, i) in heroTags" :key="item">
                  <span v-if="i > 0" class="hero-tag-sep" aria-hidden="true">·</span>
                  <span class="hero-tag-word">{{ item }}</span>
                </template>
              </span>
            </Badge>

            <h1 class="hero-copy__title animate-fade-in-up" style="animation-delay: 0.08s">
              {{ langStore.locale === 'zh' ? '智能简历工作台' : 'Smart Resume Workspace' }}
            </h1>

            <p class="hero-copy__tagline animate-fade-in-up" style="animation-delay: 0.14s">
              {{ isZh ? '轻松打造你的' : 'Build Your ' }}
              <span class="text-primary">{{ isZh ? '职业名片' : 'Professional Profile' }}</span>
            </p>

            <p
              class="hero-copy__desc animate-fade-in-up"
              style="animation-delay: 0.22s"
            >
              {{ isZh
                ? '多种精美模板，一键编辑，实时预览。上传简历后由智能体协作优化，多模板多语言输出，让求职更简单。'
                : 'Beautiful templates, one-click editing, live preview. AI agents optimize your resume with multi-template output.' }}
            </p>

            <div
              class="hero-copy__cta-wrap flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center sm:items-stretch animate-fade-in-up"
              style="animation-delay: 0.3s"
            >
              <Button
                size="lg"
                class="hero-copy__cta rounded-full px-8 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
                @click="navigateTo('/workflow/execution')"
              >
                {{ langStore.locale === 'zh' ? '立即创建简历' : 'Create Resume' }}
                <ArrowRight class="size-4" />
              </Button>
            </div>
            <p class="hero-copy__footnote animate-fade-in-up" style="animation-delay: 0.36s">
              <span class="hero-tag-line hero-tag-line--muted">
                <template v-for="(item, i) in heroFootnotes" :key="item">
                  <span v-if="i > 0" class="hero-tag-sep" aria-hidden="true">·</span>
                  <span class="hero-tag-word">{{ item }}</span>
                </template>
              </span>
            </p>
          </div>

          <div class="order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-in-up hero-visual-wrap" style="animation-delay: 0.18s">
            <div class="hero-visual-wrap__glow" aria-hidden="true" />
            <HeroResume3D :is-zh="isZh" />
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-14 sm:py-20 bg-background">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 page-section">
        <div class="text-center mb-10 sm:mb-14 reveal is-visible home-section-head">
          <Badge variant="secondary" class="home-section-badge">
            {{ langStore.locale === 'zh' ? '核心功能' : 'Features' }}
          </Badge>
          <h2 class="home-section-title">
            {{ langStore.t.home.featuresTitle }}
          </h2>
          <p class="home-section-desc">
            {{ langStore.t.home.featuresSubtitle }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 page-grid">
          <Card
            v-for="(feature, index) in featureItems"
            :key="feature.title"
            :class="[
              'group relative overflow-hidden surface-card reveal is-visible',
              `stagger-${index + 1}`
            ]"
            @mouseenter="activeFeature = index"
            @mouseleave="activeFeature = -1"
          >
            <CardContent class="home-card-body">
              <div
                :class="[
                  'absolute -top-6 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none',
                  feature.bgColor
                ]"
              />

              <div
                :class="[
                  'relative size-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110',
                  isDark ? feature.darkBg : feature.lightBg
                ]"
              >
                <component :is="feature.icon" class="size-6" :class="feature.iconColor" />
              </div>

              <h3 class="relative text-base sm:text-lg font-semibold text-foreground mb-2 leading-snug">{{ feature.title }}</h3>
              <p class="relative text-sm text-muted-foreground leading-relaxed">{{ feature.desc }}</p>

              <div
                :class="[
                  'absolute bottom-0 left-0 h-0.5 transition-all duration-500',
                  feature.barColor,
                  activeFeature === index ? 'w-full' : 'w-0'
                ]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- Multi-agent collaboration -->
    <section :class="['py-12 sm:py-20', isDark ? 'bg-muted/30' : 'bg-surface']">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div class="relative reveal-scale is-visible">
            <div class="absolute -inset-4 bg-primary/10 rounded-3xl blur-xl" />
            <div class="relative grid grid-cols-2 gap-3 sm:gap-4">
              <Card
                v-for="(agent, idx) in agentCards"
                :key="agent.title"
                :class="[
                  'surface-card reveal is-visible h-full',
                  `stagger-${idx + 1}`,
                ]"
              >
                <CardContent class="home-card-body">
                  <component :is="agent.icon" class="size-9 mb-3" :class="agent.iconColor" />
                  <div class="text-sm font-medium text-foreground mb-1">{{ agent.title }}</div>
                  <div class="text-xs text-muted-foreground leading-relaxed">{{ agent.desc }}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div class="reveal is-visible home-section-head home-section-head--left" style="transition-delay: 0.15s">
            <Badge variant="secondary" class="home-section-badge home-section-badge--emerald">
              {{ langStore.locale === 'zh' ? '多智能体协作' : 'Multi-Agent' }}
            </Badge>
            <h2 class="home-section-title">
              {{ langStore.locale === 'zh' ? '智能协作系统' : 'Smart Collaboration' }}
            </h2>
            <p class="home-section-desc home-section-desc--left mb-8">
              {{ isZh ? '默认工作流：输入 → 简历编辑智能体 → 简历优化智能体 → 输出，支持自定义编排' : 'Default: Input → Edit Agent → Optimize Agent → Output, fully customizable' }}
            </p>

            <div class="space-y-3">
              <Card
                v-for="(step, idx) in workflowSteps"
                :key="step.title"
                :class="['surface-card reveal is-visible', `stagger-${idx + 1}`]"
              >
                <CardContent class="home-card-body flex items-center gap-3 sm:gap-4">
                  <div :class="['size-10 rounded-xl flex items-center justify-center shrink-0', step.badgeBg]">
                    <span :class="['font-bold text-sm', step.badgeText]">{{ step.num }}</span>
                  </div>
                  <div>
                    <div class="font-medium text-foreground">{{ step.title }}</div>
                    <div class="text-sm text-muted-foreground">{{ step.desc }}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 sm:py-20 bg-background">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="reveal is-visible rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-fuchsia-500/5 p-8 sm:p-12 shadow-sm">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {{ langStore.locale === 'zh' ? '准备好开始了吗？' : 'Ready to Get Started?' }}
          </h2>
          <p class="text-sm sm:text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            {{ langStore.locale === 'zh' ? `立即体验${langStore.t.brand}工作流` : `Start building with ${langStore.t.brand}` }}
          </p>
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              class="bg-gradient-to-r from-sky-600 via-sky-500 to-fuchsia-600 text-white hover:from-sky-700 hover:via-sky-600 hover:to-fuchsia-700 hover:-translate-y-0.5 transition-all duration-300 shadow-xl shadow-sky-500/25 border-0 font-semibold"
              @click="navigateTo('/workflow/execution')"
            >
              <ArrowRight class="size-4" />
              {{ langStore.locale === 'zh' ? '免费开始' : 'Start Free' }}
            </Button>
            <Button
              variant="outline"
              size="lg"
              class="min-h-[44px] bg-muted hover:bg-muted/80 border-border/80 text-foreground hover:-translate-y-0.5 transition-all duration-300 shadow-sm font-medium"
              @click="navigateTo('/templates')"
            >
              <Eye class="size-4" />
              {{ langStore.locale === 'zh' ? '浏览模板' : 'Browse Templates' }}
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { navigateTo } from 'nuxt/app'
import type { Component } from 'vue'
import {
  ArrowRight,
  Bot,
  Code,
  Eye,
  FileText,
  GitBranch,
  LayoutGrid,
  Lightbulb,
  Pencil,
  Sparkles,
  Workflow,
  Zap
} from 'lucide-vue-next'
import { useThemeStore } from '~/stores/theme'
import { useLanguageStore } from '~/stores/language'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/card'
import HeroResume3D from '@/components/home/HeroResume3D.vue'

const themeStore = useThemeStore()
const langStore = useLanguageStore()
const activeFeature = ref(-1)
const isDark = computed(() => themeStore.theme.mode === 'dark')
const isZh = computed(() => langStore.locale === 'zh')

const heroTags = computed(() =>
  isZh.value ? ['专业', '高效', '智能'] : ['Pro', 'Efficient', 'Smart'],
)

const heroFootnotes = computed(() =>
  isZh.value
    ? ['免费使用', '智能协作', '多模板输出']
    : ['Free to use', 'AI workflow', 'Multi-template'],
)

useScrollReveal('.reveal')
useScrollReveal('.reveal-scale')

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

const featureItems = computed(() => [
  {
    icon: Workflow,
    title: isZh.value ? '智能执行' : 'Smart Execution',
    desc: isZh.value ? '上传简历文件，选择模板与语言，一键运行默认工作流生成' : 'Upload resume, pick templates & languages, run workflow in one click',
    lightBg: 'bg-primary/10',
    darkBg: 'bg-primary/15',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    barColor: 'bg-primary'
  },
  {
    icon: GitBranch,
    title: isZh.value ? '可视化工作流' : 'Visual Workflow',
    desc: isZh.value ? '拖拽编排简历编辑、优化智能体与工具节点' : 'Drag-and-drop resume edit, optimize agents & tool nodes',
    lightBg: 'bg-emerald-500/10',
    darkBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    barColor: 'bg-emerald-500'
  },
  {
    icon: FileText,
    title: isZh.value ? '多模板中心' : 'Template Gallery',
    desc: isZh.value ? '7 套岗位模板，预览后一键创建简历' : '7 role-based templates with preview & one-click create',
    lightBg: 'bg-amber-500/10',
    darkBg: 'bg-amber-500/15',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    barColor: 'bg-amber-500'
  },
  {
    icon: Code,
    title: isZh.value ? '实时预览编辑' : 'Live Preview Edit',
    desc: isZh.value ? '所见即所得编辑，支持样式定制与区块排序' : 'WYSIWYG editing with style & section customization',
    lightBg: 'bg-fuchsia-500/10',
    darkBg: 'bg-fuchsia-500/15',
    iconColor: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-500/10',
    barColor: 'bg-fuchsia-500'
  },
  {
    icon: Sparkles,
    title: isZh.value ? 'AI 辅助优化' : 'AI Assist',
    desc: isZh.value ? '措辞优化、岗位匹配、技能分析、简历检查等' : 'Wording polish, job match, skill analysis & resume check',
    lightBg: 'bg-pink-500/10',
    darkBg: 'bg-pink-500/15',
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    barColor: 'bg-pink-500'
  },
  {
    icon: LayoutGrid,
    title: isZh.value ? '简历管理' : 'Resume Manager',
    desc: isZh.value ? '集中管理、编辑、预览工作流生成的简历' : 'Manage, edit & preview workflow-generated resumes',
    lightBg: 'bg-sky-500/10',
    darkBg: 'bg-sky-500/15',
    iconColor: 'text-sky-600',
    bgColor: 'bg-sky-500/10',
    barColor: 'bg-sky-500'
  }
])

const agentCards = computed(() => [
  {
    icon: Pencil,
    iconColor: 'text-primary',
    title: isZh.value ? '简历编辑' : 'Resume Edit',
    desc: isZh.value ? '结构与模板适配润色' : 'Structure & template adaptation'
  },
  {
    icon: Zap,
    iconColor: 'text-fuchsia-600',
    title: isZh.value ? '简历优化' : 'Resume Optimize',
    desc: isZh.value ? '量化成果与关键词匹配' : 'Quantify achievements & keywords'
  },
  {
    icon: Bot,
    iconColor: 'text-pink-600',
    title: isZh.value ? '自定义智能体' : 'Custom Agent',
    desc: isZh.value ? '按提示词灵活处理' : 'Flexible custom prompts'
  },
  {
    icon: Lightbulb,
    iconColor: 'text-emerald-600',
    title: isZh.value ? '工具节点' : 'Tool Nodes',
    desc: isZh.value ? '大模型、知识库、HTTP 等' : 'LLM, KB, HTTP & more'
  }
])

const workflowSteps = computed(() => [
  {
    num: '1',
    title: isZh.value ? '上传简历' : 'Upload',
    desc: isZh.value ? '导入 PDF/DOC 等文件作为输入' : 'Import PDF/DOC files as input',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary'
  },
  {
    num: '2',
    title: isZh.value ? '智能体处理' : 'Agent Pipeline',
    desc: isZh.value ? '编辑 → 优化，按工作流依次执行' : 'Edit → optimize, run in workflow order',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600'
  },
  {
    num: '3',
    title: isZh.value ? '多模板输出' : 'Multi Output',
    desc: isZh.value ? '选择模板与语言，生成并保存简历' : 'Pick templates & languages, save resumes',
    badgeBg: 'bg-fuchsia-500/10',
    badgeText: 'text-fuchsia-600'
  }
])
</script>
