<script setup lang="ts">
interface Props {
  title: string
  description?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="['page-header reveal is-visible', props.class]">
    <div class="min-w-0 flex-1">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
