<template>
  <div
    v-if="visible"
    :data-edit-section="componentId"
    :class="zoneClass"
  >
    <component
      :is="wrapperComponent"
      v-bind="wrapperProps"
    >
    <ResumeAvatar
      v-if="componentId === 'basicInfo'"
      :name="data.name"
      :title="data.title"
      :location="data.location"
      :phone="data.phone"
      :email="data.email"
      :github="data.github"
      :homepage="data.homepage"
      :src="data.avatar"
      :show-avatar="data.showAvatar !== false"
      :theme="theme.avatar"
      :primary-color="theme.primaryColor"
    />
    <SummarySection
      v-else-if="componentId === 'summary'"
      :summary="data.summary"
      :theme="theme.summary"
    />
    <template v-else-if="componentId === 'experience'">
      <ExperienceItem
        v-for="(exp, i) in data.experiences"
        :key="i"
        :company="exp.company"
        :position="exp.position"
        :duration="exp.duration"
        :description="exp.description"
        :achievements="exp.achievements"
        :theme="theme.experience"
        :primaryColor="theme.primaryColor"
      />
    </template>
    <template v-else-if="componentId === 'education'">
      <EducationItem
        v-for="(edu, i) in data.education"
        :key="i"
        :school="edu.school"
        :degree="edu.degree"
        :major="edu.major"
        :gpa="edu.gpa"
        :duration="edu.duration"
        :theme="theme.education"
      />
    </template>
    <SkillsTags
      v-else-if="componentId === 'skills'"
      :skills="data.skills"
      :theme="theme.skills"
    />
    <div v-else-if="componentId === 'projects'" class="space-y-3">
      <ProjectCard
        v-for="(p, i) in data.projects"
        :key="i"
        :name="p.name"
        :role="p.role"
        :description="p.description"
        :duration="p.duration"
        :techStack="p.techStack"
        :theme="theme.projects"
      />
    </div>
    <CertificateList
      v-else-if="componentId === 'certificates'"
      :certificates="data.certificates"
      :theme="theme.certificates"
    />
    <CampusActivityList
      v-else-if="componentId === 'campusActivity'"
      :activities="data.campusActivity"
      :theme="theme.campusActivity"
    />
    <PortfolioList
      v-else-if="componentId === 'portfolio'"
      :items="data.portfolio"
      :theme="theme.portfolio"
    />
    <DataProjectList
      v-else-if="componentId === 'dataProjects'"
      :projects="data.dataProjects"
      :theme="theme.dataProjects"
    />
    <ProductAchievementList
      v-else-if="componentId === 'productAchievements'"
      :achievements="data.productAchievements"
      :theme="theme.productAchievements"
    />
    <PublicationList
      v-else-if="componentId === 'publications'"
      :publications="data.publications"
      :theme="theme.publications"
    />
    <OpenSourceList
      v-else-if="componentId === 'openSource'"
      :contributions="data.openSource"
      :theme="theme.openSource"
    />
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { getComponentSchema } from './schema/components'
import ResumeAvatar from './ResumeAvatar.vue'
import ResumeSection from './ResumeSection.vue'
import SummarySection from './SummarySection.vue'
import ExperienceItem from './ExperienceItem.vue'
import EducationItem from './EducationItem.vue'
import SkillsTags from './SkillsTags.vue'
import ProjectCard from './ProjectCard.vue'
import CertificateList from './CertificateList.vue'
import CampusActivityList from './CampusActivityList.vue'
import PortfolioList from './PortfolioList.vue'
import DataProjectList from './DataProjectList.vue'
import ProductAchievementList from './ProductAchievementList.vue'
import PublicationList from './PublicationList.vue'
import OpenSourceList from './OpenSourceList.vue'
import type { LayoutPreset } from './schema/layoutPresets'
import { editZoneClass } from '~/utils/resumeEditSections'

const props = defineProps<{
  componentId: string
  data: Record<string, any>
  theme: Record<string, any>
  sectionStyle?: LayoutPreset['sectionStyle']
  centered?: boolean
  interactive?: boolean
  activeSectionId?: string
}>()

const schema = computed(() => getComponentSchema(props.componentId))

const hasContent = computed(() => {
  const id = props.componentId
  const d = props.data
  if (id === 'basicInfo') return Boolean(d.name || d.title)
  if (id === 'summary') return Boolean(d.summary)
  if (id === 'skills') return Array.isArray(d.skills) && d.skills.length > 0
  if (id === 'experience') return Array.isArray(d.experiences) && d.experiences.length > 0
  if (id === 'education') return Array.isArray(d.education) && d.education.length > 0
  if (id === 'projects') return Array.isArray(d.projects) && d.projects.length > 0
  const arrayFields: Record<string, string> = {
    certificates: 'certificates',
    campusActivity: 'campusActivity',
    portfolio: 'portfolio',
    dataProjects: 'dataProjects',
    productAchievements: 'productAchievements',
    publications: 'publications',
    openSource: 'openSource'
  }
  const field = arrayFields[id]
  return field ? Array.isArray(d[field]) && d[field].length > 0 : false
})

const visible = computed(() => {
  if (props.componentId === 'basicInfo') {
    return Boolean(props.data.name || props.data.title)
  }
  return hasContent.value
})

const zoneClass = computed(() =>
  editZoneClass(Boolean(props.interactive), props.activeSectionId === props.componentId)
)

const sectionIconMap: Record<string, string> = {
  summary: 'summary',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certificates: 'summary',
  campusActivity: 'experience',
  portfolio: 'projects',
  dataProjects: 'projects',
  productAchievements: 'experience',
  publications: 'summary',
  openSource: 'skills'
}

const PassThrough: Component = {
  setup(_, { slots }) {
    return () => slots.default?.()
  }
}

const CenteredBlock: Component = {
  setup(_, { slots }) {
    return () => h('div', { class: 'mb-6' }, [
      slots.default?.()
    ])
  }
}

const MonoBlock: Component = {
  setup(_, { slots }) {
    return () =>
      h('div', { class: 'border border-gray-700 rounded-lg p-4 mb-4' }, slots.default?.())
  }
}

const wrapperComponent = computed(() => {
  if (props.componentId === 'basicInfo') return PassThrough
  if (props.sectionStyle === 'mono') return MonoBlock
  if (props.sectionStyle === 'centered') return CenteredBlock
  if (props.sectionStyle === 'accent-bar') return PassThrough
  return ResumeSection
})

const wrapperProps = computed(() => {
  if (props.componentId === 'basicInfo') return {}
  const title = schema.value?.name || props.componentId
  const icon = sectionIconMap[props.componentId] || 'summary'
  if (props.sectionStyle === 'mono') {
    return {}
  }
  if (props.sectionStyle === 'centered') {
    return {}
  }
  if (props.sectionStyle === 'accent-bar') {
    return {}
  }
  return {
    title,
    icon,
    theme: props.theme.section,
    primaryColor: props.theme.primaryColor
  }
})
</script>
