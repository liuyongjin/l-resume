<template>
  <h2 class="section-badge-title" :style="{ backgroundColor: bgColor, color: textColor }">
    {{ title }}
  </h2>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  bgColor?: string
  textColor?: string
}>(), {
  bgColor: '#111827',
  textColor: '#ffffff',
})
</script>

<style scoped>
.section-badge-title {
  display: inline-block;
  margin: 0 0 0.65rem;
  padding: 0.28rem 0.65rem;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
}
</style>
