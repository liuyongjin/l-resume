/** 导出克隆 DOM 时移除编辑联动虚线框与预览装饰 */
export function sanitizeExportClone(doc: Document, clonedElement: HTMLElement) {
  doc.querySelectorAll('.preview-interactive').forEach((el) => {
    el.classList.remove('preview-interactive')
  })

  doc.querySelectorAll('.resume-edit-zone, .resume-edit-zone--active').forEach((el) => {
    const node = el as HTMLElement
    node.classList.remove('resume-edit-zone', 'resume-edit-zone--active')
    node.style.border = 'none'
    node.style.background = 'transparent'
    node.style.padding = ''
    node.style.margin = ''
    node.style.cursor = 'default'
    node.style.boxShadow = 'none'
  })

  const roots = [
    clonedElement,
    ...Array.from(clonedElement.querySelectorAll('.resume-preview--capture, .shadow-md, .shadow-xl')),
  ]
  roots.forEach((el) => {
    const node = el as HTMLElement
    node.style.boxShadow = 'none'
    node.style.borderRadius = '0'
  })
}

export async function waitForPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
