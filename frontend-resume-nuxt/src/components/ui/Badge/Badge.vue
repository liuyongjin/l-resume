<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const getVariantClass = (variant: string) => {
  switch (variant) {
    case 'secondary':
      return 'border-transparent bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
    case 'destructive':
      return 'border-transparent bg-destructive/10 text-destructive'
    case 'outline':
      return 'border-border bg-transparent text-foreground'
    default:
      return 'border-transparent bg-primary text-primary-foreground'
  }
}
</script>

<template>
  <div
    :class="cn(
      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      getVariantClass(props.variant),
      props.class
    )"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
