<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('relative flex min-h-0 flex-col overflow-hidden', props.class)">
    <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
      <slot />
    </div>
  </div>
</template>
