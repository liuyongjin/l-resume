<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { navigateTo } from 'nuxt/app'
import { Button } from '~/components/ui/button'
import TemplatePreviewMini from '~/components/templates/TemplatePreviewMini.vue'
import ResumePreview from '~/components/resume/ResumePreview.vue'
import { useTemplateStore } from '~/stores/template'
import { useResumeStore } from '~/stores/resume'
import { useUserStore } from '~/stores/user'
import { filterTemplates, type TemplateFilter, type TemplateListItem } from '~/utils/templateUi'
import { X } from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'
import { useScrollReveal } from '~/composables/useScrollReveal'
import PageHeader from '~/components/ui/PageHeader.vue'
import { Spinner } from '~/components/ui/spinner'

const templateStore = useTemplateStore()
const resumeStore = useResumeStore()
const userStore = useUserStore()

const activeFilter = ref<TemplateFilter>('all')
const selectedTemplate = ref<TemplateListItem | null>(null)
const showPreview = ref(false)
const isCreating = ref(false)
const pageLoading = ref(true)

const filterOptions: { key: TemplateFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'simple', label: '简洁' },
  { key: 'professional', label: '专业' },
  { key: 'creative', label: '创意' },
  { key: 'developer', label: '开发' },
]

const filteredTemplates = computed(() =>
  filterTemplates(templateStore.templateListItems, activeFilter.value)
)

const previewTheme = computed(() =>
  selectedTemplate.value
    ? templateStore.getThemeForTemplate(selectedTemplate.value.id)
    : null
)

const modalPreviewData = computed(() =>
  selectedTemplate.value
    ? templateStore.getPreviewData(selectedTemplate.value.id)
    : null
)

const dedicatedLayouts = new Set(['frontendEngineer', 'developer', 'productManager', 'freshGraduate'])

const modalStyleSettings = computed(() => {
  const theme = previewTheme.value
  const isDedicated = theme ? dedicatedLayouts.has(theme.layout) : false
  return {
    fontFamily: isDedicated
      ? 'PingFang SC, Microsoft YaHei, sans-serif'
      : 'system-ui, sans-serif',
    fontSize: 12,
    paperSize: 'A4',
    margins: 'narrow',
    sectionOrder: [] as Array<{ key: string }>,
    hiddenSections: theme?.defaultHiddenSections || [],
  }
})

const { refresh } = useScrollReveal('.reveal')

onMounted(async () => {
  pageLoading.value = true
  const tasks: Promise<unknown>[] = [templateStore.fetchTemplates()]
  if (userStore.isLoggedIn) {
    tasks.push(
      resumeStore.fetchResumes().then(() =>
        templateStore.buildPreviewDataFromResumes(
          resumeStore.resumes.filter((item) => !item.isSummaryOnly),
        ),
      ),
    )
  }
  await Promise.all(tasks)
  pageLoading.value = false
  await nextTick()
  refresh()
})

function selectTemplate(template: TemplateListItem) {
  selectedTemplate.value = template
}

function previewTemplate() {
  if (!selectedTemplate.value) return
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
}

async function useTemplate() {
  if (!selectedTemplate.value || isCreating.value) return
  isCreating.value = true
  try {
    const themeKey = templateStore.getThemeKey(selectedTemplate.value.id)
    const sampleData = templateStore.getSampleResumeData(selectedTemplate.value.id)
    const templateStyle = templateStore.getStyleForTemplate(selectedTemplate.value.id)
    const resume = await resumeStore.addResume(
      `${selectedTemplate.value.name}模板简历`,
      themeKey,
      sampleData,
      'template',
      templateStyle,
    )
    if (resume) {
      resumeStore.setCurrentResumeId(String(resume.id))
      await navigateTo(`/editor/${resume.id}`)
    }
  } finally {
    isCreating.value = false
  }
}

async function useTemplateFromPreview() {
  closePreview()
  await useTemplate()
}
</script>

<template>
  <div class="page-stack pb-28 sm:pb-32">
    <PageHeader
      title="模板选择"
      description="选择适合您的简历模板开始创建"
    >
      <template #actions>
        <div class="filter-pills">
          <button
            v-for="opt in filterOptions"
            :key="opt.key"
            type="button"
            :class="[
              'filter-pill',
              activeFilter === opt.key ? 'filter-pill--active' : 'filter-pill--idle',
            ]"
            @click="activeFilter = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="pageLoading" class="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground reveal">
      <Spinner class="size-6 text-primary" />
      <span class="text-sm">加载模板中...</span>
    </div>

    <div v-else-if="templateStore.error" class="text-center py-24 text-destructive reveal">
      {{ templateStore.error }}
    </div>

    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          v-for="(template, index) in filteredTemplates"
          :key="template.id"
          :class="[
            'rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden bg-card reveal',
            `stagger-${(index % 6) + 1}`,
            !pageLoading && 'is-visible',
            selectedTemplate?.id === template.id
              ? 'surface-card--selected border-primary'
              : 'border-border/60 surface-card hover:border-primary/20',
          ]"
          @click="selectTemplate(template)"
        >
          <div class="h-36 sm:h-40 bg-muted/30 overflow-hidden relative">
            <TemplatePreviewMini
              :template="template"
              :preview-data="templateStore.getPreviewData(template.id)"
            />
          </div>

          <div class="p-3.5 sm:p-5 space-y-2.5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <h3 class="text-sm sm:text-[0.9375rem] font-semibold text-foreground truncate leading-snug">{{ template.name }}</h3>
                <p class="template-card__subtitle mt-0.5">{{ template.subtitle }}</p>
              </div>
              <span
                class="template-card__tag"
                :style="{ backgroundColor: template.tagColor, color: template.tagTextColor }"
              >
                {{ template.tag }}
              </span>
            </div>
            <p class="template-card__desc">{{ template.description }}</p>
            <div class="flex flex-wrap gap-1.5 pt-0.5">
              <span
                v-for="feature in template.features.slice(0, 2)"
                :key="feature"
                class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] sm:text-xs leading-tight font-medium"
                :style="{
                  backgroundColor: template.tagColor + '18',
                  color: template.tagColor,
                  borderColor: template.tagColor + '35',
                }"
              >
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="sticky-action-bar">
      <div class="sticky-action-bar__inner">
        <div v-if="selectedTemplate" class="flex items-center gap-3.5 min-w-0">
          <div
            class="size-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
            :style="{ background: selectedTemplate.gradient }"
          >
            <AppIcon :icon="selectedTemplate.icon" size="md" class="text-white" />
          </div>
          <div class="min-w-0">
            <div class="font-medium text-sm sm:text-base text-foreground truncate">{{ selectedTemplate.name }}</div>
            <div class="text-xs text-muted-foreground truncate">{{ selectedTemplate.subtitle }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-muted-foreground">请选择一个模板</div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            class="flex-1 sm:flex-none min-h-10 rounded-xl"
            :disabled="!selectedTemplate"
            @click="previewTemplate"
          >
            预览模板
          </Button>
          <Button
            class="flex-1 sm:flex-none min-h-10 rounded-xl shadow-sm shadow-primary/20"
            :disabled="!selectedTemplate || isCreating"
            @click="useTemplate"
          >
            {{ isCreating ? '创建中...' : '使用此模板' }}
          </Button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showPreview && previewTheme && modalPreviewData"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in"
        @click.self="closePreview"
      >
        <div class="preview-modal animate-scale-in">
          <div class="preview-modal__header">
            <div class="min-w-0">
              <h3 class="preview-modal__title">
                {{ selectedTemplate?.name }} - 预览
              </h3>
              <p class="preview-modal__subtitle">{{ selectedTemplate?.subtitle }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Button size="sm" class="rounded-lg shadow-sm" :disabled="isCreating" @click="useTemplateFromPreview">
                使用此模板
              </Button>
              <Button variant="ghost" size="icon" class="rounded-lg" @click="closePreview">
                <AppIcon :icon="X" size="lg" />
              </Button>
            </div>
          </div>
          <div class="preview-modal__body">
            <ResumePreview
              :data="modalPreviewData"
              :theme="previewTheme"
              :style-settings="modalStyleSettings"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
