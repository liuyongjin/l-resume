/**
 * Recapture resume list / editor / preview / settings for README.
 * Usage: node scripts/recapture-resume-pages.mjs
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
const PREFERRED_RESUME_ID = process.env.VISUAL_RESUME_ID || '4'

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

async function resolveResumeId(token) {
  const preferred = Number(PREFERRED_RESUME_ID)
  const detail = await fetch(`${API}/resumes/${preferred}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const detailJson = await detail.json()
  if (detailJson.success && detailJson.data?.resume?.id) {
    return String(detailJson.data.resume.id)
  }

  const res = await fetch(`${API}/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  const resumes = json.data?.resumes || []
  if (!resumes.length) throw new Error('No resume found for screenshots')
  return String(resumes[0].id)
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

async function waitLoaderGone(page) {
  const loaderTexts = ['加载中...', 'Loading...', '加载简历编辑器...', '加载模板中...']
  for (let i = 0; i < 90; i++) {
    const still = await page.evaluate((texts) => {
      const busy = document.querySelector('[aria-busy="true"]')
      if (busy) {
        const style = window.getComputedStyle(busy)
        if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0) return true
      }
      return Array.from(document.querySelectorAll('body *')).some((el) => {
        if (el.children.length > 0) return false
        const t = (el.textContent || '').trim()
        if (!texts.includes(t)) return false
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      })
    }, loaderTexts)
    if (!still) break
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(500)
}

async function shot(page, filename) {
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
  const resumeId = await resolveResumeId(session.token)
  console.log(`using resume #${resumeId}`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.route('**/*.{woff,woff2,ttf,otf}', (route) => route.abort())

  try {
    await seedAuth(page, session)

    const only = process.env.VISUAL_ONLY || ''

    if (!only || only.includes('list')) {
      await page.goto(`${BASE}/resume`, { waitUntil: 'commit', timeout: 60000 })
      await page.getByText('我的简历').first().waitFor({ state: 'visible', timeout: 30000 })
      await waitLoaderGone(page)
      await page.waitForTimeout(1200)
      await shot(page, 'resume-list.png')
    }

    if (!only || only.includes('editor')) {
      await page.goto(`${BASE}/editor/${resumeId}`, { waitUntil: 'commit', timeout: 60000 })
      await waitLoaderGone(page)
      await page.getByText('手动编辑').first().waitFor({ state: 'visible', timeout: 45000 })
      await page.waitForFunction(() => {
        const left = document.querySelector('.editor-split-left')
        if (!left) return false
        return left.getBoundingClientRect().width >= 240
      }, { timeout: 30000 })
      await page.waitForTimeout(1500)
      await shot(page, 'editor.png')
    }

    if (!only || only.includes('preview')) {
      await page.goto(`${BASE}/preview/${resumeId}`, { waitUntil: 'commit', timeout: 60000 })
      await waitLoaderGone(page)
      await page.waitForTimeout(2500)
      await shot(page, 'preview.png')
    }

    if (!only || only.includes('settings')) {
      await page.goto(`${BASE}/`, { waitUntil: 'commit', timeout: 60000 })
      await waitLoaderGone(page)
      await page.waitForTimeout(1000)
      await page.locator('button[title="网站设置"]').click()
      await page.locator('text=调整网站的外观和样式').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(800)
      await shot(page, 'settings.png')
    }
  } catch (error) {
    console.error('Capture failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
