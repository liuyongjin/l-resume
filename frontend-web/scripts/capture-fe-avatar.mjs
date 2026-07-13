/**
 * Capture frontendEngineer avatar in editor preview for visual QA.
 * Usage: node scripts/capture-fe-avatar.mjs
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

async function findFrontendEngineerResumeId(token) {
  const res = await fetch(`${API}/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  const resumes = json.data?.resumes || []
  const match = resumes.find((r) => r.templateId === 'frontendEngineer')
  return match?.id || resumes[0]?.id
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

async function openFrontendEngineerEditor(page, resumeId) {
  await page.goto(`${BASE}/editor/${resumeId}`, { waitUntil: 'commit', timeout: 60000 })
  await page.waitForSelector('.fe-avatar', { timeout: 30000 })
}

async function capture(page, name) {
  const avatar = page.locator('.fe-avatar').first()
  await avatar.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await avatar.screenshot({ path: path.join(OUT_DIR, name) })
  await page.screenshot({
    path: path.join(OUT_DIR, name.replace('.png', '-page.png')),
    fullPage: false,
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const session = await fetchAuthSession()
  const resumeId = await findFrontendEngineerResumeId(session.token)
  if (!resumeId) throw new Error('No resume found for capture')

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  try {
    await seedAuth(page, session)
    await openFrontendEngineerEditor(page, resumeId)
    await capture(page, 'fe-avatar-editor-desktop.png')
    console.log(`Saved screenshots to ${OUT_DIR} (resume #${resumeId})`)
  } catch (error) {
    console.error('Capture failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
