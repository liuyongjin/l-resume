const hideTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

/** 滚动时短暂显示滚动条，停止滚动后隐藏 */
export function onEditorPaneScroll(event: Event, hideDelayMs = 900) {
  const el = event.currentTarget as HTMLElement | null
  if (!el) return

  el.classList.add('is-scrolling')

  const prev = hideTimers.get(el)
  if (prev) clearTimeout(prev)

  hideTimers.set(
    el,
    setTimeout(() => {
      el.classList.remove('is-scrolling')
      hideTimers.delete(el)
    }, hideDelayMs),
  )
}
