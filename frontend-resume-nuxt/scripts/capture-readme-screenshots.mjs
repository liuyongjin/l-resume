/**
 * Capture frontend screenshots for root README.
 * Usage: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.resolve(ROOT, '..', 'docs', 'screenshots')
const BASE = process.env.VISUAL_BASE_URL || 'http://localhost:3000'
const API = process.env.VISUAL_API_URL || 'http://localhost:3001/api'

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

async function firstResumeId(token) {
  const res = await fetch(`${API}/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  const resumes = json.data?.resumes || []
  return resumes[0]?.id
}

async function seedAuth(page, session) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('resume-token', token)
      localStorage.setItem('resume-user', JSON.stringify(user))
      document.cookie = `resume-token=${encodeURIComponent(token)}; path=/; SameSite=Lax`
    },
    { token: session.token, user: session.user },
  )
}

async function capture(page, route, filename, waitFor, extraWaitMs = 2000) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 45000 }).catch(() => {})
  }
  await page.waitForTimeout(extraWaitMs)
  // Avoid hanging on webfonts that never settle
  await page.evaluate(() => document.fonts?.ready?.catch?.(() => {}) || Promise.resolve()).catch(() => {})
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    fullPage: false,
    animations: 'disabled',
    timeout: 10000,
  })
  console.log(`saved ${filename}`)
}

async function clearAuth(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => {
    localStorage.removeItem('resume-token')
    localStorage.removeItem('resume-user')
    document.cookie = 'resume-token=; path=/; Max-Age=0'
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const session = await fetchAuthSession()
  const resumeId = await firstResumeId(session.token)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  // Skip remote fonts that can block screenshot font-ready wait
  await page.route('**/*.{woff,woff2,ttf,otf}', (route) => route.abort())

  try {
    // Unauthenticated pages
    await clearAuth(page)
    await capture(page, '/', 'home.png', 'h1')
    await capture(page, '/login', 'login.png', 'input[type="password"], form')

    // Authenticated pages
    await seedAuth(page, session)
    await capture(page, '/templates', 'templates.png', 'h1, img, [class*="card"]', 3000)
    await capture(page, '/resume', 'resume-list.png', 'h1')
    await capture(page, '/workflow/execution', 'workflow-execution.png', 'h1, .execution-flow-panel')
    await capture(page, '/workflow/designer', 'workflow-designer.png', '.vue-flow, [class*="vue-flow"]', 3000)

    if (resumeId) {
      await capture(
        page,
        `/editor/${resumeId}`,
        'editor.png',
        '.resume-preview, [class*="ResumePreview"], .editor-workspace, aside',
        5000,
      )
      // Wait until loading spinner is gone if present
      await page.waitForSelector('text=加载简历编辑器', { state: 'hidden', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(1500)
      await page.screenshot({
        path: path.join(OUT_DIR, 'editor.png'),
        fullPage: false,
        animations: 'disabled',
        timeout: 10000,
      })
      console.log('saved editor.png (post-load)')

      await capture(
        page,
        `/preview/${resumeId}`,
        'preview.png',
        '.resume-preview, [class*="ResumePreview"], main',
        4000,
      )
    } else {
      console.warn('No resume found; skipped editor/preview screenshots')
    }
  } catch (error) {
    console.error('Capture failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
