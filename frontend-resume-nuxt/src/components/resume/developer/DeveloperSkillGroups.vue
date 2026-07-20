<template>
  <div class="space-y-3.5">
    <template v-if="groups.length">
      <div v-for="(group, idx) in groups" :key="idx">
        <p
          v-if="group.category"
          class="text-[10px] font-medium uppercase tracking-wider mb-1.5"
          :style="{ color: mutedColor }"
        >
          {{ group.category }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(item, i) in group.items"
            :key="i"
            class="px-2 py-0.5 rounded-md text-[11px] font-medium"
            :style="{
              backgroundColor: tagBg,
              color: tagColor,
              border: `1px solid ${tagBorder}`,
            }"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </template>
    <div v-else class="flex flex-wrap gap-1.5">
      <span
        v-for="(skill, i) in flatSkills"
        :key="i"
        class="px-2 py-0.5 rounded-md text-[11px] font-medium"
        :style="{
          backgroundColor: tagBg,
          color: tagColor,
          border: `1px solid ${tagBorder}`,
        }"
      >
        {{ skill }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  groups?: Array<{ category?: string; items: string[] }>
  flatSkills?: string[]
  tagBg?: string
  tagColor?: string
  tagBorder?: string
  mutedColor?: string
}>()

const groups = computed(() =>
  (props.groups || []).filter((g) => g.items?.length)
)
</script>
