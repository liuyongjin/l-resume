function isInViewport(el: Element, rootMargin = 48) {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight + rootMargin && rect.bottom > -rootMargin
}

export function useScrollReveal(
  selector = '.reveal',
  options: IntersectionObserverInit = {},
) {
  let observer: IntersectionObserver | null = null

  const refresh = () => {
    if (!import.meta.client) return
    document.documentElement.classList.add('reveal-animate')
    observer?.disconnect()
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -2% 0px',
        ...options,
      },
    )
    document.querySelectorAll(selector).forEach((el) => {
      if (isInViewport(el)) {
        el.classList.add('is-visible')
      }
      observer?.observe(el)
    })
  }
  onMounted(() => {
    refresh()
    window.addEventListener('resize', refresh, { passive: true })
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('resize', refresh)
  })

  return { refresh }
}
