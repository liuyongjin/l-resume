/**
 * Re-capture templates + workflow execution without AppLoader overlay.
 * Usage: node scripts/recapture-templates-execution.mjs
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

/** Wait until global AppLoader overlay and page-level loaders are gone */
async function waitLoaderGone(page, { pageReadyText, contentText } = {}) {
  if (pageReadyText) {
    await page.getByText(pageReadyText).first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {})
  }

  const loaderTexts = new Set([
    '加载中...',
    'Loading...',
    '加载智能执行...',
    '加载模板中...',
  ])

  for (let i = 0; i < 90; i++) {
    const stillLoading = await page.evaluate((texts) => {
      const busy = document.querySelector('[aria-busy="true"]')
      if (busy) {
        const style = window.getComputedStyle(busy)
        if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0) {
          return true
        }
      }
      const nodes = Array.from(document.querySelectorAll('body *'))
      return nodes.some((el) => {
        if (el.children.length > 0) return false
        const t = (el.textContent || '').trim()
        if (!texts.includes(t)) return false
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      })
    }, [...loaderTexts])
    if (!stillLoading) break
    await page.waitForTimeout(500)
  }

  if (contentText) {
    await page.getByText(contentText).first().waitFor({ state: 'visible', timeout: 60000 })
  }

  await page.waitForTimeout(600)
}

async function captureReady(page, route, filename, { readySelector, pageReadyText, contentText } = {}) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (readySelector) {
    await page.waitForSelector(readySelector, { timeout: 45000 })
  }
  await waitLoaderGone(page, { pageReadyText, contentText })
  await page.waitForTimeout(1200)
  await page.evaluate(() => document.fonts?.ready?.catch?.(() => {}) || Promise.resolve()).catch(() => {})
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    fullPage: false,
    animations: 'disabled',
    timeout: 10000,
  })
  console.log(`saved ${filename}`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const session = await fetchAuthSession()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.route('**/*.{woff,woff2,ttf,otf}', (route) => route.abort())

  try {
    await seedAuth(page, session)
    await captureReady(page, '/templates', 'templates.png', {
      readySelector: 'h1',
      pageReadyText: '模板选择',
      contentText: '高级前端工程师',
    })
    await captureReady(page, '/workflow/execution', 'workflow-execution.png', {
      readySelector: 'h1',
      pageReadyText: '执行配置',
      contentText: '开始执行',
    })
  } catch (error) {
    console.error('Capture failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
