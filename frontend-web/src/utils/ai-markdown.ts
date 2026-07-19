/**
 * 轻量 Markdown → 安全 HTML，兼容常见 AI 回复格式：
 * 代码块 / 行内代码 / 标题 / 列表 / 引用 / 粗斜体 / 链接 / 表格粗略 / 裸 HTML 转义
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/`/g, '&#96;')
}

/** 规范化 AI 常见“伪 markdown” */
export function normalizeAiMarkdown(raw: string): string {
  if (!raw) return ''
  let text = raw.replace(/\r\n/g, '\n')

  // 全角围栏 → 半角
  text = text.replace(/｀｀｀/g, '```')

  // 单独一行的 ~~lang 误写成围栏时尽量保留
  // 把缩进 4 空格代码块转成围栏（简单启发）
  const lines = text.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (/^ {4}|\t/.test(lines[i]) && !lines[i].startsWith('```')) {
      const block: string[] = []
      while (i < lines.length && (/^ {4}|\t/.test(lines[i]) || lines[i].trim() === '')) {
        block.push(lines[i].replace(/^(?: {4}|\t)/, ''))
        i++
      }
      while (block.length && block[block.length - 1].trim() === '') block.pop()
      if (block.length) {
        out.push('```')
        out.push(...block)
        out.push('```')
      }
      continue
    }
    out.push(lines[i])
    i++
  }
  return out.join('\n')
}

function renderInline(text: string): string {
  // 先抽出行内代码，避免被其它规则破坏
  const slots: string[] = []
  let s = text.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    const i = slots.length
    slots.push(`<code class="ai-md__code">${escapeHtml(code)}</code>`)
    return `\u0000MD${i}\u0000`
  })

  s = escapeHtml(s)

  // 还原占位符（escape 后 \u0000 仍在）
  s = s.replace(/\u0000MD(\d+)\u0000/g, (_m, idx: string) => slots[Number(idx)] || '')

  // 图片 ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    (_m, alt: string, url: string) =>
      `<img class="ai-md__img" src="${escapeAttr(url)}" alt="${alt}" loading="lazy" />`,
  )

  // 链接 [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_m, label: string, url: string) =>
      `<a class="ai-md__a" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  )

  // 自动链接（内容已 escape，URL 字符集安全）
  s = s.replace(
    /(^|[\s(])(https?:\/\/[^\s<&]+)/g,
    (_m, pre: string, url: string) =>
      `${pre}<a class="ai-md__a" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  )

  // 粗体 ** ** / __ __
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // 斜体 * * / _ _
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')

  // 删除线
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  return s
}


function flushParagraph(buf: string[], html: string[]) {
  const text = buf.join('\n').trim()
  buf.length = 0
  if (!text) return
  html.push(`<p class="ai-md__p">${renderInline(text).replace(/\n/g, '<br />')}</p>`)
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return ''
  const parseRow = (row: string) =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())

  const header = parseRow(rows[0])
  const bodyRows = rows.slice(2).map(parseRow)
  const th = header.map((c) => `<th>${renderInline(c)}</th>`).join('')
  const trs = bodyRows
    .map((cols) => `<tr>${cols.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
    .join('')
  return `<div class="ai-md__table-wrap"><table class="ai-md__table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`
}

/** 将 Markdown 转为安全 HTML 字符串 */
export function renderAiMarkdown(raw: string): string {
  const src = normalizeAiMarkdown(raw)
  if (!src.trim()) return ''

  const lines = src.split('\n')
  const html: string[] = []
  const para: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code
    const fence = line.match(/^```\s*([a-zA-Z0-9_+-]*)\s*$/)
    if (fence) {
      flushParagraph(para, html)
      const lang = fence[1] || ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      const code = escapeHtml(codeLines.join('\n'))
      const langLabel = lang ? `<span class="ai-md__lang">${escapeHtml(lang)}</span>` : ''
      html.push(
        `<div class="ai-md__pre-wrap">${langLabel}<pre class="ai-md__pre"><code class="ai-md__pre-code"${lang ? ` data-lang="${escapeAttr(lang)}"` : ''}>${code}</code></pre></div>`,
      )
      continue
    }

    // table
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1])) {
      flushParagraph(para, html)
      const tableRows: string[] = []
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableRows.push(lines[i])
        i++
      }
      html.push(renderTable(tableRows))
      continue
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph(para, html)
      html.push('<hr class="ai-md__hr" />')
      i++
      continue
    }

    // heading
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph(para, html)
      const level = Math.min(heading[1].length, 4)
      html.push(`<h${level} class="ai-md__h ai-md__h${level}">${renderInline(heading[2])}</h${level}>`)
      i++
      continue
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      flushParagraph(para, html)
      const quotes: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quotes.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      html.push(`<blockquote class="ai-md__quote">${renderInline(quotes.join('\n')).replace(/\n/g, '<br />')}</blockquote>`)
      continue
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph(para, html)
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''))
        i++
      }
      html.push(
        `<ul class="ai-md__ul">${items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ul>`,
      )
      continue
    }

    // ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushParagraph(para, html)
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        i++
      }
      html.push(
        `<ol class="ai-md__ol">${items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ol>`,
      )
      continue
    }

    // blank line → paragraph break
    if (!line.trim()) {
      flushParagraph(para, html)
      i++
      continue
    }

    para.push(line)
    i++
  }

  flushParagraph(para, html)
  return html.join('')
}
