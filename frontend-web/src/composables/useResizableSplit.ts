import { ref, watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue'

const HANDLE_WIDTH = 6
/** A4 纸宽 210mm @ 96dpi */
export const A4_PAPER_WIDTH_PX = Math.ceil((210 * 96) / 25.4)
/** 预览区左右 padding（px-4） */
export const EDITOR_PREVIEW_PADDING_X = 32
/** 右侧预览区默认保留宽度（A4 + 内边距 + 余量） */
export const EDITOR_DEFAULT_RIGHT_PX = A4_PAPER_WIDTH_PX + EDITOR_PREVIEW_PADDING_X + 16

export interface UseResizableSplitOptions {
  containerRef: Ref<HTMLElement | null>
  defaultRatio?: number
  minLeft?: number
  minRight?: number
  reserveRightPx?: number
  maxLeftRatio?: number
}

export function useResizableSplit(options: UseResizableSplitOptions) {
  const {
    containerRef,
    minLeft = 260,
    minRight = 340,
    reserveRightPx = EDITOR_DEFAULT_RIGHT_PX,
    maxLeftRatio = 0.3,
  } = options

  const leftWidth = ref(0)
  const isDragging = ref(false)
  /** 完成首次容器测量后再应用像素宽度，避免与 CSS 占位宽度闪动 */
  const isReady = ref(false)

  let resizeObserver: ResizeObserver | null = null

  function clampWidth(next: number) {
    const container = containerRef.value
    if (!container) return next
    const total = container.clientWidth - HANDLE_WIDTH
    if (total <= 0) return next
    return Math.max(minLeft, Math.min(next, total - minRight))
  }

  function applyDefaultWidth() {
    const container = containerRef.value
    if (!container) return false
    const total = container.clientWidth - HANDLE_WIDTH
    if (total <= 0) return false
    const leftByPaper = total - Math.max(minRight, reserveRightPx)
    const maxLeft = Math.round(total * maxLeftRatio)
    leftWidth.value = clampWidth(Math.min(leftByPaper, maxLeft))
    return leftWidth.value > 0
  }

  function markReadyIfMeasured() {
    if (isReady.value) {
      if (!isDragging.value) {
        leftWidth.value = clampWidth(leftWidth.value || minLeft)
      }
      return
    }
    if (applyDefaultWidth()) {
      isReady.value = true
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging.value || !containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    leftWidth.value = clampWidth(e.clientX - rect.left)
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  function startResize(e: MouseEvent) {
    e.preventDefault()
    isDragging.value = true
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function onWindowResize() {
    if (!isDragging.value && isReady.value) {
      leftWidth.value = clampWidth(leftWidth.value)
    } else if (!isReady.value) {
      markReadyIfMeasured()
    }
  }

  function bindObserver(el: HTMLElement | null) {
    resizeObserver?.disconnect()
    resizeObserver = null
    if (!el || typeof ResizeObserver === 'undefined') return
    resizeObserver = new ResizeObserver(() => {
      markReadyIfMeasured()
    })
    resizeObserver.observe(el)
  }

  watch(
    containerRef,
    async (el) => {
      bindObserver(el)
      if (!el) return
      await nextTick()
      markReadyIfMeasured()
    },
    { flush: 'post' },
  )

  onMounted(async () => {
    await nextTick()
    bindObserver(containerRef.value)
    markReadyIfMeasured()
    window.addEventListener('resize', onWindowResize)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('resize', onWindowResize)
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return { leftWidth, isDragging, isReady, startResize, applyDefaultWidth }
}
