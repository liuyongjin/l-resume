<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-vue-next'
import { useAppToast, type ToastVariant } from '~/composables/useAppToast'

const { toasts, dismiss } = useAppToast()

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-foreground',
  success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const variantIcon: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}
</script>

<template>
  <div
    aria-live="polite"
    class="pointer-events-none fixed bottom-4 right-4 z-[10050] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-sm',
          variantStyles[toast.variant],
        ]"
        role="alert"
      >
        <component :is="variantIcon[toast.variant]" class="mt-0.5 size-4 shrink-0" />
        <p class="flex-1 text-sm leading-snug">{{ toast.message }}</p>
        <button
          type="button"
          class="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
          aria-label="关闭"
          @click="dismiss(toast.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
