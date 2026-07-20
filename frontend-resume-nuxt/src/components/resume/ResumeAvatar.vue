<template>
  <div :class="rootClass">
    <div
      v-if="showAvatar"
      :class="['overflow-hidden flex-shrink-0', sizeClass, shapeClass]"
      :style="{ border: `${theme.borderWidth || '2px'} solid ${effectivePrimaryColor}` }"
    >
      <div
        :class="['w-full h-full flex items-center justify-center', bgClass]"
        :style="{ backgroundColor: effectivePrimaryColor + '18' }"
      >
        <svg
          v-if="!displaySrc"
          :class="iconClass"
          viewBox="0 0 24 24"
          fill="none"
          :stroke="effectivePrimaryColor"
          stroke-width="2"
        >
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <img v-else :src="displaySrc" :alt="alt || name" class="w-full h-full object-cover" />
      </div>
    </div>
    <div :class="infoClass">
      <h1 :class="['font-bold', theme.nameClass]">{{ name }}</h1>
      <p v-if="title" :class="['text-sm mt-0.5', theme.titleClass]" :style="{ color: effectivePrimaryColor }">{{ title }}</p>
      <div :class="['flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs', theme.metaClass, metaAlignClass]">
        <span v-if="location" class="flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ location }}
        </span>
        <span v-if="phone" class="flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {{ phone }}
        </span>
        <span v-if="email" class="flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {{ email }}
        </span>
        <span v-if="github" class="flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
          </svg>
          {{ githubLabel }}
        </span>
        <span v-if="homepage" class="flex items-center gap-1">
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          {{ homepageLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveAvatarUrl } from '~/utils/resumeTransform'

type AvatarVariant = 'horizontal' | 'centered'
type AvatarShape = 'rounded' | 'circle' | 'square'
type AvatarSize = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  name?: string
  title?: string
  location?: string
  phone?: string
  email?: string
  github?: string
  homepage?: string
  src?: string
  alt?: string
  showAvatar?: boolean
  variant?: AvatarVariant
  shape?: AvatarShape
  size?: AvatarSize
  theme?: {
    primaryColor?: string
    nameClass?: string
    titleClass?: string
    metaClass?: string
    borderWidth?: string
    variant?: AvatarVariant
    shape?: AvatarShape
    size?: AvatarSize
  }
  primaryColor?: string
}>(), {
  name: '',
  title: '',
  location: '',
  phone: '',
  email: '',
  github: '',
  homepage: '',
  src: '',
  alt: '',
  showAvatar: true,
  variant: 'horizontal',
  shape: 'rounded',
  size: 'md',
  theme: () => ({
    nameClass: 'text-xl text-gray-900',
    titleClass: 'text-gray-600',
    metaClass: 'text-gray-500',
    borderWidth: '2px',
  }),
  primaryColor: '',
})

const displaySrc = computed(() => resolveAvatarUrl(props.src))

const effectiveVariant = computed(() => props.theme?.variant || props.variant)
const effectiveShape = computed(() => props.theme?.shape || props.shape)
const effectiveSize = computed(() => props.theme?.size || props.size)

const effectivePrimaryColor = computed(() =>
  props.primaryColor || props.theme?.primaryColor || '#0EA5E9'
)

function shortenUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const githubLabel = computed(() => shortenUrl(props.github))
const homepageLabel = computed(() => shortenUrl(props.homepage))

const rootClass = computed(() => {
  if (effectiveVariant.value === 'centered') {
    return 'flex flex-col items-center text-center gap-4'
  }
  return 'flex items-center gap-5'
})

const infoClass = computed(() =>
  effectiveVariant.value === 'centered' ? 'w-full' : 'flex-1 min-w-0'
)

const metaAlignClass = computed(() =>
  effectiveVariant.value === 'centered' ? 'justify-center' : ''
)

const sizeMap: Record<AvatarSize, string> = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
}

const shapeMap: Record<AvatarShape, string> = {
  rounded: 'rounded-lg',
  circle: 'rounded-full',
  square: 'rounded-none',
}

const sizeClass = computed(() => sizeMap[effectiveSize.value])
const shapeClass = computed(() => shapeMap[effectiveShape.value])

const iconClass = computed(() => {
  const ratio = effectiveSize.value === 'lg' ? 'w-2/5 h-2/5' : 'w-1/2 h-1/2'
  return ratio
})

const bgClass = 'bg-gray-50'
</script>
