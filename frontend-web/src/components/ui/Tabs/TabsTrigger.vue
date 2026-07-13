<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  active?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  active: false
})
</script>

<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50',
      props.active ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
      props.class
    )"
    role="tab"
    :aria-selected="props.active"
  >
    <slot />
  </button>
</template>
