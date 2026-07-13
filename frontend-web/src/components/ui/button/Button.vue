<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default'
})

const getVariantClass = (variant: string) => {
  switch (variant) {
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    case 'outline':
      return 'border-2 border-border bg-background text-text-secondary hover:border-primary hover:text-primary'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
    case 'ghost':
      return 'text-text-secondary hover:bg-muted hover:text-foreground'
    case 'link':
      return 'text-primary underline-offset-4 hover:underline'
    default:
      return 'bg-primary text-primary-foreground shadow-md hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
  }
}

const getSizeClass = (size: string) => {
  switch (size) {
    case 'sm':
      return 'h-9 rounded-lg px-4 text-sm min-h-[36px]'
    case 'lg':
      return 'h-auto rounded-2xl px-8 py-4 text-sm min-h-[44px] shadow-lg'
    case 'icon':
      return 'size-9 rounded-lg'
    default:
      return 'h-9 rounded-xl px-5 text-sm'
  }
}
</script>

<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      getVariantClass(props.variant),
      getSizeClass(props.size),
      props.class
    )"
  >
    <slot />
  </button>
</template>
