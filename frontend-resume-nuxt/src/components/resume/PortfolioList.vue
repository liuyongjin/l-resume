<template>
  <div class="grid grid-cols-2 gap-3">
    <div v-for="item in items" :key="item.id" class="p-3 rounded-lg border" :style="{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }">
      <div class="flex items-center gap-2 mb-2">
        <span class="px-2 py-0.5 text-xs rounded-full" :style="{ backgroundColor: '#EC4899', color: '#fff' }">{{ item.type }}</span>
        <span class="text-xs" :style="{ color: '#BE185D' }">{{ item.type }}</span>
      </div>
      <h4 class="font-medium text-sm" :style="{ color: '#1F2937' }">{{ item.name }}</h4>
      <p class="text-xs mt-1" :style="{ color: '#6B7280' }">{{ item.description }}</p>
      <a v-if="item.url" :href="item.url" target="_blank" class="text-xs mt-1 inline-block" :style="{ color: '#EC4899' }">查看作品 →</a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
})
</script>