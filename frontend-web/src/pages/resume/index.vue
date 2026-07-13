<template>
  <div class="page-stack" :class="{ 'page-stack--empty': !loading && resumes.length === 0 }">
    <PageHeader
      :title="langStore.locale === 'zh' ? '我的简历' : 'My Resume'"
      :description="emptyDescription"
    >
      <template v-if="!loading && resumes.length > 0" #actions>
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            v-if="selectedIds.length > 0"
            variant="destructive"
            size="sm"
            :disabled="isBatchDeleting"
            @click="handleBatchDelete"
          >
            <Spinner v-if="isBatchDeleting" class="size-3.5" />
            <Trash2 v-else class="size-3.5" />
            {{ langStore.locale === 'zh' ? `删除 (${selectedIds.length})` : `Delete (${selectedIds.length})` }}
          </Button>
          <Button size="sm" @click="handleCreateResume">
            <Plus class="size-3.5" />
            {{ langStore.locale === 'zh' ? '创建简历' : 'Create' }}
          </Button>
        </div>
      </template>
    </PageHeader>

    <ResumeListSkeleton v-if="loading" />

    <section
      v-else-if="resumes.length === 0"
      class="resume-empty-state"
      aria-label="empty resume guide"
    >
      <div class="resume-empty-state__icon" aria-hidden="true">
        <Inbox class="size-8 text-muted-foreground" />
      </div>
      <h2 class="resume-empty-state__title">
        {{ langStore.locale === 'zh' ? '还没有简历' : 'No resumes yet' }}
      </h2>
      <p class="resume-empty-state__desc">
        {{ langStore.locale === 'zh' ? '选择一种方式，开始创建您的第一份简历' : 'Choose a way to create your first resume' }}
      </p>

      <div class="resume-empty-state__actions">
        <button type="button" class="resume-empty-action" @click="goToTemplates">
          <IconBox :icon="LayoutGrid" size="lg" variant="primary" class="resume-empty-action__icon" />
          <span class="resume-empty-action__label">
            {{ langStore.locale === 'zh' ? '从模板创建' : 'Create from template' }}
          </span>
          <span class="resume-empty-action__hint">
            {{ langStore.locale === 'zh' ? '挑选精美模板，快速进入编辑' : 'Pick a template and start editing' }}
          </span>
          <ChevronRight class="resume-empty-action__arrow" />
        </button>

        <button type="button" class="resume-empty-action resume-empty-action--accent" @click="goToWorkflowExecution">
          <IconBox :icon="Sparkles" size="lg" variant="fuchsia" class="resume-empty-action__icon" />
          <span class="resume-empty-action__label">
            {{ langStore.locale === 'zh' ? '从智能执行创建' : 'Create via smart execution' }}
          </span>
          <span class="resume-empty-action__hint">
            {{ langStore.locale === 'zh' ? '多智能体协作，自动生成简历内容' : 'Multi-agent workflow auto-generates your resume' }}
          </span>
          <ChevronRight class="resume-empty-action__arrow" />
        </button>
      </div>

      <p class="resume-empty-state__tip">
        {{ langStore.locale === 'zh' ? '提示：智能执行需先上传原始简历或填写基本信息' : 'Tip: Smart execution requires an uploaded resume or basic info' }}
      </p>
    </section>

    <Card v-else class="surface-card border-border/60 shadow-sm reveal overflow-hidden" style="transition-delay: 0.08s">
      <CardContent class="p-6">
        <div
          role="button"
          tabindex="0"
          class="card-toolbar cursor-pointer select-none"
          @click="toggleSelectAll"
          @keydown.enter.space.prevent="toggleSelectAll"
        >
          <div class="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              :model-value="selectAllState"
              class="pointer-events-none"
              tabindex="-1"
            />
            <span>{{ langStore.locale === 'zh' ? '全选' : 'Select all' }}</span>
          </div>
          <span v-if="selectedIds.length > 0" class="text-xs text-muted-foreground">
            {{ langStore.locale === 'zh' ? `已选 ${selectedIds.length} 项` : `${selectedIds.length} selected` }}
          </span>
        </div>

        <div class="page-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-5 sm:p-6 lg:p-7 pt-5">
          <Card
            v-for="(resume, index) in resumes"
            :key="resume.id"
            :class="[
              'group surface-card reveal',
              `stagger-${(index % 6) + 1}`,
              !loading && 'is-visible',
              isSelected(resume.id) && 'border-primary/50 ring-1 ring-primary/20',
            ]"
          >
            <CardContent class="flex flex-col h-full p-5 sm:p-6">
              <div class="flex items-start gap-3 mb-4">
                <Checkbox
                  class="mt-0.5 shrink-0"
                  :model-value="isSelected(resume.id)"
                  @update:model-value="(checked) => toggleSelect(resume.id, checked)"
                />
                <IconBox :icon="FileText" size="md" variant="primary" class="group-hover:bg-primary/12" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-sm text-foreground truncate">{{ resume.title }}</h3>
                    <Badge v-if="resume.source === 'workflow'" variant="secondary" class="shrink-0 text-[11px] px-1.5 py-0">
                      AI
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 truncate">
                    {{ getTemplateName(resume.templateId) }}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  :disabled="deletingId === resume.id || isBatchDeleting"
                  :title="langStore.locale === 'zh' ? '删除简历' : 'Delete resume'"
                  @click="handleDeleteResume(resume)"
                >
                  <Spinner v-if="deletingId === resume.id" class="size-3.5" />
                  <Trash2 v-else class="size-3.5" />
                </Button>
              </div>

              <div class="rounded-lg bg-muted/30 px-3 py-2 space-y-1.5 text-xs text-muted-foreground mb-3">
                <div class="flex items-center justify-between gap-3">
                  <span>{{ langStore.locale === 'zh' ? '创建时间' : 'Created' }}</span>
                  <span class="text-foreground/80 tabular-nums">{{ formatDateTime(resume.createdAt) }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span>{{ langStore.locale === 'zh' ? '更新时间' : 'Updated' }}</span>
                  <span class="text-foreground/80 tabular-nums">{{ formatDateTime(resume.updatedAt) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-auto pt-2.5 border-t border-border/50">
                <Button variant="outline" size="sm" class="flex-1" @click="previewResume(resume)">
                  <Eye class="size-3.5" />
                  {{ langStore.locale === 'zh' ? '预览' : 'Preview' }}
                </Button>
                <Button size="sm" class="flex-1" @click="editResume(resume)">
                  <Pencil class="size-3.5" />
                  {{ langStore.locale === 'zh' ? '编辑' : 'Edit' }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { navigateTo } from 'nuxt/app'
import {
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  LayoutGrid,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-vue-next'
import { useLanguageStore } from '~/stores/language'
import { useResumeStore } from '~/stores/resume'
import type { Resume } from '~/stores/resume'
import { useTemplateStore } from '~/stores/template'
import { useScrollReveal } from '~/composables/useScrollReveal'
import { IconBox } from '~/components/ui/icon'
import ResumeListSkeleton from '~/components/resume/ResumeListSkeleton.vue'
import PageHeader from '~/components/ui/PageHeader.vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/Badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Spinner } from '~/components/ui/spinner'
import { useAppToast } from '~/composables/useAppToast'
import { useAppConfirm } from '~/composables/useAppConfirm'

const langStore = useLanguageStore()
const resumeStore = useResumeStore()
const templateStore = useTemplateStore()
const toast = useAppToast()
const appConfirm = useAppConfirm()

const deletingId = ref<number | string | null>(null)
const isBatchDeleting = ref(false)
const selectedIds = ref<number[]>([])

const resumes = computed(() => resumeStore.resumes)
const loading = computed(() => resumeStore.loading)
const emptyDescription = computed(() => {
  if (loading.value) {
    return langStore.locale === 'zh' ? '加载中…' : 'Loading…'
  }
  if (resumes.value.length === 0) {
    return langStore.locale === 'zh' ? '创建您的第一份简历' : 'Create your first resume'
  }
  return langStore.locale === 'zh' ? '管理您的简历文档' : 'Manage your resume documents'
})
const isAllSelected = computed(() =>
  resumes.value.length > 0 && selectedIds.value.length === resumes.value.length,
)
const selectAllState = computed<boolean | 'indeterminate'>(() => {
  if (resumes.value.length === 0) return false
  if (isAllSelected.value) return true
  if (selectedIds.value.length > 0) return 'indeterminate'
  return false
})

const { refresh } = useScrollReveal('.reveal')

onMounted(async () => {
  await Promise.all([resumeStore.fetchResumes(), templateStore.fetchTemplates()])
  await nextTick()
  refresh()
})

watch(loading, async (val, oldVal) => {
  if (oldVal && !val) {
    await nextTick()
    refresh()
  }
})

watch(resumes, (list) => {
  const validIds = new Set(list.map((item) => Number(item.id)))
  selectedIds.value = selectedIds.value.filter((id) => validIds.has(id))
})

const isSelected = (id: number | string) => selectedIds.value.includes(Number(id))

const toggleSelect = (id: number | string, checked: boolean | 'indeterminate') => {
  const numId = Number(id)
  if (checked === true) {
    if (!selectedIds.value.includes(numId)) {
      selectedIds.value = [...selectedIds.value, numId]
    }
    return
  }
  selectedIds.value = selectedIds.value.filter((item) => item !== numId)
}

/** 全选 / 取消全选：按当前是否已全选切换，不依赖 checkbox 回传的 checked 值 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
    return
  }
  selectedIds.value = resumes.value.map((item) => Number(item.id))
}

const getTemplateName = (templateId?: string) => templateStore.getTemplateName(templateId)

const formatDateTime = (dateString?: string) => {
  if (!dateString) return langStore.locale === 'zh' ? '—' : '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return langStore.locale === 'zh' ? '—' : '-'
  return langStore.locale === 'zh'
    ? date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const previewResume = (resume: Resume) => {
  navigateTo(`/preview/${resume.id}`)
}

const editResume = (resume: Resume) => {
  resumeStore.setCurrentResumeId(String(resume.id))
  navigateTo(`/editor/${resume.id}`)
}

const handleCreateResume = async () => {
  const resume = await resumeStore.addResume(langStore.locale === 'zh' ? '新建简历' : 'New Resume')
  if (resume) {
    resumeStore.setCurrentResumeId(String(resume.id))
    navigateTo(`/editor/${resume.id}`)
  }
}

const goToTemplates = () => {
  navigateTo('/templates')
}

const goToWorkflowExecution = () => {
  navigateTo('/workflow/execution')
}

const handleDeleteResume = async (resume: Resume) => {
  const isZh = langStore.locale === 'zh'
  const confirmed = await appConfirm.confirm({
    title: isZh ? '删除简历' : 'Delete Resume',
    description: isZh
      ? `确定删除「${resume.title}」吗？此操作不可恢复。`
      : `Delete "${resume.title}"? This cannot be undone.`,
    confirmText: isZh ? '删除' : 'Delete',
    cancelText: isZh ? '取消' : 'Cancel',
    variant: 'destructive',
  })
  if (!confirmed) return

  deletingId.value = resume.id
  try {
    const ok = await resumeStore.deleteResume(Number(resume.id))
    if (ok) {
      selectedIds.value = selectedIds.value.filter((id) => id !== Number(resume.id))
      toast.success(isZh ? '简历已删除' : 'Resume deleted')
    } else {
      toast.error(isZh ? '删除失败，请稍后重试' : 'Delete failed, please try again')
    }
  } finally {
    deletingId.value = null
  }
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length || isBatchDeleting.value) return

  const isZh = langStore.locale === 'zh'
  const count = selectedIds.value.length
  const confirmed = await appConfirm.confirm({
    title: isZh ? '批量删除简历' : 'Batch Delete Resumes',
    description: isZh
      ? `确定删除选中的 ${count} 份简历吗？此操作不可恢复。`
      : `Delete ${count} selected resume(s)? This cannot be undone.`,
    confirmText: isZh ? '删除' : 'Delete',
    cancelText: isZh ? '取消' : 'Cancel',
    variant: 'destructive',
  })
  if (!confirmed) return

  isBatchDeleting.value = true
  try {
    const result = await resumeStore.batchDeleteResumes([...selectedIds.value])
    if (result.success) {
      selectedIds.value = []
      toast.success(
        isZh
          ? `已删除 ${result.deletedCount} 份简历`
          : `${result.deletedCount} resume(s) deleted`,
      )
    } else {
      toast.error(isZh ? '批量删除失败，请稍后重试' : 'Batch delete failed, please try again')
    }
  } finally {
    isBatchDeleting.value = false
  }
}
</script>

<style scoped>
.page-stack--empty {
  flex: 1;
  min-height: calc(100vh - 10rem);
}

.resume-empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  min-height: min(36rem, calc(100vh - 12rem));
  padding: 3rem 1.75rem 3.5rem;
  border-radius: 1rem;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--card) / 0.82);
  box-shadow: 0 8px 30px hsl(var(--foreground) / 0.04);
}

.resume-empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  margin-bottom: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--muted) / 0.45);
}

.resume-empty-state__title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.resume-empty-state__desc {
  margin: 0 0 2rem;
  max-width: 24rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

.resume-empty-state__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 40rem;
}

@media (min-width: 640px) {
  .resume-empty-state {
    padding: 3.25rem 2.5rem 4rem;
  }

  .resume-empty-state__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.resume-empty-action {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  width: 100%;
  padding: 1.375rem 1.625rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid hsl(var(--border) / 0.7);
  background: hsl(var(--card));
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.resume-empty-action:hover {
  border-color: hsl(var(--primary) / 0.35);
  box-shadow: 0 10px 28px hsl(var(--foreground) / 0.06);
  transform: translateY(-2px);
}

.resume-empty-action--accent:hover {
  border-color: rgb(217 70 239 / 0.35);
}

.resume-empty-action__icon {
  flex-shrink: 0;
}

.resume-empty-action__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.resume-empty-action__hint {
  font-size: 0.75rem;
  line-height: 1.55;
  color: hsl(var(--muted-foreground));
}

.resume-empty-action__arrow {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  transition: color 0.2s ease, transform 0.2s ease;
}

.resume-empty-action:hover .resume-empty-action__arrow {
  color: hsl(var(--primary));
  transform: translateX(2px);
}

.resume-empty-action--accent:hover .resume-empty-action__arrow {
  color: rgb(217 70 239);
}

.resume-empty-state__tip {
  margin: 1.75rem 0 0;
  max-width: 28rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}
</style>
