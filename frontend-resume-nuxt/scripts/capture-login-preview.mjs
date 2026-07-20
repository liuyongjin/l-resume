import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '..', '..', 'docs', 'screenshots')
const BASE = 'http://localhost:3000'
const API = 'http://localhost:3001/api'

const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '12345678900', password: '123456' }),
})
const session = (await res.json()).data

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.route('**/*.{woff,woff2,ttf,otf}', (r) => r.abort())

// Login without auth
await page.goto(`${BASE}/login`, { waitUntil: 'commit', timeout: 30000 })
await page.evaluate(() => {
  localStorage.clear()
  document.cookie = 'resume-token=; path=/; Max-Age=0'
})
await page.goto(`${BASE}/login`, { waitUntil: 'commit', timeout: 30000 })
await page.waitForSelector('input[type="password"]', { timeout: 20000 })
await page.waitForSelector('text=加载中', { state: 'hidden', timeout: 15000 }).catch(() => {})
await page.waitForTimeout(1000)
await page.screenshot({ path: path.join(OUT, 'login.png'), animations: 'disabled', timeout: 8000 })
console.log('login ok')

// Preview with auth
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('resume-token', token)
    localStorage.setItem('resume-user', JSON.stringify(user))
    document.cookie = `resume-token=${encodeURIComponent(token)}; path=/; SameSite=Lax`
  },
  { token: session.token, user: session.user },
)
await page.goto(`${BASE}/preview/2`, { waitUntil: 'commit', timeout: 30000 })
await page.waitForTimeout(4000)
await page.screenshot({ path: path.join(OUT, 'preview.png'), animations: 'disabled', timeout: 8000 })
console.log('preview ok')

await browser.close()
