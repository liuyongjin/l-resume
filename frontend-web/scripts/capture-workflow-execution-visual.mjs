/**
 * Visual QA for workflow execution pages.
 * Usage: node scripts/capture-workflow-execution-visual.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'tmp', 'visual')
const BASE = process.env.VISUAL_BASE_URL || 'http://localhost:3000'
const API = process.env.VISUAL_API_URL || 'http://localhost:3001/api'

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667, isMobile: true },
]

async function fetchAuthSession() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '12345678900', password: '123456' }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(`Login failed: ${json.message || 'unknown'}`)
  return json.data
}

async function seedAuth(page, session) {
  await page.goto(`${BASE}/login`, { waitUntil: 'commit', timeout: 60000 })
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('resume-token', token)
      localStorage.setItem('resume-user', JSON.stringify(user))
      document.cookie = `resume-token=${encodeURIComponent(token)}; path=/; SameSite=Lax`
    },
    { token: session.token, user: session.user },
  )
}

async function captureRoute(page, route, viewportName) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.execution-flow-panel, h1', { timeout: 30000 })
  await page.waitForTimeout(800)
  const slug = route.replace(/\//g, '-').replace(/^-/, '') || 'home'
  await page.screenshot({
    path: path.join(OUT_DIR, `${slug}-${viewportName}.png`),
    fullPage: false,
    animations: 'disabled',
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const session = await fetchAuthSession()
  const browser = await chromium.launch()

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile ?? false,
      })
      await seedAuth(page, session)
      await captureRoute(page, '/workflow/execution', viewport.name)
      await captureRoute(page, '/workflow/executions', viewport.name)
      await page.close()
    }
    console.log(`Saved workflow visual screenshots to ${OUT_DIR}`)
  } catch (error) {
    console.error('Capture failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
