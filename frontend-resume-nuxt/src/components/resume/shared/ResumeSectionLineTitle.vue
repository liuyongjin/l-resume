<template>
  <div class="section-line-title">
    <h2 class="section-line-title__text" :style="{ color: accentColor || '#111827' }">{{ title }}</h2>
    <div class="section-line-title__rule" :style="{ background: ruleColor }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  accentColor?: string
}>()

const ruleColor = computed(() => props.accentColor || '#d1d5db')
</script>

<style scoped>
.section-line-title {
  margin-bottom: 0.6rem;
}

.section-line-title__text {
  margin: 0 0 0.3rem;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.section-line-title__rule {
  height: 1px;
  width: 100%;
}
</style>
