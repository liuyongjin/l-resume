<template>
  <ul class="skill-bullets">
    <li v-for="(group, i) in normalizedGroups" :key="i" class="skill-bullets__item">
      <span class="skill-bullets__label" :style="{ color: accentColor }">{{ group.category }}：</span>
      <span class="skill-bullets__value" :style="{ color: bodyColor }">{{ group.items }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  groups?: Array<{ category?: string; items: string[] }>
  flatSkills?: string[]
  accentColor?: string
  bodyColor?: string
}>()

const normalizedGroups = computed(() => {
  if (props.groups?.length) {
    return props.groups.map((g, i) => ({
      category: g.category || `技能 ${i + 1}`,
      items: (g.items || []).join('、'),
    })).filter((g) => g.items)
  }
  if (props.flatSkills?.length) {
    return [{ category: '专业技能', items: props.flatSkills.join('、') }]
  }
  return []
})
</script>

<style scoped>
.skill-bullets {
  margin: 0;
  padding-left: 1rem;
  list-style: disc;
}

.skill-bullets__item {
  font-size: 11px;
  line-height: 1.7;
  margin-bottom: 0.2rem;
}

.skill-bullets__label {
  font-weight: 700;
}
</style>
