<template>
  <div class="space-y-3">
    <div v-for="proj in projects" :key="proj.id" class="p-3 rounded-lg border" :style="{ backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }">
      <div class="flex items-start justify-between mb-2">
        <div>
          <h4 class="font-medium text-sm" :style="{ color: '#1F2937' }">{{ proj.name }}</h4>
          <span class="text-xs" :style="{ color: '#059669' }">{{ proj.role }}</span>
        </div>
        <span class="text-xs" :style="{ color: '#9CA3AF' }">{{ proj.duration }}</span>
      </div>
      <p class="text-xs mb-2" :style="{ color: '#6B7280' }">{{ proj.description }}</p>
      <div class="flex flex-wrap gap-2">
        <div class="px-2 py-1 rounded text-xs" :style="{ backgroundColor: '#D1FAE5', color: '#059669' }">
          <span class="font-medium">指标：</span>{{ proj.metrics }}
        </div>
        <div class="px-2 py-1 rounded text-xs" :style="{ backgroundColor: '#D1FAE5', color: '#059669' }">
          <span class="font-medium">工具：</span>{{ proj.tools }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  projects: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
})
</script>