<script setup lang="ts">
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <div :class="cn('px-6 pt-6 pb-6 sm:px-7 sm:pt-7 sm:pb-7', props.class)">
    <slot />
  </div>
</template>
