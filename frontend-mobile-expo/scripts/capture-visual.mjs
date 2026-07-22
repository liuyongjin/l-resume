import { createRequire } from 'module'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const require = createRequire(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend-resume-nuxt/package.json'),
)
const { chromium } = require('playwright')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../../../tmp/visual/mobile')
fs.mkdirSync(OUT, { recursive: true })

async function shot(page, url, file, waitText) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 })
  if (waitText) {
    await page.getByText(waitText).first().waitFor({ timeout: 120000 })
  }
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, file), fullPage: false })
  console.log('wrote', file)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 667 } })
try {
  await shot(page, 'http://localhost:8081/login', 'expo-login-375.png', '欢迎回来')
  await shot(page, 'http://localhost:8081/register', 'expo-register-375.png', '注册')
} finally {
  await browser.close()
}
