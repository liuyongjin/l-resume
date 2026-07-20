<template>
  <div :style="{ backgroundColor: isDark ? '#0F172A' : theme.backgroundColor }">
    <!-- Creative banner header（创意模板固定顶部展示，与区块排序无关） -->
    <div
      v-if="preset.header === 'creative-banner' && showBasicInfo"
      data-edit-section="basicInfo"
      :class="[zoneClass('basicInfo'), embedded ? 'px-5 pt-6 pb-5' : 'px-8 pt-10 pb-8', 'text-center relative overflow-hidden']"
      :style="{
        background: `linear-gradient(135deg, ${theme.primaryColor}12 0%, ${theme.primaryColor}06 50%, transparent 100%)`,
        borderBottom: `3px solid ${theme.primaryColor}25`,
      }"
    >
      <div
        class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-1/2 translate-x-1/4"
        :style="{ backgroundColor: theme.primaryColor }"
      />
      <ResumeAvatar
        :name="data.name"
        :title="data.title"
        :location="data.location"
        :phone="data.phone"
        :email="data.email"
        :src="data.avatar"
        :show-avatar="data.showAvatar !== false"
        :theme="theme.avatar"
        :primary-color="theme.primaryColor"
      />
    </div>

    <!-- Tech header（程序开发模板：顶部个人信息栏） -->
    <div
      v-if="preset.header === 'tech-header' && showBasicInfo"
      data-edit-section="basicInfo"
      :class="[zoneClass('basicInfo'), embedded ? 'px-5 py-5' : 'px-8 py-6', 'border-b']"
      :style="{
        borderColor: theme.primaryColor + '25',
        background: `linear-gradient(180deg, ${theme.primaryColor}0A 0%, transparent 100%)`,
      }"
    >
      <ResumeAvatar
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
    </div>

    <!-- Standard avatar header（经典 / 现代 / 数据等模板） -->
    <div
      v-if="preset.header === 'avatar' && showBasicInfo"
      data-edit-section="basicInfo"
      :class="[zoneClass('basicInfo'), embedded ? 'px-5 py-5' : 'px-8 py-6', 'border-b border-border/40']"
    >
      <ResumeAvatar
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
    </div>

    <div :class="embedded ? 'p-4' : 'p-8'">
      <!-- Stats bar (data analyst) -->
      <div v-if="preset.showStatsBar" class="grid grid-cols-3 gap-4 mb-8">
        <div
          v-for="stat in statsItems"
          :key="stat.label"
          class="p-4 rounded-xl text-center border"
          :style="{
            backgroundColor: theme.primaryColor + '10',
            borderColor: theme.primaryColor + '25',
          }"
        >
          <div class="text-3xl font-bold tabular-nums" :style="{ color: theme.primaryColor }">
            {{ stat.value }}
          </div>
          <div class="text-xs mt-1.5 font-medium" :style="{ color: theme.subtitleColor }">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <!-- Two-column (modern / PM / developer) -->
      <div v-if="preset.structure === 'two-column'" class="flex flex-col gap-6">
        <div class="flex gap-8">
          <div class="w-[260px] flex-shrink-0 space-y-6">
            <template v-for="secId in sidebarIdsComputed" :key="secId">
              <div
                v-if="secId === 'summary'"
                :data-edit-section="secId"
                :class="zoneClass(secId)"
                class="p-4 rounded-xl"
                :style="{
                  backgroundColor: theme.summary?.bgColor || theme.primaryColor + '10',
                  borderLeft: `3px solid ${theme.primaryColor}`,
                }"
              >
                <h3 class="font-bold mb-3 text-sm uppercase tracking-wide" :class="theme.section?.titleClass">
                  关于我
                </h3>
                <ResumeSectionRenderer
                  :component-id="secId"
                  :data="data"
                  :theme="theme"
                  section-style="accent-bar"
                />
              </div>
              <div v-else-if="secId === 'basicInfo'" :data-edit-section="secId" :class="zoneClass(secId)">
                <ResumeSectionRenderer
                  :component-id="secId"
                  :data="data"
                  :theme="theme"
                  :interactive="interactive"
                  :active-section-id="activeSectionId"
                  section-style="accent-bar"
                />
              </div>
              <div v-else :data-edit-section="secId" :class="zoneClass(secId)">
                <h3 class="font-bold mb-3 flex items-center gap-2 text-sm" :class="theme.section?.titleClass">
                  <span class="w-1 h-5 rounded-full" :style="{ backgroundColor: theme.primaryColor }" />
                  {{ getSectionTitle(secId) }}
                </h3>
                <ResumeSectionRenderer
                  :component-id="secId"
                  :data="data"
                  :theme="theme"
                  section-style="accent-bar"
                />
              </div>
            </template>
          </div>
          <div class="flex-1 space-y-7 min-w-0">
            <template v-for="secId in mainIdsComputed" :key="secId">
              <div v-if="secId === 'basicInfo'" :data-edit-section="secId" :class="zoneClass(secId)">
                <ResumeSectionRenderer
                  :component-id="secId"
                  :data="data"
                  :theme="theme"
                  :interactive="interactive"
                  :active-section-id="activeSectionId"
                  section-style="accent-bar"
                />
              </div>
              <div v-else :data-edit-section="secId" :class="zoneClass(secId)">
                <h3 class="font-bold mb-4 flex items-center gap-2 text-sm" :class="theme.section?.titleClass">
                  <span class="w-1 h-5 rounded-full" :style="{ backgroundColor: theme.primaryColor }" />
                  {{ getSectionTitle(secId) }}
                </h3>
                <ResumeSectionRenderer
                  :component-id="secId"
                  :data="data"
                  :theme="theme"
                  section-style="accent-bar"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Single column (classic / creative / data) -->
      <div
        v-else
        :class="[
          preset.sectionStyle === 'centered' ? 'max-w-lg mx-auto space-y-8' : 'space-y-7',
        ]"
      >
        <template v-for="secId in mainIdsComputed" :key="secId">
          <div v-if="secId === 'basicInfo'" :data-edit-section="secId" :class="zoneClass(secId)">
            <ResumeSectionRenderer
              :component-id="secId"
              :data="data"
              :theme="theme"
              :section-style="preset.sectionStyle"
              :interactive="interactive"
              :active-section-id="activeSectionId"
            />
          </div>
          <div v-else-if="preset.sectionStyle === 'centered'" :data-edit-section="secId" :class="zoneClass(secId)">
            <h3
              class="font-bold mb-4 text-center text-sm uppercase tracking-widest"
              :class="theme.section?.titleClass"
            >
              {{ getSectionTitle(secId) }}
            </h3>
            <div :class="{ 'flex justify-center': secId === 'skills' }">
              <ResumeSectionRenderer
                :component-id="secId"
                :data="data"
                :theme="theme"
                section-style="centered"
              />
            </div>
          </div>
          <ResumeSectionRenderer
            v-else
            :component-id="secId"
            :data="data"
            :theme="theme"
            :section-style="preset.sectionStyle"
            :interactive="interactive"
            :active-section-id="activeSectionId"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResumeAvatar from './ResumeAvatar.vue'
import ResumeSectionRenderer from './ResumeSectionRenderer.vue'
import { getComponentSchema } from './schema/components'
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

const preset = computed(() => getLayoutPreset(props.theme.layoutPreset || props.theme.layout || 'classic'))
const isDark = computed(() => preset.value.structure === 'two-column-dark')

const orderedComponents = computed(() =>
  resolveComponentOrder(props.theme.components || [], props.sectionOrder)
)

const layoutSplit = computed(() =>
  splitComponentsByLayout(orderedComponents.value, preset.value)
)
const sidebarIdsComputed = computed(() => layoutSplit.value.sidebar)
const mainIdsComputed = computed(() => layoutSplit.value.main)

const showBasicInfo = computed(() => !props.hiddenSections?.includes('basicInfo'))

const statsItems = computed(() => [
  { label: '工作经历', value: props.data.experiences?.length || 0 },
  { label: '项目经验', value: props.data.projects?.length || 0 },
  { label: '专业技能', value: props.data.skills?.length || 0 },
])

function getSectionTitle(componentId: string) {
  return getComponentSchema(componentId)?.name || componentId
}
</script>
