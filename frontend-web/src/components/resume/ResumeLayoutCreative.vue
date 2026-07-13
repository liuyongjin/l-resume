<template>
  <div :style="{ backgroundColor: theme.backgroundColor }">
    <div :class="['p-8 text-center pb-6']" :style="{ backgroundColor: theme.primaryColor + '10', borderBottom: `3px solid ${theme.primaryColor}30` }">
      <div class="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" :style="{ border: `3px solid ${theme.primaryColor}`, backgroundColor: theme.primaryColor + '20' }">
        <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" :stroke="theme.primaryColor" stroke-width="2">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold" :style="{ color: theme.textColor }">{{ data.name }}</h1>
      <p class="text-sm mt-1" :style="{ color: theme.primaryColor }">{{ data.title }}</p>
      <div class="flex items-center justify-center gap-4 mt-3 text-xs" :style="{ color: theme.subtitleColor }">
        <span v-if="data.location">{{ data.location }}</span>
        <span v-if="data.phone">{{ data.phone }}</span>
        <span v-if="data.email">{{ data.email }}</span>
      </div>
    </div>

    <div class="p-8">
      <div class="max-w-lg mx-auto space-y-8">
        <SummarySection :summary="data.summary" :theme="theme.summary" />

        <div>
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">工作经历</h3>
          <ExperienceItem v-for="(exp,i) in data.experiences" :key="i"
            :company="exp.company" :position="exp.position" :duration="exp.duration"
            :description="exp.description" :achievements="exp.achievements"
            :theme="theme.experience" :primaryColor="theme.primaryColor"
          />
        </div>

        <div>
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">技能特长</h3>
          <div class="flex justify-center">
            <SkillsTags :skills="data.skills" :theme="theme.skills" />
          </div>
        </div>

        <div>
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">项目经验</h3>
          <div class="space-y-3">
            <ProjectCard v-for="(p,i) in data.projects" :key="i"
              :name="p.name" :role="p.role" :description="p.description"
              :duration="p.duration" :techStack="p.techStack" :theme="theme.projects"
            />
          </div>
        </div>

        <div v-if="data.certificates && data.certificates.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">证书/资格</h3>
          <CertificateList :certificates="data.certificates" :theme="theme.certificates" />
        </div>
        <div v-if="data.campusActivity && data.campusActivity.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">校园活动</h3>
          <CampusActivityList :activities="data.campusActivity" :theme="theme.campusActivity" />
        </div>
        <div v-if="data.portfolio && data.portfolio.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">作品集</h3>
          <PortfolioList :items="data.portfolio" :theme="theme.portfolio" />
        </div>
        <div v-if="data.dataProjects && data.dataProjects.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">数据项目</h3>
          <DataProjectList :projects="data.dataProjects" :theme="theme.dataProjects" />
        </div>
        <div v-if="data.productAchievements && data.productAchievements.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">产品成果</h3>
          <ProductAchievementList :achievements="data.productAchievements" :theme="theme.productAchievements" />
        </div>
        <div v-if="data.publications && data.publications.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">论文发表</h3>
          <PublicationList :publications="data.publications" :theme="theme.publications" />
        </div>
        <div v-if="data.openSource && data.openSource.length">
          <h3 class="font-bold mb-4 text-center" :class="theme.section.titleClass">开源贡献</h3>
          <OpenSourceList :contributions="data.openSource" :theme="theme.openSource" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ExperienceItem from './ExperienceItem.vue'
import SkillsTags from './SkillsTags.vue'
import ProjectCard from './ProjectCard.vue'
import SummarySection from './SummarySection.vue'
import CertificateList from './CertificateList.vue'
import CampusActivityList from './CampusActivityList.vue'
import PortfolioList from './PortfolioList.vue'
import DataProjectList from './DataProjectList.vue'
import ProductAchievementList from './ProductAchievementList.vue'
import PublicationList from './PublicationList.vue'
import OpenSourceList from './OpenSourceList.vue'

defineProps({ data: { type: Object, default: () => ({}) }, theme: { type: Object, default: () => ({}) }, sectionOrder: { type: Array, default: () => [] } })
</script>
