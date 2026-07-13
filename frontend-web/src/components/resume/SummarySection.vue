<template>
  <div :class="['p-4 rounded-lg', containerClass]" :style="{ backgroundColor: theme.bgColor }">
    <p :class="['text-sm leading-relaxed', theme.textClass]">{{ summary }}</p>
  </div>
</template>

<script setup>
defineProps({
  summary: { type: String, default: '' },
  theme: { 
    type: Object, 
    default: () => ({
      bgColor: '#F8FAFC',
      textClass: 'text-gray-600'
    })
  }
})

const containerClass = ''
</script>
