export function useGlobalLoading() {
  const store = useLoadingStore()
  const { isLoading, message } = storeToRefs(store)

  return {
    isLoading,
    message,
    show: (text?: string) => store.start(text),
    hide: () => store.stop(),
    wrap: store.wrap
  }
}
