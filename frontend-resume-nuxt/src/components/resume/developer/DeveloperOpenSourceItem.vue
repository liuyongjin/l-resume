<template>
  <a
    :href="repoHref"
    target="_blank"
    rel="noopener noreferrer"
    class="block rounded-lg px-3 py-2.5 transition-colors"
    :style="{
      backgroundColor: cardBg,
      border: `1px solid ${borderColor}`,
    }"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-xs font-medium leading-snug" :style="{ color: titleColor }">{{ name }}</span>
      <span v-if="stars" class="text-[10px] shrink-0 tabular-nums" :style="{ color: accentColor }">★ {{ stars }}</span>
    </div>
    <p v-if="repo" class="text-[10px] mt-0.5 truncate" :style="{ color: accentColor }">{{ repoLabel }}</p>
    <p v-if="description" class="text-[10px] mt-1 leading-relaxed line-clamp-2" :style="{ color: bodyColor }">
      {{ description }}
    </p>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name?: string
  repo?: string
  stars?: string
  description?: string
  role?: string
  cardBg?: string
  borderColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
}>()

const repoHref = computed(() => {
  if (!props.repo) return undefined
  return props.repo.startsWith('http') ? props.repo : `https://${props.repo.replace(/^\/\//, '')}`
})

const repoLabel = computed(() => {
  if (!props.repo) return ''
  return props.repo.replace(/^https?:\/\//, '')
})
</script>
