<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  value?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textValue = computed({
  get: () => props.modelValue ?? props.value ?? '',
  set: (val: string) => emit('update:modelValue', val),
})
</script>

<template>
  <textarea
    :value="textValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :class="cn(
      'flex min-h-[72px] w-full rounded-lg border border-input/70 bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @input="textValue = ($event.target as HTMLTextAreaElement).value"
  />
</template>
