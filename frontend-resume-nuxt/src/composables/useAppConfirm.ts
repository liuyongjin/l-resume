import { ref, readonly } from 'vue'

export type ConfirmVariant = 'default' | 'destructive'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

const state = ref<ConfirmState>({
  open: false,
  options: { title: '' },
  resolve: null,
})

/** 防止 AlertDialog 关闭动画与按钮 click 竞态导致误触发 cancel */
let settling = false

function close(result: boolean) {
  const resolveFn = state.value.resolve
  if (!resolveFn) return
  state.value = {
    open: false,
    options: { title: '' },
    resolve: null,
  }
  resolveFn(result)
  queueMicrotask(() => {
    settling = false
  })
}

function accept() {
  settling = true
  close(true)
}

function cancel() {
  settling = true
  close(false)
}

function handleOpenChange(next: boolean) {
  if (next) return
  // 延迟到当前 click 处理完成后再判断，避免 Action 关闭与 accept 竞态
  queueMicrotask(() => {
    if (!settling && state.value.resolve) {
      close(false)
    }
  })
}

export function useAppConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    settling = false
    return new Promise((resolve) => {
      state.value = {
        open: true,
        options,
        resolve,
      }
    })
  }

  return {
    state: readonly(state),
    confirm,
    accept,
    cancel,
    handleOpenChange,
  }
}
