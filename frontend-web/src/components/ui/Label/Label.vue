<script setup lang="ts">
import { cn } from "@/lib/utils"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <label :class="cn('text-xs font-medium leading-none text-foreground/80', props.class)" v-bind="$attrs">
    <slot />
  </label>
</template>
