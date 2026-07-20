<template>
  <h3
    class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] mb-3"
    :style="{ color: accentColor }"
  >
    <span
      class="inline-block w-1 h-3.5 rounded-full shrink-0"
      :style="{ backgroundColor: accentColor }"
    />
    <span>{{ title }}</span>
  </h3>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  accentColor?: string
}>()
</script>
