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
  <div
    v-show="props.active"
    :class="cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class)"
    role="tabpanel"
  >
    <slot />
  </div>
</template>
