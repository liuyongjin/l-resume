<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

interface Props {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '加载中...',
  size: 'md'
})

const sizeClass = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6'
}
</script>

<template>
  <div :class="cn('flex flex-col items-center justify-center gap-2.5', props.class)">
    <Spinner variant="ring" :class="cn('text-primary', sizeClass[props.size])" />
    <p v-if="props.text" class="text-xs text-muted-foreground tracking-wide">{{ props.text }}</p>
  </div>
</template>
