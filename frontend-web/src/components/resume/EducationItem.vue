<template>
  <div :class="['flex items-start justify-between', itemClass]">
    <div>
      <h3 :class="['font-semibold', theme.titleClass]">{{ school }}</h3>
      <p :class="['text-sm', theme.subtitleClass]" :style="accentColor ? { color: accentColor } : undefined">{{ degree }} · {{ major }}</p>
      <p v-if="gpa" :class="['text-xs', theme.gpaClass]">GPA: {{ gpa }}</p>
    </div>
    <span :class="['text-xs', theme.dateClass]">{{ duration }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  school: { type: String, default: '' },
  degree: { type: String, default: '' },
  major: { type: String, default: '' },
  gpa: { type: String, default: '' },
  duration: { type: String, default: '' },
  theme: { 
    type: Object, 
    default: () => ({
      titleClass: 'text-gray-900',
      subtitleClass: 'text-gray-600',
      gpaClass: 'text-gray-500',
      dateClass: 'text-gray-500'
    })
  },
  primaryColor: { type: String, default: '' },
})

const accentColor = computed(() => props.primaryColor || props.theme.primaryColor || '')

const itemClass = 'pb-4 last:pb-0'
</script>
