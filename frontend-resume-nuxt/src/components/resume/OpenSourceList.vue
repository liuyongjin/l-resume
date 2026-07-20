<template>
  <div class="space-y-2">
    <div v-for="os in contributions" :key="os.id" class="p-3 rounded-lg border" :style="{ backgroundColor: '#1E293B', borderColor: '#334155' }">
      <div class="flex items-start justify-between mb-1">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <h4 class="font-mono font-medium text-sm text-white">{{ os.name }}</h4>
        </div>
        <span class="text-xs text-yellow-400">★ {{ os.stars }}</span>
      </div>
      <p class="text-xs font-mono text-sky-400 mb-1">{{ os.repo }}</p>
      <p class="text-xs text-gray-400">{{ os.description }}</p>
      <span class="text-xs text-gray-500 mt-1 inline-block">{{ os.role }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  contributions: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
})
</script>