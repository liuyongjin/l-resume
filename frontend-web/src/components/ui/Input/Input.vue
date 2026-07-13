<script setup lang="ts">
import { computed } from 'vue'
import { cn } from "@/lib/utils"

interface Props {
  type?: string
  modelValue?: string | number
  value?: string | number
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  class: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputValue = computed({
  get: () => props.modelValue ?? props.value ?? '',
  set: (val: string | number) => emit('update:modelValue', val)
})
</script>

<template>
  <input
    :type="type"
    :value="inputValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="inputValue = ($event.target as HTMLInputElement).value"
    :class="cn(
      'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    v-bind="$attrs"
  />
</template>
