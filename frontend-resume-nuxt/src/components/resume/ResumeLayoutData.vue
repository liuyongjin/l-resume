<template>
  <div :style="{ backgroundColor: theme.backgroundColor }">
    <div class="p-8">
      <ResumeAvatar 
        :name="data.name" :title="data.title"
        :location="data.location" :phone="data.phone" :email="data.email"
        :src="data.avatar"
        :show-avatar="data.showAvatar !== false"
        :theme="theme.avatar" :primaryColor="theme.primaryColor"
      />

      <div class="grid grid-cols-3 gap-3 my-6">
        <div class="p-3 rounded-lg text-center" :style="{ backgroundColor: theme.primaryColor + '15' }">
          <div class="text-2xl font-bold" :style="{ color: theme.primaryColor }">{{ data.experiences.length }}</div>
          <div class="text-xs mt-1" :style="{ color: theme.subtitleColor }">工作经历</div>
        </div>
        <div class="p-3 rounded-lg text-center" :style="{ backgroundColor: theme.primaryColor + '15' }">
          <div class="text-2xl font-bold" :style="{ color: theme.primaryColor }">{{ data.projects.length }}</div>
          <div class="text-xs mt-1" :style="{ color: theme.subtitleColor }">项目经验</div>
        </div>
        <div class="p-3 rounded-lg text-center" :style="{ backgroundColor: theme.primaryColor + '15' }">
          <div class="text-2xl font-bold" :style="{ color: theme.primaryColor }">{{ data.skills.length }}</div>
          <div class="text-xs mt-1" :style="{ color: theme.subtitleColor }">专业技能</div>
        </div>
      </div>

      <div class="space-y-6">
        <ResumeSection title="个人总结" icon="summary" :theme="theme.section" :primaryColor="theme.primaryColor">
          <SummarySection :summary="data.summary" :theme="theme.summary" />
        </ResumeSection>
        <ResumeSection title="工作经历" icon="experience" :theme="theme.section" :primaryColor="theme.primaryColor">
          <ExperienceItem v-for="(exp,i) in data.experiences" :key="i"
            :company="exp.company" :position="exp.position" :duration="exp.duration"
            :description="exp.description" :achievements="exp.achievements"
            :theme="theme.experience" :primaryColor="theme.primaryColor"
          />
        </ResumeSection>
        <ResumeSection title="教育背景" icon="education" :theme="theme.section" :primaryColor="theme.primaryColor">
          <EducationItem v-for="(edu,i) in data.education" :key="i"
            :school="edu.school" :degree="edu.degree" :major="edu.major"
            :gpa="edu.gpa" :duration="edu.duration" :theme="theme.education"
          />
        </ResumeSection>
        <ResumeSection title="专业技能" icon="skills" :theme="theme.section" :primaryColor="theme.primaryColor">
          <SkillsTags :skills="data.skills" :theme="theme.skills" />
        </ResumeSection>
        <ResumeSection title="项目经验" icon="projects" :theme="theme.section" :primaryColor="theme.primaryColor">
          <div class="space-y-3">
            <ProjectCard v-for="(p,i) in data.projects" :key="i"
              :name="p.name" :role="p.role" :description="p.description"
              :duration="p.duration" :techStack="p.techStack" :theme="theme.projects"
            />
          </div>
        </ResumeSection>
        <ResumeSection v-if="data.certificates && data.certificates.length" title="证书/资格" icon="certificates" :theme="theme.section" :primaryColor="theme.primaryColor">
          <CertificateList :certificates="data.certificates" :theme="theme.certificates" />
        </ResumeSection>
        <ResumeSection v-if="data.campusActivity && data.campusActivity.length" title="校园活动" icon="campus" :theme="theme.section" :primaryColor="theme.primaryColor">
          <CampusActivityList :activities="data.campusActivity" :theme="theme.campusActivity" />
        </ResumeSection>
        <ResumeSection v-if="data.portfolio && data.portfolio.length" title="作品集" icon="portfolio" :theme="theme.section" :primaryColor="theme.primaryColor">
          <PortfolioList :items="data.portfolio" :theme="theme.portfolio" />
        </ResumeSection>
        <ResumeSection v-if="data.dataProjects && data.dataProjects.length" title="数据项目" icon="dataProjects" :theme="theme.section" :primaryColor="theme.primaryColor">
          <DataProjectList :projects="data.dataProjects" :theme="theme.dataProjects" />
        </ResumeSection>
        <ResumeSection v-if="data.productAchievements && data.productAchievements.length" title="产品成果" icon="productAchievements" :theme="theme.section" :primaryColor="theme.primaryColor">
          <ProductAchievementList :achievements="data.productAchievements" :theme="theme.productAchievements" />
        </ResumeSection>
        <ResumeSection v-if="data.publications && data.publications.length" title="论文发表" icon="publications" :theme="theme.section" :primaryColor="theme.primaryColor">
          <PublicationList :publications="data.publications" :theme="theme.publications" />
        </ResumeSection>
        <ResumeSection v-if="data.openSource && data.openSource.length" title="开源贡献" icon="openSource" :theme="theme.section" :primaryColor="theme.primaryColor">
          <OpenSourceList :contributions="data.openSource" :theme="theme.openSource" />
        </ResumeSection>
      </div>
    </div>
  </div>
</template>

<script setup>
import ResumeAvatar from './ResumeAvatar.vue'
import ResumeSection from './ResumeSection.vue'
import ExperienceItem from './ExperienceItem.vue'
import EducationItem from './EducationItem.vue'
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
