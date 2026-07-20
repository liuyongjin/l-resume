<script setup lang="ts">
import { computed } from 'vue'
import ResumePreview from '~/components/resume/ResumePreview.vue'
import { useTemplateStore } from '~/stores/template'
import type { TemplateListItem } from '~/utils/templateUi'
import type { PreviewResumeData } from '~/utils/resumeTransform'

const props = defineProps<{
  template: TemplateListItem
  previewData: PreviewResumeData
}>()

const templateStore = useTemplateStore()

const theme = computed(() => templateStore.getThemeForTemplate(props.template.id))

const dedicatedLayouts = new Set(['frontendEngineer', 'developer', 'productManager', 'freshGraduate'])

const isDedicatedLayout = computed(() => dedicatedLayouts.has(theme.value.layout))

const scale = computed(() => {
  if (theme.value.layout === 'productManager' || theme.value.layout === 'freshGraduate') return 0.31
  if (theme.value.layout === 'frontendEngineer') return 0.32
  return 0.34
})

const styleSettings = computed(() => ({
  fontFamily: isDedicatedLayout.value
    ? 'PingFang SC, Microsoft YaHei, sans-serif'
    : 'system-ui, sans-serif',
  fontSize: 11,
  paperSize: 'A4',
  margins: 'narrow',
  sectionOrder: [] as Array<{ key: string }>,
  hiddenSections: theme.value.defaultHiddenSections || [],
}))
</script>

<template>
  <div class="h-full w-full overflow-hidden bg-card" :data-testid="`template-mini-${template.themeKey}`">
    <div
      class="origin-top-left pointer-events-none select-none"
      :style="{
        transform: `scale(${scale})`,
        width: `${Math.round(100 / scale)}%`,
        height: `${Math.round(100 / scale)}%`,
      }"
    >
      <ResumePreview
        :data="previewData"
        :theme="theme"
        :style-settings="styleSettings"
        :is-mobile="true"
      />
    </div>
  </div>
</template>
