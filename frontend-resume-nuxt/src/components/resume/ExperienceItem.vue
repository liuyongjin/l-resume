<template>
  <div :class="['relative pl-6', itemClass]">
    <div :class="['absolute left-0 top-1 w-3 h-3 rounded-full', dotClass]" :style="{ backgroundColor: effectivePrimaryColor }"></div>
    <div :class="['absolute left-1.5 top-4 bottom-0 w-0.5', lineClass]" :style="{ backgroundColor: effectivePrimaryColor + '40' }"></div>
    
    <div :class="['flex items-start justify-between mb-1', headerClass]">
      <div>
        <h3 :class="['font-semibold', theme.titleClass]">{{ company }}</h3>
        <p :class="['text-sm', theme.subtitleClass]" :style="{ color: effectivePrimaryColor }">{{ position }}</p>
      </div>
      <span :class="['text-xs', theme.dateClass]">{{ duration }}</span>
    </div>
    
    <p v-if="description" :class="['text-sm leading-relaxed', theme.descriptionClass]">{{ description }}</p>
    
    <div v-if="achievements && achievements.length" :class="['mt-3 space-y-1.5']">
      <ul :class="['space-y-1 list-disc list-inside']">
        <li v-for="(achievement, index) in achievements" :key="index" :class="['text-xs', theme.achievementClass]">
          {{ achievement }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  company: { type: String, default: '' },
  position: { type: String, default: '' },
  duration: { type: String, default: '' },
  description: { type: String, default: '' },
  achievements: { type: Array, default: () => [] },
  theme: { 
    type: Object, 
    default: () => ({
      primaryColor: '#0EA5E9',
      titleClass: 'text-gray-900',
      subtitleClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      achievementClass: 'text-gray-500'
    })
  },
  primaryColor: { type: String, default: '' }
})

const effectivePrimaryColor = computed(() => {
  return props.primaryColor || props.theme.primaryColor || '#0EA5E9'
})

const itemClass = 'pb-4 last:pb-0'
const dotClass = ''
const lineClass = 'last:hidden'
const headerClass = ''
</script>
