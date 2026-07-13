import { ref, readonly } from 'vue'

export type ToastVariant = 'default' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

const dismiss = (id: number) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export const useAppToast = () => {
  const show = (message: string, variant: ToastVariant = 'default', duration = 3200) => {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, message, variant }]
    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return {
    toasts: readonly(toasts),
    show,
    success: (message: string, duration?: number) => show(message, 'success', duration),
    warning: (message: string, duration?: number) => show(message, 'warning', duration),
    error: (message: string, duration?: number) => show(message, 'error', duration),
    dismiss,
  }
}
