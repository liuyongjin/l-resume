<template>
  <article
    class="rounded-lg px-3.5 py-3"
    :style="{
      backgroundColor: cardBg,
      border: `1px solid ${borderColor}`,
    }"
  >
    <div class="flex items-start justify-between gap-2 mb-1">
      <h4 class="text-sm font-semibold leading-snug" :style="{ color: titleColor }">
        {{ name }}
      </h4>
      <span v-if="duration" class="text-[10px] shrink-0 tabular-nums" :style="{ color: mutedColor }">
        {{ duration }}
      </span>
    </div>
    <p v-if="role" class="text-[11px] mb-2" :style="{ color: accentColor }">{{ role }}</p>
    <ul v-if="bullets.length" class="space-y-1">
      <li
        v-for="(line, i) in bullets"
        :key="i"
        class="text-[11px] leading-relaxed pl-3 relative"
        :style="{ color: bodyColor }"
      >
        <span
          class="absolute left-0 top-[0.45em] w-1 h-1 rounded-full"
          :style="{ backgroundColor: accentColor }"
        />
        {{ line }}
      </li>
    </ul>
    <p v-else-if="description" class="text-[11px] leading-relaxed" :style="{ color: bodyColor }">
      {{ description }}
    </p>
    <div v-if="techStack?.length" class="flex flex-wrap gap-1 mt-2">
      <span
        v-for="(tech, i) in techStack"
        :key="i"
        class="text-[10px] px-1.5 py-0.5 rounded"
        :style="{ backgroundColor: chipBg, color: mutedColor }"
      >
        {{ tech }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name?: string
  role?: string
  duration?: string
  description?: string
  highlights?: string[]
  techStack?: string[]
  cardBg?: string
  borderColor?: string
  titleColor?: string
  bodyColor?: string
  mutedColor?: string
  accentColor?: string
  chipBg?: string
}>()

const bullets = computed(() => {
  if (props.highlights?.length) return props.highlights
  if (!props.description) return []
  return props.description.split('\n').map((s) => s.trim()).filter(Boolean)
})
</script>
