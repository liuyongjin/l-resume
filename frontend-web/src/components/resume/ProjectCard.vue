<template>
  <div :class="['p-4 rounded-lg', cardClass]" :style="{ backgroundColor: theme.cardBgColor }">
    <div :class="['flex items-start justify-between mb-2', headerClass]">
      <h3 :class="['font-semibold', theme.titleClass]">{{ name }}</h3>
      <span :class="['text-xs', theme.roleClass]" :style="accentColor ? { color: accentColor } : undefined">{{ role }}</span>
    </div>
    <p :class="['text-sm', theme.descriptionClass]">{{ description }}</p>
    <div :class="['flex items-center gap-2 mt-3']">
      <span :class="['text-xs', theme.dateClass]">{{ duration }}</span>
      <span v-if="techStack && techStack.length" :class="['text-xs', theme.techClass]">
        {{ techStack.join(' / ') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  role: { type: String, default: '' },
  description: { type: String, default: '' },
  duration: { type: String, default: '' },
  techStack: { type: Array, default: () => [] },
  theme: { 
    type: Object, 
    default: () => ({
      cardBgColor: '#F8FAFC',
      titleClass: 'text-gray-900',
      roleClass: 'text-gray-500',
      descriptionClass: 'text-gray-600',
      dateClass: 'text-gray-500',
      techClass: 'text-gray-500'
    })
  },
  primaryColor: { type: String, default: '' },
})

const accentColor = computed(() => props.primaryColor || props.theme.primaryColor || '')

const cardClass = ''
const headerClass = ''
</script>
