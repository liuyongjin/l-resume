import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const pending = ref(0)
  const message = ref('加载中...')
  const booting = ref(true)

  const isLoading = computed(() => booting.value || pending.value > 0)

  function start(text?: string) {
    if (text) message.value = text
    pending.value++
  }

  function stop() {
    pending.value = Math.max(0, pending.value - 1)
  }

  function finishBoot() {
    booting.value = false
  }

  async function wrap<T>(fn: () => Promise<T>, text?: string): Promise<T> {
    start(text)
    try {
      return await fn()
    } finally {
      stop()
    }
  }

  return {
    pending,
    message,
    booting,
    isLoading,
    start,
    stop,
    finishBoot,
    wrap
  }
})
