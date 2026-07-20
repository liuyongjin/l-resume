<template>
  <div :class="['flex flex-wrap gap-2', containerClass]">
    <span 
      v-for="(skill, index) in skills" 
      :key="index"
      :class="[tagClass, theme.skillTagClass]"
      :style="{ 
        backgroundColor: theme.skillBgColor || theme.bgColor,
        color: theme.skillTextColor || theme.textColor,
        borderColor: theme.skillBorderColor || theme.borderColor || 'transparent'
      }"
    >
      {{ skill }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  skills: { type: Array, default: () => [] },
  theme: { 
    type: Object, 
    default: () => ({
      skillTagClass: 'px-3 py-1 rounded-full text-xs font-medium',
      skillBgColor: '#E0F2FE',
      skillTextColor: '#0369A1',
      skillBorderColor: 'transparent'
    })
  }
})

const containerClass = ''
const tagClass = ''
</script>
