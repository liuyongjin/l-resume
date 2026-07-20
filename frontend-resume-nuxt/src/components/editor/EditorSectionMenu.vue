<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Eye, EyeOff, MoreHorizontal, Plus } from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'
import { Button } from '~/components/ui/button'

const props = withDefaults(
  defineProps<{
    visible: boolean
    showAdd?: boolean
    addLabel?: string
  }>(),
  {
    showAdd: false,
    addLabel: '添加',
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  add: []
}>()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  open.value = false
})

function toggleVisibility() {
  emit('update:visible', !props.visible)
  open.value = false
}

function handleAdd() {
  emit('add')
  open.value = false
}
</script>

<template>
  <div ref="menuRef" class="editor-section-menu">
    <Button
      type="button"
      variant="outline"
      size="icon"
      class="editor-section-menu__trigger shrink-0 size-9"
      :class="{ 'editor-section-menu__trigger--muted': !visible }"
      title="区块选项"
      aria-label="区块选项"
      @click="open = !open"
    >
      <AppIcon :icon="MoreHorizontal" size="sm" />
    </Button>
    <div v-if="open" class="editor-section-menu__dropdown">
      <button v-if="showAdd" type="button" class="editor-section-menu__item" @click="handleAdd">
        <AppIcon :icon="Plus" size="sm" />
        <span>{{ addLabel }}</span>
      </button>
      <button type="button" class="editor-section-menu__item" @click="toggleVisibility">
        <AppIcon :icon="visible ? EyeOff : Eye" size="sm" />
        <span>{{ visible ? '从简历预览中隐藏' : '在简历预览中显示' }}</span>
      </button>
      <slot name="items" />
    </div>
  </div>
</template>
