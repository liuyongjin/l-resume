<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    icon: LucideIcon
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    class?: string
  }>(),
  { size: 'md' },
)

const sizeMap = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-6',
} as const
</script>

<template>
  <component :is="icon" :class="cn(sizeMap[size], 'shrink-0', props.class)" aria-hidden="true" />
</template>
