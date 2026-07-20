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
      <div class="h-px my-6" :style="{ backgroundColor: theme.dividerColor }"></div>

      <div class="flex gap-8">
        <div class="w-[280px] flex-shrink-0 space-y-6">
          <div class="p-4 rounded-lg" :style="{ backgroundColor: theme.summary.bgColor }">
            <h3 class="font-bold mb-3" :class="theme.section.titleClass">关于我</h3>
            <SummarySection :summary="data.summary" :theme="theme.summary" />
          </div>

          <div>
            <h3 class="font-bold mb-3" :class="theme.section.titleClass">专业技能</h3>
            <SkillsTags :skills="data.skills" :theme="theme.skills" />
          </div>

          <div>
            <h3 class="font-bold mb-3" :class="theme.section.titleClass">教育背景</h3>
            <div class="space-y-3">
              <EducationItem v-for="(edu,i) in data.education" :key="i"
                :school="edu.school" :degree="edu.degree" :major="edu.major"
                :gpa="edu.gpa" :duration="edu.duration" :theme="theme.education"
              />
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-6">
          <div>
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              工作经历
            </h3>
            <ExperienceItem v-for="(exp,i) in data.experiences" :key="i"
              :company="exp.company" :position="exp.position" :duration="exp.duration"
              :description="exp.description" :achievements="exp.achievements"
              :theme="theme.experience" :primaryColor="theme.primaryColor"
            />
          </div>

          <div>
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              项目经验
            </h3>
            <div class="space-y-3">
              <ProjectCard v-for="(p,i) in data.projects" :key="i"
                :name="p.name" :role="p.role" :description="p.description"
                :duration="p.duration" :techStack="p.techStack" :theme="theme.projects"
              />
            </div>
          </div>

          <div v-if="data.certificates && data.certificates.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              证书/资格
            </h3>
            <CertificateList :certificates="data.certificates" :theme="theme.certificates" />
          </div>
          <div v-if="data.campusActivity && data.campusActivity.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              校园活动
            </h3>
            <CampusActivityList :activities="data.campusActivity" :theme="theme.campusActivity" />
          </div>
          <div v-if="data.portfolio && data.portfolio.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              作品集
            </h3>
            <PortfolioList :items="data.portfolio" :theme="theme.portfolio" />
          </div>
          <div v-if="data.dataProjects && data.dataProjects.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              数据项目
            </h3>
            <DataProjectList :projects="data.dataProjects" :theme="theme.dataProjects" />
          </div>
          <div v-if="data.productAchievements && data.productAchievements.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              产品成果
            </h3>
            <ProductAchievementList :achievements="data.productAchievements" :theme="theme.productAchievements" />
          </div>
          <div v-if="data.publications && data.publications.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              论文发表
            </h3>
            <PublicationList :publications="data.publications" :theme="theme.publications" />
          </div>
          <div v-if="data.openSource && data.openSource.length">
            <h3 class="font-bold mb-4 flex items-center gap-2" :class="theme.section.titleClass">
              <span class="w-2 h-6 rounded" :style="{ backgroundColor: theme.primaryColor }"></span>
              开源贡献
            </h3>
            <OpenSourceList :contributions="data.openSource" :theme="theme.openSource" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ResumeAvatar from './ResumeAvatar.vue'
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
