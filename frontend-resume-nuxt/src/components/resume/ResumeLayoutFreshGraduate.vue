<template>
  <div
    class="fg-layout"
    :class="{ 'fg-layout--embedded': embedded }"
    :style="{ backgroundColor: theme.backgroundColor || '#fff', color: palette.text }"
  >
    <!-- Black header block -->
    <header
      v-if="showBasicInfo"
      data-edit-section="basicInfo"
      :class="zoneClass('basicInfo')"
      class="fg-header"
      :style="{ backgroundColor: palette.headerBg }"
    >
      <div
        v-if="data.showAvatar !== false"
        class="fg-header__avatar"
      >
        <img v-if="data.avatar" :src="data.avatar" :alt="data.name" class="fg-header__avatar-img" />
        <svg v-else class="fg-header__avatar-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div class="fg-header__identity">
        <h1 class="fg-header__name">{{ data.name }}</h1>
        <p class="fg-header__title">{{ data.title }}</p>
      </div>
      <ResumeContactIcons
        class="fg-header__contact"
        :phone="data.phone"
        :email="data.email"
        :location="data.location"
        :github="data.github"
        :homepage="data.homepage"
        :current-status="data.currentStatus"
        variant="header"
        icon-color="rgba(255,255,255,0.72)"
        text-color="rgba(255,255,255,0.92)"
      />
    </header>

    <main :class="embedded ? 'fg-body fg-body--embedded' : 'fg-body'">
      <template v-for="sec in bodySections" :key="sec">
        <section
          v-if="sec === 'summary' && showSection('summary') && data.summary"
          data-edit-section="summary"
          :class="[zoneClass('summary'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="个人简介" :bg-color="palette.headerBg" />
          <p class="fg-summary">{{ data.summary }}</p>
        </section>

        <section
          v-else-if="sec === 'skills' && showSection('skills') && hasSkills"
          data-edit-section="skills"
          :class="[zoneClass('skills'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="专业技能" :bg-color="palette.headerBg" />
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
          :class="[zoneClass('experience'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="工作经验" :bg-color="palette.headerBg" />
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
          :class="[zoneClass('projects'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="项目经历" :bg-color="palette.headerBg" />
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
          v-else-if="sec === 'education' && showSection('education') && data.education?.length"
          data-edit-section="education"
          :class="[zoneClass('education'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="教育背景" :bg-color="palette.headerBg" />
          <ResumeTimelineEntry
            v-for="(edu, i) in data.education"
            :key="i"
            :title="edu.school"
            :subtitle="[edu.degree, edu.major].filter(Boolean).join(' · ')"
            :duration="edu.duration"
            :bullets="eduBullets(edu)"
            :accent-color="palette.accent"
            :title-color="palette.heading"
            :body-color="palette.body"
            :muted-color="palette.muted"
          />
        </section>

        <section
          v-else-if="sec === 'certificates' && showSection('certificates') && data.certificates?.length"
          data-edit-section="certificates"
          :class="[zoneClass('certificates'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="证书荣誉" :bg-color="palette.headerBg" />
          <ul class="fg-cert-list">
            <li v-for="(cert, i) in data.certificates" :key="i" class="fg-cert-item">
              <span class="fg-cert-name" :style="{ color: palette.heading }">{{ cert.name }}</span>
              <span class="fg-cert-meta" :style="{ color: palette.muted }">
                {{ [cert.issuer, cert.date].filter(Boolean).join(' · ') }}
              </span>
            </li>
          </ul>
        </section>

        <section
          v-else-if="sec === 'campusActivity' && showSection('campusActivity') && data.campusActivity?.length"
          data-edit-section="campusActivity"
          :class="[zoneClass('campusActivity'), 'fg-section']"
        >
          <ResumeSectionBadgeTitle title="校园活动" :bg-color="palette.headerBg" />
          <ResumeTimelineEntry
            v-for="(act, i) in data.campusActivity"
            :key="i"
            :title="act.name"
            :subtitle="act.role"
            :duration="act.duration"
            :bullets="act.description ? [act.description] : []"
            :accent-color="palette.accent"
            :title-color="palette.heading"
            :body-color="palette.body"
            :muted-color="palette.muted"
          />
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResumeContactIcons from './shared/ResumeContactIcons.vue'
import ResumeSectionBadgeTitle from './shared/ResumeSectionBadgeTitle.vue'
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

const FG_BODY_SECTIONS = ['skills', 'experience', 'projects', 'education', 'certificates', 'campusActivity', 'summary']

const palette = computed(() => ({
  accent: props.theme.primaryColor || '#3B82F6',
  headerBg: props.theme.primaryColor || '#3B82F6',
  heading: '#111827',
  body: '#374151',
  text: '#1f2937',
  muted: '#6b7280',
}))

const bodySections = computed(() => {
  const order = props.sectionOrder.filter((s) => s !== 'basicInfo')
  const ordered = order.filter((s) => FG_BODY_SECTIONS.includes(s))
  const rest = FG_BODY_SECTIONS.filter((s) => !ordered.includes(s))
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
.fg-layout {
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.6;
  min-height: 100%;
}

.fg-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem 1.15rem;
  align-items: center;
  padding: 1rem 1.2rem 1.05rem;
  border-radius: 0 0 10px 10px;
  color: #fff;
}

.fg-header__avatar {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fg-header__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fg-header__avatar-placeholder {
  width: 50%;
  height: 50%;
  opacity: 0.75;
}

.fg-header__name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.fg-header__title {
  margin: 0.2rem 0 0;
  font-size: 11px;
  font-weight: 400;
  opacity: 0.82;
}

.fg-header__contact {
  min-width: 190px;
}

.fg-body {
  padding: 1rem 1.2rem 1.35rem;
}

.fg-body--embedded {
  padding: 0.85rem 0.9rem 1rem;
}

.fg-section {
  margin-bottom: 1.15rem;
}

.fg-section:last-child {
  margin-bottom: 0;
}

.fg-summary {
  margin: 0;
  font-size: 11px;
  line-height: 1.75;
  color: #374151;
  text-align: justify;
}

.fg-cert-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fg-cert-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  margin-bottom: 0.35rem;
  font-size: 11px;
}

.fg-cert-name {
  font-weight: 600;
}

.fg-cert-meta {
  font-size: 10px;
  white-space: nowrap;
}

.fg-layout--embedded .fg-header {
  grid-template-columns: auto 1fr;
  padding: 0.85rem 0.9rem;
}

.fg-layout--embedded .fg-header__contact {
  grid-column: 1 / -1;
  min-width: 0;
}
</style>
