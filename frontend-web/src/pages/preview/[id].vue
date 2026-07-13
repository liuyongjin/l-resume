<script setup lang="ts">
definePageMeta({ layout: 'default', ssr: false })

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, navigateTo } from 'nuxt/app'
import { ArrowLeft, Pencil } from 'lucide-vue-next'
import { useLanguageStore } from '~/stores/language'
import { useResumeStore } from '~/stores/resume'
import { useTemplateStore } from '~/stores/template'
import ResumePreview from '~/components/resume/ResumePreview.vue'
import { getThemeByTemplateId } from '~/components/resume/ThemeConfig'
import { storeDataToPreviewData, normalizeResumeData } from '~/utils/resumeTransform'
import { normalizeHiddenSections } from '~/utils/resumeSectionVisibility'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/Badge'
import { AppIcon } from '~/components/ui/icon'

import { storeLayoutToPreviewSectionOrder } from '~/utils/resumeEditSections'

const route = useRoute()
const langStore = useLanguageStore()
const resumeStore = useResumeStore()
const templateStore = useTemplateStore()

const resumeId = route.params.id
const isMobile = ref(false)
const resumeData = ref(storeDataToPreviewData(null))
const currentThemeKey = ref('frontendEngineer')
const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await templateStore.fetchTemplates()

  const resume = await resumeStore.fetchResume(resumeId)
  if (resume) {
    resumeData.value = storeDataToPreviewData(normalizeResumeData(resume.data))
    if (resume.templateId) {
      currentThemeKey.value = resume.templateId
    }
    if (resume.style) {
      const tpl = templateStore.templateListItems.find(
        (t) => t.themeKey === resume.templateId || t.id === resume.templateId,
      )
      const themeKey = tpl?.themeKey || resume.templateId
      styleSettings.value = {
        fontFamily: resume.style.fontFamily + ', sans-serif',
        fontSize: resume.style.fontSize,
        paperSize: 'A4',
        margins: 'normal',
        sectionOrder: storeLayoutToPreviewSectionOrder(resume.style.layout?.mainSection || []),
        hiddenSections: normalizeHiddenSections(resume.style, themeKey),
      }
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const styleSettings = ref({
  fontFamily: 'Microsoft YaHei, sans-serif',
  fontSize: 12,
  paperSize: 'A4',
  margins: 'normal',
  sectionOrder: [
    { key: 'summary' },
    { key: 'experience' },
    { key: 'education' },
    { key: 'projects' },
    { key: 'skills' },
  ],
  hiddenSections: [] as string[],
})

const currentTheme = computed(() => {
  const tpl = templateStore.templateListItems.find(
    (t) => t.themeKey === currentThemeKey.value || t.id === currentThemeKey.value
  )
  if (tpl) return templateStore.getThemeForTemplate(tpl.id)
  return getThemeByTemplateId(currentThemeKey.value)
})

const statusText = computed(() => (langStore.locale === 'zh' ? '预览模式' : 'Preview Mode'))

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/resume')
  }
}

const editResume = () => {
  navigateTo(`/editor/${resumeId}`)
}
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-4rem)] bg-muted/30">
    <header class="page-toolbar h-14 sm:h-16 shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div class="flex items-center gap-4 min-w-0">
        <h1 class="text-base sm:text-lg font-bold text-foreground truncate">
          {{ langStore.locale === 'zh' ? '简历预览' : 'Resume Preview' }}
        </h1>
        <Badge variant="secondary" class="shrink-0">
          {{ statusText }}
        </Badge>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <Button variant="outline" size="sm" class="btn-icon-gap" @click="goBack">
          <AppIcon :icon="ArrowLeft" size="sm" />
          {{ langStore.locale === 'zh' ? '返回' : 'Back' }}
        </Button>
        <Button size="sm" class="btn-icon-gap" @click="editResume">
          <AppIcon :icon="Pencil" size="sm" />
          {{ langStore.locale === 'zh' ? '编辑' : 'Edit' }}
        </Button>
      </div>
    </header>

    <div class="py-5 sm:py-8 px-4 sm:px-6 flex justify-center">
      <div class="w-full max-w-[800px]">
        <ResumePreview
          :data="resumeData"
          :theme="currentTheme"
          :style-settings="styleSettings"
          :is-mobile="isMobile"
        />
      </div>
    </div>
  </div>
</template>
