<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    icon: LucideIcon
    size?: 'sm' | 'md' | 'lg'
    variant?: 'primary' | 'muted' | 'fuchsia' | 'emerald' | 'amber' | 'sky' | 'pink'
    class?: string
  }>(),
  { size: 'md', variant: 'primary' },
)

const boxSizeMap = {
  sm: 'size-9 rounded-lg',
  md: 'size-10 rounded-xl',
  lg: 'size-12 rounded-xl',
} as const

const iconSizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
}

const variantMap = {
  primary: 'bg-primary/10 text-primary group-hover:bg-primary/15',
  muted: 'bg-muted/60 text-muted-foreground',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-600 group-hover:bg-fuchsia-500/15',
  emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/15',
  amber: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/15',
  sky: 'bg-sky-500/10 text-sky-600 group-hover:bg-sky-500/15',
  pink: 'bg-pink-500/10 text-pink-600 group-hover:bg-pink-500/15',
} as const
</script>

<template>
  <div
    :class="cn(
      'flex items-center justify-center shrink-0 transition-colors',
      boxSizeMap[size],
      variantMap[variant],
      props.class,
    )"
  >
    <AppIcon :icon="icon" :size="iconSizeMap[size]" />
  </div>
</template>
