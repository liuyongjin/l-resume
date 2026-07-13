<script setup lang="ts">
import type { AlertDialogCancelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogCancel } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AlertDialogCancelProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AlertDialogCancel
    v-bind="delegatedProps"
    :class="cn(
      'mt-2 inline-flex h-9 items-center justify-center rounded-xl border-2 border-border bg-background px-5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
      props.class,
    )"
  >
    <slot />
  </AlertDialogCancel>
</template>
