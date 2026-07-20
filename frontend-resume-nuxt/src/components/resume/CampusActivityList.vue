<template>
  <div class="space-y-3">
    <div v-for="act in activities" :key="act.id" class="relative pl-4 border-l-2" :style="{ borderColor: primaryColor }">
      <div class="absolute left-[-5px] top-1 w-2 h-2 rounded-full" :style="{ backgroundColor: primaryColor }"></div>
      <h4 class="font-medium text-sm" :style="{ color: '#1F2937' }">{{ act.name }}</h4>
      <p class="text-xs" :style="{ color: primaryColor }">{{ act.role }}</p>
      <p class="text-xs mt-0.5" :style="{ color: '#9CA3AF' }">{{ act.duration }}</p>
      <p class="text-xs mt-1" :style="{ color: '#6B7280' }">{{ act.description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activities: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
  primaryColor: { type: String, default: '#3B82F6' }
})
</script>