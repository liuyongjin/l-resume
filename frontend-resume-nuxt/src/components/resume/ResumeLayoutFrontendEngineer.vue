<template>
  <div
    :style="{ backgroundColor: theme.backgroundColor }"
    :class="['frontend-engineer-layout', { 'frontend-engineer-layout--embedded': embedded }]"
  >
    <!-- 主体内容（含个人信息，顺序由 sectionOrder 决定） -->
    <div class="fe-body">
      <template v-for="sec in sectionOrder" :key="sec">
        <!-- 个人信息 -->
        <div
          v-if="sec === 'basicInfo' && showBasicInfo"
          class="fe-header-block"
          data-edit-section="basicInfo"
          :class="zoneClass('basicInfo')"
        >
          <header class="fe-header">
            <div class="fe-header-main">
              <div class="fe-name-row">
                <h1 :class="['fe-name', theme.avatar.nameClass]">{{ data.name }}</h1>
                <div class="fe-contact-row">
                  <span v-if="data.phone" class="fe-contact-item">
                    <span>{{ data.phone }}</span>
                  </span>
                  <span v-if="data.email" class="fe-contact-item">
                    <span>{{ data.email }}</span>
                  </span>
                  <span v-if="data.location" class="fe-contact-item">
                    <span>{{ data.location }}</span>
                  </span>
                </div>
              </div>
              <p :class="['fe-title', theme.avatar.titleClass]">{{ data.title }}</p>
            </div>
            <div
              v-if="data.showAvatar !== false"
              class="fe-avatar"
              :style="{
                borderColor: theme.primaryColor + '40',
                backgroundColor: theme.primaryColor + '18',
                borderWidth: theme.avatar?.borderWidth || '2px',
              }"
            >
              <img v-if="data.avatar" :src="data.avatar" :alt="data.name || '头像'" class="fe-avatar__img" />
              <svg
                v-else
                class="fe-avatar__placeholder"
                viewBox="0 0 24 24"
                fill="none"
                :stroke="theme.primaryColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </header>
          <div
            class="fe-header-divider"
            :style="{ borderBottom: `1.5px solid ${theme.primaryColor}` }"
            aria-hidden="true"
          />
        </div>

        <!-- 个人总结 -->
        <section
          v-if="sec === 'summary'"
          class="fe-section"
          data-edit-section="summary"
          :class="zoneClass('summary')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">个人总结</h2>
          <div class="fe-section-content">
            <p :class="['fe-summary', theme.summary.textClass]">{{ data.summary }}</p>
            <p v-if="data.github" class="fe-github">
              <span class="fe-label">个人GitHub:</span>
              <a :href="data.github" :style="{ color: theme.primaryColor }" class="fe-link">{{ data.github }}</a>
              <span v-if="data.githubDesc" class="fe-github-desc">{{ data.githubDesc }}</span>
            </p>
          </div>
        </section>

        <!-- 工作经历 -->
        <section
          v-if="sec === 'experience'"
          class="fe-section"
          data-edit-section="experience"
          :class="zoneClass('experience')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">工作经历</h2>
          <div class="fe-section-content">
            <div v-for="(exp, i) in data.experiences" :key="i" class="fe-experience">
              <div class="fe-experience-header">
                <div class="fe-experience-left">
                  <span :class="['fe-company', theme.experience.titleClass]">{{ exp.company }}</span>
                  <span v-if="exp.position" :class="['fe-position', theme.experience.subtitleClass]">{{ exp.position }}</span>
                </div>
                <div class="fe-experience-right">
                  <span :class="['fe-duration', theme.experience.dateClass]">{{ exp.duration }}</span>
                  <span v-if="exp.location" class="fe-location">{{ exp.location }}</span>
                </div>
              </div>
              <ul class="fe-experience-list">
                <li v-for="(item, j) in formatExperienceContent(exp)" :key="j" :class="['fe-experience-item', theme.experience.descriptionClass]">
                  {{ item }}
                </li>
              </ul>
              <p v-if="exp.techStack" :class="['fe-techstack', theme.experience.achievementClass]">
                <span class="fe-label">技术栈：</span>{{ formatTechStack(exp.techStack) }}
              </p>
            </div>
          </div>
        </section>

        <!-- 教育经历 -->
        <section
          v-if="sec === 'education'"
          class="fe-section"
          data-edit-section="education"
          :class="zoneClass('education')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">教育经历</h2>
          <div class="fe-section-content">
            <div v-for="(edu, i) in data.education" :key="i" class="fe-education">
              <div class="fe-education-row">
                <span :class="['fe-school', theme.education.titleClass]">{{ edu.school }}</span>
                <span :class="['fe-duration-edu', theme.education.dateClass]">{{ edu.duration }}</span>
              </div>
              <div :class="['fe-degree-major', theme.education.subtitleClass]">{{ edu.degree }} · {{ edu.major }}</div>
            </div>
          </div>
        </section>

        <!-- 技能 -->
        <section
          v-if="sec === 'skills'"
          class="fe-section"
          data-edit-section="skills"
          :class="zoneClass('skills')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">技能</h2>
          <div class="fe-section-content">
            <div class="fe-skills-grid">
              <div v-for="(group, i) in formatSkillGroups(data.skills)" :key="i" class="fe-skill-group">
                <h3 class="fe-skill-category" :style="{ color: theme.primaryColor }">{{ group.category }}</h3>
                <p class="fe-skill-list">{{ group.items }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 项目经历 -->
        <section
          v-if="sec === 'projects'"
          class="fe-section"
          data-edit-section="projects"
          :class="zoneClass('projects')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">项目经历</h2>
          <div class="fe-section-content">
            <div v-for="(p, i) in data.projects" :key="i" class="fe-project">
              <div class="fe-project-header">
                <span :class="['fe-project-name', theme.projects.titleClass]">{{ p.name }}</span>
                <span :class="['fe-project-role', theme.projects.roleClass]">{{ p.role }}</span>
              </div>
              <ul v-if="formatProjectContent(p).length" class="fe-project-list">
                <li v-for="(item, j) in formatProjectContent(p)" :key="j" :class="['fe-project-item', theme.projects.descriptionClass]">
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- 其他信息 -->
        <section
          v-if="sec === 'other'"
          class="fe-section"
          data-edit-section="other"
          :class="zoneClass('other')"
        >
          <h2 class="fe-section-title" :style="{ color: theme.primaryColor, borderBottom: `1.5px solid ${theme.primaryColor}` }">其他</h2>
          <div class="fe-section-content">
            <div class="fe-other-tags">
              <span v-for="(tag, i) in data.otherTags" :key="i" class="fe-other-tag">{{ tag }}</span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { editZoneClass } from '~/utils/resumeEditSections'
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  theme: { type: Object, default: () => ({}) },
  sectionOrder: {
    type: Array,
    default: () => ['summary', 'education', 'projects', 'experience', 'skills', 'other']
  },
  hiddenSections: {
    type: Array,
    default: () => []
  },
  interactive: { type: Boolean, default: false },
  activeSectionId: { type: String, default: '' },
  embedded: { type: Boolean, default: false },
})

function zoneClass(sectionId) {
  return editZoneClass(Boolean(props.interactive), props.activeSectionId === sectionId)
}

const showBasicInfo = computed(() => !props.hiddenSections.includes('basicInfo'))

const formatExperienceContent = (exp) => {
  if (Array.isArray(exp.achievements) && exp.achievements.length) {
    return exp.achievements
  }
  if (exp.description) {
    const text = String(exp.description)
    if (text.includes('\n')) {
      return text.split('\n').map((s) => s.trim()).filter(Boolean)
    }
    return [text]
  }
  return []
}

const formatProjectContent = (p) => {
  if (Array.isArray(p.highlights) && p.highlights.length) {
    return p.highlights
  }
  if (Array.isArray(p.achievements) && p.achievements.length) {
    return p.achievements
  }
  if (p.description) {
    const text = String(p.description)
    if (text.includes('\n')) {
      return text.split('\n').map((s) => s.trim()).filter(Boolean)
    }
    return [text]
  }
  return []
}

const formatTechStack = (tech) => {
  if (Array.isArray(tech)) return tech.join('、')
  return tech
}

const formatSkillGroups = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return []
  const categories = ['前端技术', '后端与数据库', '工程化与工具', '云服务与运维']
  const groupSize = Math.ceil(skills.length / Math.min(4, categories.length))
  const groups = []
  for (let i = 0; i < skills.length; i += groupSize) {
    const idx = Math.floor(i / groupSize)
    groups.push({
      category: categories[idx] || '其他',
      items: skills.slice(i, i + groupSize).join('、')
    })
  }
  return groups
}
</script>

<style scoped>
.frontend-engineer-layout {
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  line-height: 1.6;
  font-size: 12px;
  padding: 28px 32px;
  min-height: 100%;
  box-sizing: border-box;
}

.fe-header-block {
  margin-bottom: 14px;
}

.fe-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 0;
  margin-bottom: 0;
}

.fe-header-main {
  flex: 1;
  min-width: 0;
}

.fe-avatar {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  border-style: solid;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.fe-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fe-avatar__placeholder {
  width: 50%;
  height: 50%;
  display: block;
  flex-shrink: 0;
  opacity: 0.7;
}

.fe-header-divider {
  width: 100%;
  margin: 0 0 6px 0;
  padding-bottom: 3px;
  box-sizing: border-box;
}

.fe-name-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 8px;
}

.fe-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.fe-contact-row {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #666;
  flex-wrap: wrap;
}

.fe-contact-item {
  display: inline-flex;
  align-items: center;
}

.fe-title {
  font-size: 13px;
  color: #2563eb;
  margin: 0;
  font-weight: 500;
}

.fe-section {
  margin-bottom: 14px;
}

.fe-section-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px 0;
  padding-bottom: 3px;
  letter-spacing: 0.5px;
}

.fe-section-content {
  padding-left: 2px;
}

.fe-summary {
  margin: 0 0 6px 0;
  font-size: 12px;
  line-height: 1.7;
  color: #333;
  text-align: justify;
}

.fe-github {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #555;
}

.fe-label {
  font-weight: 500;
  color: #333;
}

.fe-link {
  text-decoration: none;
  margin: 0 4px;
}

.fe-link:hover {
  text-decoration: underline;
}

.fe-github-desc {
  color: #888;
  font-size: 10px;
}

.fe-experience {
  margin-bottom: 10px;
  padding-left: 0;
  position: relative;
}

.fe-experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 3px;
}

.fe-experience-left {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.fe-company {
  font-weight: 600;
  font-size: 12px;
  color: #1a1a1a;
}

.fe-position {
  font-size: 11px;
  color: #2563eb;
}

.fe-experience-right {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #666;
}

.fe-duration {
  color: #666;
}

.fe-location {
  color: #888;
}

.fe-experience-list {
  margin: 3px 0 0 0;
  padding-left: 14px;
  list-style: disc;
}

.fe-experience-item {
  font-size: 11px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 2px;
}

.fe-techstack {
  margin: 4px 0 0 0;
  padding-left: 14px;
  font-size: 11px;
  color: #555;
}

.fe-education {
  margin-bottom: 8px;
}

.fe-education-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.fe-school {
  font-weight: 600;
  font-size: 12px;
  color: #1a1a1a;
}

.fe-duration-edu {
  font-size: 11px;
  color: #666;
}

.fe-degree-major {
  font-size: 11px;
  color: #555;
  margin-top: 1px;
}

.fe-skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 24px;
}

.fe-skill-group {
  break-inside: avoid;
}

.fe-skill-category {
  font-size: 11px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.fe-skill-list {
  margin: 0;
  font-size: 11px;
  line-height: 1.65;
  color: #333;
}

.fe-project {
  margin-bottom: 8px;
}

.fe-project-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.fe-project-name {
  font-weight: 600;
  font-size: 12px;
  color: #1a1a1a;
}

.fe-project-role {
  font-size: 11px;
  color: #2563eb;
}

.fe-project-list {
  margin: 2px 0 0 0;
  padding-left: 14px;
  list-style: disc;
}

.fe-project-item {
  font-size: 11px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 2px;
}

.fe-other-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fe-other-tag {
  font-size: 11px;
  color: #555;
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.frontend-engineer-layout--embedded {
  padding: 12px 14px;
}

.frontend-engineer-layout--embedded .fe-header-block {
  margin-bottom: 10px;
}

.frontend-engineer-layout--embedded .fe-section {
  margin-bottom: 10px;
}

.frontend-engineer-layout--embedded .fe-avatar {
  width: 64px;
  height: 64px;
}

@media (max-width: 640px) {
  .frontend-engineer-layout {
    padding: 20px 16px;
    font-size: 11px;
  }
  .fe-name {
    font-size: 18px;
  }
  .fe-skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
