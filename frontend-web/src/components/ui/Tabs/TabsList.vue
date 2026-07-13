<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('inline-flex h-9 items-center justify-center rounded-lg bg-muted/50 p-0.5 text-muted-foreground', props.class)"
    role="tablist"
  >
    <slot />
  </div>
</template>
