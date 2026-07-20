<template>
  <div
    class="min-h-full"
    :style="{
      backgroundColor: palette.bg,
      color: palette.text,
      fontFamily: theme.fontFamily || `'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`,
    }"
  >
    <!-- Header -->
    <header
      v-if="showBasicInfo"
      data-edit-section="basicInfo"
      :class="[zoneClass('basicInfo'), embedded ? 'px-4 pt-5 pb-4' : 'px-8 pt-8 pb-5']"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1
            class="font-semibold tracking-tight leading-tight"
            :class="embedded ? 'text-xl' : 'text-[1.65rem]'"
            :style="{ color: palette.heading }"
          >
            {{ data.name }}
          </h1>
          <p class="text-sm mt-1" :style="{ color: palette.accent }">{{ data.title }}</p>
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-3 text-[11px]" :style="{ color: palette.muted }">
            <template v-for="(item, idx) in contactItems" :key="item">
              <span v-if="idx > 0" :style="{ color: palette.border }">·</span>
              <span v-if="item.type === 'text'">{{ item.label }}</span>
              <a
                v-else
                :href="item.href"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:underline"
                :style="{ color: palette.accent }"
              >{{ item.label }}</a>
            </template>
          </div>
        </div>
        <div
          v-if="data.showAvatar !== false"
          class="size-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          :style="{ border: `2px solid ${palette.accent}40`, backgroundColor: `${palette.accent}18` }"
        >
          <img v-if="data.avatar" :src="data.avatar" :alt="data.name" class="w-full h-full object-cover" />
          <svg
            v-else
            class="w-1/2 h-1/2"
            viewBox="0 0 24 24"
            fill="none"
            :stroke="palette.accent"
            stroke-width="2"
          >
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
      <div class="mt-4 h-px" :style="{ background: `linear-gradient(90deg, ${palette.accent}55, ${palette.border}, transparent)` }" />
    </header>

    <div :class="embedded ? 'px-4 pb-5' : 'px-8 pb-8'">
      <!-- Summary full width -->
      <section
        v-if="showSection('summary') && data.summary"
        data-edit-section="summary"
        :class="[zoneClass('summary'), 'mb-6']"
      >
        <p
          class="text-[12px] leading-[1.75] rounded-lg px-4 py-3"
          :style="{ backgroundColor: palette.summaryBg, color: palette.body }"
        >
          {{ data.summary }}
        </p>
      </section>

      <div class="flex gap-6">
        <!-- Sidebar -->
        <aside class="w-[30%] min-w-[148px] max-w-[200px] shrink-0 space-y-5">
          <section
            v-if="showSection('skills') && hasSkills"
            data-edit-section="skills"
            :class="zoneClass('skills')"
          >
            <DeveloperSectionTitle title="技能" :accent-color="palette.accent" />
            <DeveloperSkillGroups
              :groups="data.skillGroups"
              :flat-skills="data.skills"
              :tag-bg="palette.tagBg"
              :tag-color="palette.tagText"
              :tag-border="palette.tagBorder"
              :muted-color="palette.muted"
            />
          </section>

          <section
            v-if="showSection('education') && data.education?.length"
            data-edit-section="education"
            :class="zoneClass('education')"
          >
            <DeveloperSectionTitle title="教育" :accent-color="palette.accent" />
            <div class="space-y-3">
              <div v-for="(edu, i) in data.education" :key="i">
                <p class="text-xs font-medium" :style="{ color: palette.heading }">{{ edu.school }}</p>
                <p class="text-[11px] mt-0.5" :style="{ color: palette.accent }">
                  {{ [edu.degree, edu.major].filter(Boolean).join(' · ') }}
                </p>
                <p v-if="edu.duration" class="text-[10px] mt-0.5 tabular-nums" :style="{ color: palette.muted }">
                  {{ edu.duration }}
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="showSection('openSource') && data.openSource?.length"
            data-edit-section="openSource"
            :class="zoneClass('openSource')"
          >
            <DeveloperSectionTitle title="开源" :accent-color="palette.accent" />
            <div class="space-y-2">
              <DeveloperOpenSourceItem
                v-for="(item, i) in data.openSource"
                :key="i"
                v-bind="item"
                :card-bg="palette.cardBg"
                :border-color="palette.border"
                :title-color="palette.heading"
                :body-color="palette.body"
                :accent-color="palette.accent"
              />
            </div>
          </section>
        </aside>

        <!-- Main column -->
        <main class="flex-1 min-w-0 space-y-6">
          <section
            v-if="showSection('experience') && data.experiences?.length"
            data-edit-section="experience"
            :class="zoneClass('experience')"
          >
            <DeveloperSectionTitle title="工作经历" :accent-color="palette.accent" />
            <div class="space-y-4">
              <ExperienceItem
                v-for="(exp, i) in data.experiences"
                :key="i"
                :company="exp.company"
                :position="exp.position"
                :duration="exp.duration"
                :description="exp.description"
                :achievements="exp.achievements"
                :theme="experienceTheme"
                :primary-color="palette.accent"
              />
            </div>
          </section>

          <section
            v-if="showSection('projects') && data.projects?.length"
            data-edit-section="projects"
            :class="zoneClass('projects')"
          >
            <DeveloperSectionTitle title="项目经验" :accent-color="palette.accent" />
            <div class="space-y-2.5">
              <DeveloperProjectCard
                v-for="(p, i) in data.projects"
                :key="i"
                :name="p.name"
                :role="p.role"
                :duration="p.duration"
                :description="p.description"
                :highlights="p.highlights"
                :tech-stack="p.techStack"
                :card-bg="palette.cardBg"
                :border-color="palette.border"
                :title-color="palette.heading"
                :body-color="palette.body"
                :muted-color="palette.muted"
                :accent-color="palette.accent"
                :chip-bg="palette.tagBg"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DeveloperSectionTitle from './developer/DeveloperSectionTitle.vue'
import DeveloperSkillGroups from './developer/DeveloperSkillGroups.vue'
import DeveloperProjectCard from './developer/DeveloperProjectCard.vue'
import DeveloperOpenSourceItem from './developer/DeveloperOpenSourceItem.vue'
import ExperienceItem from './ExperienceItem.vue'
import { getLayoutPreset, splitComponentsByLayout } from './schema/layoutPresets'
import { resolveComponentOrder } from './schema/templates'
import { editZoneClass } from '~/utils/resumeEditSections'

const props = defineProps<{
  data: Record<string, any>
  theme: Record<string, any>
  sectionOrder?: string[]
  hiddenSections?: string[]
  interactive?: boolean
  activeSectionId?: string
  embedded?: boolean
}>()

function zoneClass(sectionId: string) {
  return editZoneClass(Boolean(props.interactive), props.activeSectionId === sectionId)
}

const preset = computed(() => getLayoutPreset(props.theme.layoutPreset || 'developer'))

const orderedComponents = computed(() =>
  resolveComponentOrder(props.theme.components || [], props.sectionOrder)
)

const visibleSections = computed(() => {
  const split = splitComponentsByLayout(orderedComponents.value, preset.value)
  return new Set([...split.sidebar, ...split.main])
})

const showBasicInfo = computed(() => !props.hiddenSections?.includes('basicInfo'))

const hasSkills = computed(() =>
  (props.data.skillGroups?.length && props.data.skillGroups.some((g: { items?: string[] }) => g.items?.length))
  || (Array.isArray(props.data.skills) && props.data.skills.length > 0)
)

function showSection(id: string) {
  if (props.hiddenSections?.includes(id)) return false
  return visibleSections.value.has(id)
}

function linkHref(url: string) {
  return url.startsWith('http') ? url : `https://${url}`
}

const contactItems = computed(() => {
  const items: Array<{ type: 'text' | 'link'; label: string; href?: string }> = []
  if (props.data.email) items.push({ type: 'text', label: props.data.email })
  if (props.data.phone) items.push({ type: 'text', label: props.data.phone })
  if (props.data.location) items.push({ type: 'text', label: props.data.location })
  if (props.data.github) items.push({ type: 'link', label: 'GitHub', href: linkHref(props.data.github) })
  if (props.data.homepage) items.push({ type: 'link', label: 'Website', href: linkHref(props.data.homepage) })
  return items
})

const palette = computed(() => {
  const accent = props.theme.primaryColor || '#4A9B8E'
  return {
    bg: props.theme.backgroundColor || '#FBFDFC',
    heading: props.theme.textColor || '#1E293B',
    text: props.theme.textColor || '#334155',
    body: props.theme.subtitleColor || '#475569',
    muted: '#94A3B8',
    accent,
    border: props.theme.dividerColor || '#E2EBE8',
    summaryBg: accent + '0D',
    cardBg: '#FFFFFF',
    tagBg: accent + '14',
    tagText: accent,
    tagBorder: accent + '28',
  }
})

const experienceTheme = computed(() => ({
  ...(props.theme.experience || {}),
  titleClass: 'text-sm font-semibold text-slate-800',
  subtitleClass: 'text-xs',
  subtitleStyle: { color: palette.value.accent },
  dateClass: 'text-[10px] text-slate-400',
  descriptionClass: 'text-[11px] text-slate-600',
  achievementClass: 'text-[11px] text-slate-600',
}))
</script>
