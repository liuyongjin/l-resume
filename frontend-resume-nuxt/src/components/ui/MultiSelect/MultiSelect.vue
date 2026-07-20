<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  label: string
  value: string | number
  primaryColor?: string
}

interface Props {
  modelValue?: (string | number)[]
  options?: MultiSelectOption[]
  placeholder?: string
  disabled?: boolean
  max?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  options: () => [],
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  'max-exceeded': []
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

onClickOutside(rootRef, () => {
  open.value = false
})

const selectedSet = computed(() => new Set(props.modelValue))

const displayText = computed(() => {
  if (!props.modelValue.length) return props.placeholder || '请选择'
  const labels = props.modelValue
    .map((v) => props.options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[]
  if (labels.length <= 2) return labels.join('、')
  return `已选 ${props.modelValue.length} 项`
})

const toggleOpen = () => {
  if (props.disabled) return
  open.value = !open.value
}

const toggleOption = (value: string | number) => {
  const current = [...props.modelValue]
  const idx = current.indexOf(value)
  if (idx >= 0) {
    emit('update:modelValue', current.filter((v) => v !== value))
    return
  }
  if (props.max != null && current.length >= props.max) {
    emit('max-exceeded')
    return
  }
  emit('update:modelValue', [...current, value])
}

const isSelected = (value: string | number) => selectedSet.value.has(value)
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      :disabled="disabled"
      :class="cn(
        'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input/70 bg-muted/30 px-3 py-1.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 focus:bg-background disabled:cursor-not-allowed disabled:opacity-50',
        open && 'ring-2 ring-ring/30 border-primary/50 bg-background',
        props.class,
      )"
      @click="toggleOpen"
    >
      <span
        class="min-w-0 flex-1 truncate"
        :class="modelValue.length ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ displayText }}
      </span>
      <ChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-if="open"
      class="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto overflow-hidden rounded-lg border border-border bg-popover shadow-md"
    >
      <button
        v-for="opt in options"
        :key="String(opt.value)"
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
        :class="isSelected(opt.value) ? 'bg-primary/5 text-primary' : 'text-foreground'"
        @click="toggleOption(opt.value)"
      >
        <span
          class="flex size-4 shrink-0 items-center justify-center rounded-sm border"
          :class="isSelected(opt.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
        >
          <Check v-if="isSelected(opt.value)" class="size-3" />
        </span>
        <span
          v-if="opt.primaryColor"
          class="size-2 rounded-full shrink-0"
          :style="{ backgroundColor: opt.primaryColor }"
        />
        <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
      </button>
      <p v-if="options.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
        暂无可选项
      </p>
    </div>
  </div>
</template>
