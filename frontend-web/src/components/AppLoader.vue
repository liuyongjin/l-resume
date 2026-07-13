<template>
  <Transition name="loader-fade">
    <div
      v-if="loading"
      class="fixed inset-0 z-[9999] pointer-events-auto"
      aria-live="polite"
      aria-busy="true"
    >
      <!-- Top progress bar -->
      <div class="absolute top-0 inset-x-0 h-[2px] overflow-hidden bg-border/50">
        <div class="loader-bar h-full w-[35%] rounded-full bg-primary animate-loader-bar" />
      </div>

      <!-- Light backdrop -->
      <div class="absolute inset-0 bg-background/70 backdrop-blur-[3px]" />

      <!-- Center spinner -->
      <div class="absolute inset-0 flex items-center justify-center">
        <LoadingState :text="text" size="md" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import LoadingState from '@/components/ui/LoadingState.vue'

defineProps<{
  loading: boolean
  text?: string
}>()
</script>

<style scoped>
.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
  visibility: hidden;
}
</style>
