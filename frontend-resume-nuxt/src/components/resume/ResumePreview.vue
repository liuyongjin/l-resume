<template>
  <div 
    :class="[
      'w-full mx-auto overflow-hidden',
      captureMode ? 'resume-preview--capture' : (embedded ? 'shadow-md rounded-md' : 'shadow-xl rounded-lg'),
    ]"
    :style="{
      backgroundColor: theme.backgroundColor,
      fontFamily: styleSettings.fontFamily,
      fontSize: styleSettings.fontSize + 'pt',
      fontWeight: styleSettings.fontWeight || 'normal',
      fontStyle: styleSettings.fontStyle || 'normal',
      lineHeight: styleSettings.lineHeight || 1.5,
      letterSpacing: (styleSettings.letterSpacing ?? 0) + 'px',
      maxWidth: previewMaxWidth,
      padding: embedded
        ? getEmbeddedMarginPadding()
        : (isDedicatedLayout ? '0' : (isMobile ? getMobileMarginPadding() : getMarginPadding()))
    }"
  >
    <component
      :is="layoutComponent"
      :data="data"
      :theme="theme"
      :section-order="sectionKeys"
      :hidden-sections="styleSettings.hiddenSections || []"
      :interactive="interactive && !captureMode"
      :active-section-id="captureMode ? '' : activeSectionId"
      :embedded="embedded"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResumeLayoutComposer from './ResumeLayoutComposer.vue'
import ResumeLayoutDeveloper from './ResumeLayoutDeveloper.vue'
import ResumeLayoutFrontendEngineer from './ResumeLayoutFrontendEngineer.vue'
import ResumeLayoutProductManager from './ResumeLayoutProductManager.vue'
import ResumeLayoutFreshGraduate from './ResumeLayoutFreshGraduate.vue'
import { getPaperMaxWidthStyle, normalizePaperSize } from '~/utils/resumePaper'
import { STORE_TO_PREVIEW, ensureBasicInfoInPreviewOrder, ensureVisibleThemeSectionsInPreviewOrder } from '~/utils/resumeEditSections'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  theme: { type: Object, default: () => ({}) },
  styleSettings: { type: Object, default: () => ({ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 12, paperSize: 'A4', margins: 'normal', sectionOrder: [] }) },
  isMobile: { type: Boolean, default: false },
  embedded: { type: Boolean, default: false },
  interactive: { type: Boolean, default: false },
  activeSectionId: { type: String, default: '' },
  /** 导出截图模式：关闭联动虚线框，去掉阴影圆角 */
  captureMode: { type: Boolean, default: false },
})

const paperSize = computed(() => normalizePaperSize(props.styleSettings.paperSize))

const previewMaxWidth = computed(() => {
  if (props.isMobile) return '100%'
  return getPaperMaxWidthStyle(paperSize.value, props.embedded)
})

const effectiveLayout = computed(() => {
  const layout = props.theme.layout
  if (['frontendEngineer', 'developer', 'productManager', 'freshGraduate'].includes(layout)) {
    return layout
  }
  if (props.theme.id === 'amber') return 'productManager'
  if (props.theme.id === 'modern') return 'freshGraduate'
  return layout
})

const isDedicatedLayout = computed(() =>
  ['frontendEngineer', 'developer', 'productManager', 'freshGraduate'].includes(effectiveLayout.value),
)

const layoutComponent = computed(() => {
  if (effectiveLayout.value === 'frontendEngineer') {
    return ResumeLayoutFrontendEngineer
  }
  if (effectiveLayout.value === 'productManager') {
    return ResumeLayoutProductManager
  }
  if (effectiveLayout.value === 'freshGraduate') {
    return ResumeLayoutFreshGraduate
  }
  if (effectiveLayout.value === 'developer' || props.theme.layoutPreset === 'developer') {
    return ResumeLayoutDeveloper
  }
  return ResumeLayoutComposer
})

const DEFAULT_FE_SECTIONS = ['basicInfo', 'summary', 'education', 'projects', 'experience', 'skills', 'other']
const DEFAULT_PM_SECTIONS = ['basicInfo', 'skills', 'experience', 'projects', 'productAchievements', 'education']
const DEFAULT_FG_SECTIONS = ['basicInfo', 'skills', 'experience', 'projects', 'education', 'certificates', 'campusActivity']

const sectionKeys = computed(() => {
  const raw = (props.styleSettings.sectionOrder || []).map((s) => s.key || s)
  const mapped = raw.map((k) => STORE_TO_PREVIEW[k] || k).filter(Boolean)
  let keys: string[] = []
  if (mapped.length) {
    keys = mapped
  } else if (effectiveLayout.value === 'frontendEngineer') {
    const fromComponents = (props.theme.components || DEFAULT_FE_SECTIONS).filter(Boolean)
    keys = fromComponents.length ? fromComponents : DEFAULT_FE_SECTIONS
  } else if (effectiveLayout.value === 'productManager') {
    const fromComponents = (props.theme.components || DEFAULT_PM_SECTIONS).filter(Boolean)
    keys = fromComponents.length ? fromComponents : DEFAULT_PM_SECTIONS
  } else if (effectiveLayout.value === 'freshGraduate') {
    const fromComponents = (props.theme.components || DEFAULT_FG_SECTIONS).filter(Boolean)
    keys = fromComponents.length ? fromComponents : DEFAULT_FG_SECTIONS
  }
  const hidden = props.styleSettings.hiddenSections || []
  const themeComponents = (props.theme.components || DEFAULT_FE_SECTIONS) as string[]
  keys = ensureBasicInfoInPreviewOrder(keys, { themeComponents, hiddenSections: hidden })
  keys = ensureVisibleThemeSectionsInPreviewOrder(keys, { themeComponents, hiddenSections: hidden })
  return keys.filter((k) => !hidden.includes(k))
})

const getMarginPadding = () => {
  const size = props.styleSettings.margins || 'normal'
  const map = { narrow: '12mm', normal: '20mm', wide: '28mm' }
  return map[size] || map.normal
}

const getMobileMarginPadding = () => {
  const size = props.styleSettings.margins || 'normal'
  const map = { narrow: '8px', normal: '12px', wide: '16px' }
  return map[size] || map.normal
}

const getEmbeddedMarginPadding = () => {
  const size = props.styleSettings.margins || 'normal'
  const map = { narrow: '10px 12px', normal: '14px 16px', wide: '18px 20px' }
  return map[size] || map.normal
}
</script>
