<template>
  <div class="space-y-3">
    <div v-for="item in achievements" :key="item.id" class="p-3 rounded-lg border" :style="{ backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }">
      <div class="flex items-start justify-between mb-2">
        <div>
          <h4 class="font-medium text-sm" :style="{ color: '#1F2937' }">{{ item.name }}</h4>
          <span class="text-xs" :style="{ color: '#D97706' }">{{ item.role }}</span>
        </div>
        <span class="text-xs" :style="{ color: '#9CA3AF' }">{{ item.duration }}</span>
      </div>
      <p class="text-xs mb-2" :style="{ color: '#6B7280' }">{{ item.description }}</p>
      <div class="px-2 py-1.5 rounded text-xs" :style="{ backgroundColor: '#FEF3C7', color: '#D97706' }">
        <span class="font-medium">核心指标：</span>{{ item.metrics }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  achievements: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
})
</script>