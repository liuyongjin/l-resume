<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    variant?: 'ring' | 'icon'
  }>(),
  { variant: 'ring' }
)
</script>

<template>
  <div
    v-if="variant === 'ring'"
    role="status"
    aria-label="Loading"
    :class="cn('inline-block rounded-full border-[1.5px] border-current border-t-transparent animate-spin', props.class)"
  />
  <svg
    v-else
    role="status"
    aria-label="Loading"
    :class="cn('animate-spin', props.class)"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      class="opacity-20"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
</template>
