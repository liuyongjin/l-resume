<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { GripVertical } from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'
import type { EditorSectionMeta } from '~/utils/resumeEditSections'

const props = defineProps<{
  sections: EditorSectionMeta[]
  activeSection: string
  hiddenSections: string[]
  isSectionVisible: (editorKey: string, hidden: string[]) => boolean
}>()

const emit = defineEmits<{
  'update:activeSection': [key: string]
  reorder: [sections: EditorSectionMeta[]]
  scroll: [event: Event]
}>()

function sectionKeys(sections: EditorSectionMeta[]) {
  return sections.map((s) => s.key).join('\0')
}

/** 本地列表，避免 vuedraggable 与 props 双向绑定引发递归更新 */
const dragList = ref<EditorSectionMeta[]>([...props.sections])

watch(
  () => props.sections,
  (next) => {
    if (sectionKeys(next) !== sectionKeys(dragList.value)) {
      dragList.value = [...next]
    }
  },
  { deep: true },
)

function onDragEnd() {
  if (sectionKeys(dragList.value) === sectionKeys(props.sections)) return
  emit('reorder', [...dragList.value])
}

function selectSection(key: string) {
  emit('update:activeSection', key)
}
</script>

<template>
  <nav class="editor-section-nav" @scroll="emit('scroll', $event)">
    <draggable
      v-model="dragList"
      item-key="key"
      handle=".section-drag-handle"
      animation="180"
      class="editor-section-nav__list"
      @end="onDragEnd"
    >
      <template #item="{ element: section }">
        <div class="editor-section-nav__row">
          <button
            type="button"
            class="section-drag-handle editor-section-nav__drag"
            aria-label="拖动调整区块顺序"
            @click.stop
          >
            <AppIcon :icon="GripVertical" size="xs" />
          </button>
          <button
            type="button"
            class="editor-section-nav__item"
            :class="{
              'editor-section-nav__item--active': activeSection === section.key,
              'editor-section-nav__item--hidden': !isSectionVisible(section.key, hiddenSections),
            }"
            @click="selectSection(section.key)"
          >
            <AppIcon :icon="section.icon" size="lg" />
            <span class="editor-section-nav__label">{{ section.label }}</span>
          </button>
        </div>
      </template>
    </draggable>
  </nav>
</template>
