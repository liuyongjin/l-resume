<template>
  <article class="timeline-entry">
    <div class="timeline-entry__header">
      <span class="timeline-entry__title" :style="{ color: titleColor }">{{ title }}</span>
      <span
        v-if="subtitle"
        class="timeline-entry__subtitle"
        :style="{ color: accentColor || '#374151' }"
      >{{ subtitle }}</span>
      <span v-if="duration" class="timeline-entry__date" :style="{ color: mutedColor }">{{ duration }}</span>
    </div>
    <ul v-if="bullets.length" class="timeline-entry__list" :style="{ color: accentColor || '#374151' }">
      <li
        v-for="(item, i) in bullets"
        :key="i"
        class="timeline-entry__item"
        :style="{ color: bodyColor }"
      >
        {{ item }}
      </li>
    </ul>
    <p v-if="metrics" class="timeline-entry__metrics" :style="{ color: accentColor }">
      <span class="timeline-entry__metrics-label">核心指标：</span>{{ metrics }}
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  duration?: string
  bullets?: string[]
  metrics?: string
  accentColor?: string
  titleColor?: string
  bodyColor?: string
  mutedColor?: string
}>()
</script>

<style scoped>
.timeline-entry {
  margin-bottom: 0.9rem;
}

.timeline-entry:last-child {
  margin-bottom: 0;
}

.timeline-entry__header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: baseline;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.timeline-entry__title {
  font-size: 12px;
  font-weight: 700;
  text-align: left;
}

.timeline-entry__subtitle {
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.timeline-entry__date {
  font-size: 10px;
  white-space: nowrap;
  text-align: right;
}

.timeline-entry__list {
  margin: 0;
  padding-left: 1rem;
  list-style: disc;
}

.timeline-entry__item {
  font-size: 11px;
  line-height: 1.65;
  margin-bottom: 0.12rem;
}

.timeline-entry__metrics {
  margin: 0.35rem 0 0 1rem;
  font-size: 10px;
}

.timeline-entry__metrics-label {
  font-weight: 600;
}
</style>
