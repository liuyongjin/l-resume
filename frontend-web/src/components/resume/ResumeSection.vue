<template>
  <div :class="['mb-6', containerClass]">
    <div :class="['flex items-center gap-2 mb-4', headerClass]">
      <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0']" :style="{ backgroundColor: effectivePrimaryColor + '20' }">
        <component :is="iconComponent" class="w-4 h-4" :style="{ color: effectivePrimaryColor }" />
      </div>
      <h2 :class="['font-bold', theme.sectionTitleClass]">{{ title }}</h2>
      <div :class="['h-px flex-1', theme.dividerClass]"></div>
    </div>
    <div :class="['space-y-4', contentClass]">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { h, computed } from 'vue'

const UserIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('path', { d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
    ])
  }
}

const BriefcaseIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('path', { d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  }
}

const GraduationCapIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('path', { d: 'M22 10v6m-6 6H6a2 2 0 01-2-2v-8a2 2 0 012-2h8a2 2 0 012 2v2m-6 0h8m-6 0l-1 10H5l1-10m6 0l1 10' })
    ])
  }
}

const CodeIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('polyline', { points: '16 18 22 12 16 6' }),
      h('polyline', { points: '8 6 2 12 8 18' })
    ])
  }
}

const FolderIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('path', { d: 'M22 19a6 6 0 01-6 6H6a6 6 0 01-6-6V5a6 6 0 016-6h10a6 6 0 016 6v14zm-9.5-3v-2h-5v2h5zm-2.5-5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm2.5 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z' })
    ])
  }
}

const StarIcon = {
  render() {
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '2' }, [
      h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
    ])
  }
}

const iconMap = {
  avatar: UserIcon,
  experience: BriefcaseIcon,
  education: GraduationCapIcon,
  skills: CodeIcon,
  projects: FolderIcon,
  summary: StarIcon
}

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'star' },
  theme: { 
    type: Object, 
    default: () => ({
      primaryColor: '#0EA5E9',
      sectionTitleClass: 'text-lg text-gray-900',
      dividerClass: 'bg-gray-200'
    })
  },
  primaryColor: { type: String, default: '' }
})

const effectivePrimaryColor = computed(() => {
  return props.primaryColor || props.theme.primaryColor || '#0EA5E9'
})

const iconComponent = computed(() => {
  return iconMap[props.icon] || StarIcon
})

const containerClass = 'bg-white'
const headerClass = ''
const contentClass = ''
</script>
