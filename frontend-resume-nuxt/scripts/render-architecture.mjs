import { chromium } from 'playwright'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const svgPath = path.join(root, 'docs/screenshots/architecture.svg')
const outPath = path.join(root, 'docs/screenshots/architecture.png')
const svg = readFileSync(svgPath, 'utf8')
const html = `<!DOCTYPE html><html><body style="margin:0;background:#fff">${svg}</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.setContent(html, { waitUntil: 'load' })
await page.locator('svg').screenshot({ path: outPath })
await browser.close()
console.log('wrote', outPath, statSync(outPath).size)
