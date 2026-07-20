<template>
  <div class="space-y-2">
    <div v-for="pub in publications" :key="pub.id" class="flex items-start gap-3 p-2 rounded" :style="{ backgroundColor: '#F5F3FF' }">
      <div class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ backgroundColor: '#8B5CF6' }">
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-sm" :style="{ color: '#1F2937' }">{{ pub.title }}</h4>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-xs" :style="{ color: '#7C3AED' }">{{ pub.journal }}</span>
          <span class="text-xs" :style="{ color: '#9CA3AF' }">{{ pub.year }}</span>
          <span v-if="pub.citations" class="text-xs" :style="{ color: '#6B7280' }">引用: {{ pub.citations }}</span>
        </div>
        <p v-if="pub.doi" class="text-xs" :style="{ color: '#9CA3AF' }">DOI: {{ pub.doi }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  publications: { type: Array, default: () => [] },
  theme: { type: Object, default: () => ({}) },
})
</script>