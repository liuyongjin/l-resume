<template>
  <ul :class="['resume-contact', `resume-contact--${variant}`]">
    <li v-for="item in visibleItems" :key="item.key" class="resume-contact__item">
      <component :is="item.icon" class="resume-contact__icon" :style="{ color: iconColor }" />
      <a
        v-if="item.href"
        :href="item.href"
        target="_blank"
        rel="noopener noreferrer"
        class="resume-contact__text resume-contact__link"
      >{{ item.label }}</a>
      <span v-else class="resume-contact__text">{{ item.label }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Briefcase, Calendar, Globe, Mail, MapPin, Phone } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  phone?: string
  email?: string
  location?: string
  title?: string
  github?: string
  homepage?: string
  workExperience?: string
  currentStatus?: string
  variant?: 'sidebar' | 'header'
  iconColor?: string
  textColor?: string
}>(), {
  variant: 'sidebar',
  iconColor: 'currentColor',
  textColor: 'inherit',
})

const visibleItems = computed(() => {
  const items: Array<{ key: string; label: string; href?: string; icon: typeof Phone }> = []
  if (props.currentStatus) {
    items.push({ key: 'status', label: props.currentStatus, icon: Briefcase })
  }
  if (props.workExperience) {
    items.push({ key: 'exp', label: props.workExperience, icon: Calendar })
  }
  if (props.email) {
    items.push({ key: 'email', label: props.email, icon: Mail })
  }
  if (props.phone) {
    items.push({ key: 'phone', label: props.phone, icon: Phone })
  }
  if (props.location) {
    items.push({ key: 'location', label: props.location, icon: MapPin })
  }
  if (props.github) {
    items.push({ key: 'github', label: props.github.replace(/^https?:\/\//, ''), href: props.github, icon: Globe })
  }
  if (props.homepage) {
    items.push({ key: 'homepage', label: props.homepage.replace(/^https?:\/\//, ''), href: props.homepage, icon: Globe })
  }
  return items
})
</script>

<style scoped>
.resume-contact {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.resume-contact--header {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 1rem;
}

.resume-contact__item {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 10px;
  line-height: 1.45;
  color: v-bind(textColor);
}

.resume-contact__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0.9;
}

.resume-contact__text {
  min-width: 0;
  word-break: break-all;
}

.resume-contact__link {
  text-decoration: none;
  color: inherit;
}

.resume-contact__link:hover {
  text-decoration: underline;
}
</style>
