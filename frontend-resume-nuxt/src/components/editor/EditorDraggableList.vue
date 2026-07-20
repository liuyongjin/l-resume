<script setup lang="ts">
import draggable from 'vuedraggable'
import { GripVertical } from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'

defineProps<{
  itemKey?: string
  itemLabel?: string
}>()

const list = defineModel<any[]>({ required: true })
</script>

<template>
  <draggable
    v-model="list"
    :item-key="itemKey || 'id'"
    handle=".drag-handle"
    animation="180"
    class="editor-draggable-list"
  >
    <template #item="{ element, index }">
      <div class="editor-form-card">
        <div class="editor-form-card__toolbar">
          <button
            type="button"
            class="drag-handle flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label="拖动排序"
          >
            <AppIcon :icon="GripVertical" size="sm" />
          </button>
          <span class="text-xs text-muted-foreground truncate">
            {{ itemLabel || '条目' }} {{ index + 1 }}
          </span>
        </div>
        <div class="editor-form-card__body">
          <slot :item="element" :index="index" />
        </div>
      </div>
    </template>
  </draggable>
</template>
