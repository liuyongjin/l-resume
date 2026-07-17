import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../../docs/screenshots')
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

await page.goto(`${BASE}/login`, { waitUntil: 'commit', timeout: 30000 })
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('resume-token', token)
    localStorage.setItem('resume-user', JSON.stringify(user))
    document.cookie = `resume-token=${encodeURIComponent(token)}; path=/; SameSite=Lax`
  },
  { token: session.token, user: session.user },
)

await page.goto(`${BASE}/`, { waitUntil: 'commit', timeout: 30000 })
await page.waitForTimeout(2500)

const btn = page.locator('button[title="网站设置"]')
console.log('settings btn count', await btn.count())
await btn.click()
await page.locator('text=调整网站的外观和样式').waitFor({ state: 'visible', timeout: 15000 })
await page.waitForTimeout(800)
await page.screenshot({
  path: path.join(OUT, 'settings.png'),
  animations: 'disabled',
  timeout: 10000,
})
console.log('saved settings.png')
await browser.close()
