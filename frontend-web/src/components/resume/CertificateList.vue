<template>
  <div class="space-y-3">
    <div v-for="cert in certificates" :key="cert.id" class="p-3 rounded-lg border" :style="{ backgroundColor: bgColor, borderColor: borderColor }">
      <div class="flex items-start justify-between mb-1">
        <h4 class="font-medium text-sm" :style="{ color: titleColor }">{{ cert.name }}</h4>
        <span class="text-xs" :style="{ color: dateColor }">{{ cert.date }}</span>
      </div>
      <p class="text-xs" :style="{ color: subtitleColor }">{{ cert.issuer }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  certificates: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
  primaryColor: { type: String, default: '#3B82F6' }
})

const bgColor = 'transparent'
const borderColor = '#E5E7EB'
const titleColor = '#1F2937'
const subtitleColor = '#6B7280'
const dateColor = '#9CA3AF'
</script>