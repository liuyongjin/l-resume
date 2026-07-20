<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Check, Minus } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

type CheckedState = boolean | 'indeterminate'

const props = withDefaults(defineProps<{
  modelValue?: CheckedState
  checked?: CheckedState
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: CheckedState]
  'update:checked': [value: CheckedState]
}>()

const checked = computed<CheckedState>({
  get: () => props.modelValue ?? props.checked ?? false,
  set: (value) => {
    emit('update:modelValue', value)
    emit('update:checked', value)
  },
})
</script>

<template>
  <CheckboxRoot
    v-model="checked"
    :disabled="disabled"
    :class="cn(
      'peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
      props.class,
    )"
  >
    <CheckboxIndicator class="grid place-content-center text-current">
      <Check v-if="checked === true" class="size-3.5" />
      <Minus v-else-if="checked === 'indeterminate'" class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
