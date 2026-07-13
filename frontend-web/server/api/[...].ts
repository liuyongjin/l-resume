import { proxyRequest, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const url = getRequestURL(event)
  const target = `${config.apiBackend}${url.pathname}${url.search}`
  return proxyRequest(event, target)
})
