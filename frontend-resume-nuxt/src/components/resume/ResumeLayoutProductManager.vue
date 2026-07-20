<template>
  <div
    class="pm-layout"
    :class="{ 'pm-layout--embedded': embedded }"
    :style="{ backgroundColor: theme.backgroundColor || '#fff', color: palette.text }"
  >
    <div class="pm-grid">
      <!-- Dark sidebar -->
      <aside
        v-if="showBasicInfo || showSection('education')"
        class="pm-sidebar"
        :style="{ backgroundColor: palette.sidebarBg }"
      >
        <div
          v-if="showBasicInfo"
          data-edit-section="basicInfo"
          :class="zoneClass('basicInfo')"
          class="pm-sidebar__profile"
        >
          <div
            v-if="data.showAvatar !== false"
            class="pm-sidebar__avatar"
            :style="{ borderColor: palette.accent, backgroundColor: `${palette.accent}22` }"
          >
            <img v-if="data.avatar" :src="data.avatar" :alt="data.name" class="pm-sidebar__avatar-img" />
            <svg v-else class="pm-sidebar__avatar-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 class="pm-sidebar__name">{{ data.name }}</h1>
          <p class="pm-sidebar__title" :style="{ color: palette.accent }">{{ data.title }}</p>
          <ResumeContactIcons
            :phone="data.phone"
            :email="data.email"
            :location="data.location"
            :github="data.github"
            :homepage="data.homepage"
            :work-experience="data.workExperience"
            :current-status="data.currentStatus"
            variant="sidebar"
            :icon-color="`${palette.accent}cc`"
            text-color="rgba(255,255,255,0.88)"
          />
        </div>

        <section
          v-if="showSection('education') && data.education?.length"
          data-edit-section="education"
          :class="zoneClass('education')"
          class="pm-sidebar__section"
        >
          <h2
            class="pm-sidebar__section-title"
            :style="{ color: palette.accent, borderBottomColor: `${palette.accent}88` }"
          >
            教育经历
          </h2>
          <div v-for="(edu, i) in data.education" :key="i" class="pm-sidebar__edu">
            <div class="pm-sidebar__edu-head">
              <span class="pm-sidebar__edu-school">{{ edu.school }}</span>
              <span class="pm-sidebar__edu-date">{{ edu.duration }}</span>
            </div>
            <p class="pm-sidebar__edu-major">{{ [edu.degree, edu.major].filter(Boolean).join(' · ') }}</p>
            <ul v-if="eduBullets(edu).length" class="pm-sidebar__edu-list">
              <li v-for="(line, j) in eduBullets(edu)" :key="j">{{ line }}</li>
            </ul>
          </div>
        </section>
      </aside>

      <!-- Main column -->
      <main class="pm-main">
        <template v-for="sec in mainSections" :key="sec">
          <section
            v-if="sec === 'summary' && showSection('summary') && data.summary"
            data-edit-section="summary"
            :class="[zoneClass('summary'), 'pm-main__section']"
          >
            <ResumeSectionLineTitle title="个人简介" :accent-color="palette.accent" />
            <p class="pm-main__summary">{{ data.summary }}</p>
          </section>

          <section
            v-else-if="sec === 'skills' && showSection('skills') && hasSkills"
            data-edit-section="skills"
            :class="[zoneClass('skills'), 'pm-main__section']"
          >
            <ResumeSectionLineTitle title="专业技能" :accent-color="palette.accent" />
            <ResumeSkillBulletList
              :groups="data.skillGroups"
              :flat-skills="data.skills"
              :accent-color="palette.accent"
              :body-color="palette.body"
            />
          </section>

          <section
            v-else-if="sec === 'experience' && showSection('experience') && data.experiences?.length"
            data-edit-section="experience"
            :class="[zoneClass('experience'), 'pm-main__section']"
          >
            <ResumeSectionLineTitle title="工作经验" :accent-color="palette.accent" />
            <ResumeTimelineEntry
              v-for="(exp, i) in data.experiences"
              :key="i"
              :title="exp.company"
              :subtitle="exp.position"
              :duration="exp.duration"
              :bullets="experienceBullets(exp)"
              :accent-color="palette.accent"
              :title-color="palette.heading"
              :body-color="palette.body"
              :muted-color="palette.muted"
            />
          </section>

          <section
            v-else-if="sec === 'projects' && showSection('projects') && data.projects?.length"
            data-edit-section="projects"
            :class="[zoneClass('projects'), 'pm-main__section']"
          >
            <ResumeSectionLineTitle title="项目经历" :accent-color="palette.accent" />
            <ResumeTimelineEntry
              v-for="(p, i) in data.projects"
              :key="i"
              :title="p.name"
              :subtitle="p.role"
              :duration="p.duration"
              :bullets="projectBullets(p)"
              :accent-color="palette.accent"
              :title-color="palette.heading"
              :body-color="palette.body"
              :muted-color="palette.muted"
            />
          </section>

          <section
            v-else-if="sec === 'productAchievements' && showSection('productAchievements') && data.productAchievements?.length"
            data-edit-section="productAchievements"
            :class="[zoneClass('productAchievements'), 'pm-main__section']"
          >
            <ResumeSectionLineTitle title="产品成果" :accent-color="palette.accent" />
            <ResumeTimelineEntry
              v-for="(item, i) in data.productAchievements"
              :key="i"
              :title="item.name"
              :subtitle="item.role"
              :duration="item.duration"
              :bullets="item.description ? [item.description] : []"
              :metrics="item.metrics"
              :accent-color="palette.accent"
              :title-color="palette.heading"
              :body-color="palette.body"
              :muted-color="palette.muted"
            />
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResumeContactIcons from './shared/ResumeContactIcons.vue'
import ResumeSectionLineTitle from './shared/ResumeSectionLineTitle.vue'
import ResumeTimelineEntry from './shared/ResumeTimelineEntry.vue'
import ResumeSkillBulletList from './shared/ResumeSkillBulletList.vue'
import { editZoneClass } from '~/utils/resumeEditSections'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  theme: { type: Object, default: () => ({}) },
  sectionOrder: { type: Array as () => string[], default: () => [] },
  hiddenSections: { type: Array as () => string[], default: () => [] },
  interactive: { type: Boolean, default: false },
  activeSectionId: { type: String, default: '' },
  embedded: { type: Boolean, default: false },
})

const PM_MAIN_SECTIONS = ['skills', 'experience', 'projects', 'productAchievements', 'summary']

/** 将品牌色加深为侧栏背景（保持橙色色相） */
function darkenBrandHex(hex: string, mix = 0.34): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#4d3508'
  const r = Math.round(parseInt(raw.slice(0, 2), 16) * mix)
  const g = Math.round(parseInt(raw.slice(2, 4), 16) * mix)
  const b = Math.round(parseInt(raw.slice(4, 6), 16) * mix)
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

const palette = computed(() => {
  const accent = props.theme.primaryColor || '#F59E0B'
  return {
    accent,
    sidebarBg: darkenBrandHex(accent),
    heading: '#111827',
    body: '#374151',
    text: '#1f2937',
    muted: '#6b7280',
  }
})

const mainSections = computed(() => {
  const order = props.sectionOrder.filter((s) => s !== 'basicInfo' && s !== 'education')
  const ordered = order.filter((s) => PM_MAIN_SECTIONS.includes(s))
  const rest = PM_MAIN_SECTIONS.filter((s) => !ordered.includes(s))
  return [...ordered, ...rest]
})

function zoneClass(sectionId: string) {
  return editZoneClass(Boolean(props.interactive), props.activeSectionId === sectionId)
}

function showSection(id: string) {
  return !props.hiddenSections.includes(id)
}

const showBasicInfo = computed(() => showSection('basicInfo'))

const hasSkills = computed(() =>
  (Array.isArray(props.data.skills) && props.data.skills.length > 0)
  || (Array.isArray(props.data.skillGroups) && props.data.skillGroups.some((g: { items?: string[] }) => g.items?.length)),
)

function experienceBullets(exp: { achievements?: string[]; description?: string }) {
  if (Array.isArray(exp.achievements) && exp.achievements.length) return exp.achievements
  if (exp.description) {
    const text = String(exp.description)
    return text.includes('\n') ? text.split('\n').map((s) => s.trim()).filter(Boolean) : [text]
  }
  return []
}

function projectBullets(p: { highlights?: string[]; description?: string }) {
  if (Array.isArray(p.highlights) && p.highlights.length) return p.highlights
  if (p.description) {
    const text = String(p.description)
    return text.includes('\n') ? text.split('\n').map((s) => s.trim()).filter(Boolean) : [text]
  }
  return []
}

function eduBullets(edu: { description?: string }) {
  if (!edu.description) return []
  const text = String(edu.description)
  return text.includes('\n') ? text.split('\n').map((s) => s.trim()).filter(Boolean) : [text]
}
</script>

<style scoped>
.pm-layout {
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.6;
  min-height: 100%;
}

.pm-grid {
  display: flex;
  min-height: 100%;
}

.pm-sidebar {
  width: 30%;
  min-width: 140px;
  max-width: 210px;
  flex-shrink: 0;
  padding: 1.25rem 0.9rem 1.35rem;
  color: rgba(255, 255, 255, 0.92);
}

.pm-sidebar__profile {
  margin-bottom: 1.35rem;
  text-align: center;
}

.pm-sidebar__avatar {
  width: 76px;
  height: 76px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid;
  margin: 0 auto 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-sidebar__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pm-sidebar__avatar-placeholder {
  width: 50%;
  height: 50%;
  opacity: 0.7;
}

.pm-sidebar__name {
  margin: 0 0 0.2rem;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}

.pm-sidebar__title {
  margin: 0 0 0.85rem;
  font-size: 10px;
  font-weight: 400;
  opacity: 0.88;
}

.pm-sidebar__profile :deep(.resume-contact) {
  text-align: left;
}

.pm-sidebar__section-title {
  margin: 0 0 0.6rem;
  font-size: 11px;
  font-weight: 700;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid;
  text-align: left;
}

.pm-sidebar__edu {
  margin-bottom: 0.85rem;
}

.pm-sidebar__edu-head {
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
  align-items: baseline;
}

.pm-sidebar__edu-school {
  font-size: 11px;
  font-weight: 600;
}

.pm-sidebar__edu-date {
  font-size: 9px;
  opacity: 0.75;
  white-space: nowrap;
}

.pm-sidebar__edu-major {
  margin: 0.2rem 0 0;
  font-size: 10px;
  opacity: 0.85;
}

.pm-sidebar__edu-list {
  margin: 0.35rem 0 0;
  padding-left: 0.9rem;
  font-size: 9px;
  opacity: 0.8;
  line-height: 1.55;
}

.pm-main {
  flex: 1;
  min-width: 0;
  padding: 1.25rem 1.15rem 1.35rem 1.25rem;
}

.pm-main__section {
  margin-bottom: 1.1rem;
}

.pm-main__section:last-child {
  margin-bottom: 0;
}

.pm-main__summary {
  margin: 0;
  font-size: 11px;
  line-height: 1.75;
  color: #374151;
  text-align: justify;
}

.pm-layout--embedded .pm-sidebar {
  padding: 0.85rem 0.75rem 1rem;
}

.pm-layout--embedded .pm-main {
  padding: 0.85rem 0.75rem 1rem;
}
</style>
