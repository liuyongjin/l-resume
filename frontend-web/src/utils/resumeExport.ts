import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'
import type { ResumeData } from '~/stores/resume'
import type { PreviewResumeData } from '~/utils/resumeTransform'
import { resolvePrimaryFontName } from '~/utils/resumeFonts'
import { normalizePaperSize } from '~/utils/resumePaper'
import { exportResumeDocxFromPreview } from '~/utils/resumeExportDocxHtml'
import { sanitizeExportClone, waitForPaint } from '~/utils/resumeExportDom'

export type ResumeExportFormat = 'pdf' | 'docx' | 'png' | 'jpeg'

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '简历'
}

export function buildResumeExportBasename(data: Pick<PreviewResumeData, 'name' | 'title'>): string {
  const parts = [data.name, data.title].filter(Boolean)
  return sanitizeFilename(parts.join('-') || '简历')
}

function paragraph(text: string, opts?: { bold?: boolean; size?: number; font?: string; italic?: boolean }) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        size: opts?.size,
        font: opts?.font,
      }),
    ],
  })
}

function sectionTitle(text: string, font: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font })],
    spacing: { before: 240, after: 120 },
  })
}

export async function exportResumeDocx(
  data: ResumeData,
  filename: string,
  options?: { fontFamily?: string; fontWeight?: string; fontStyle?: string },
) {
  const font = resolvePrimaryFontName(options?.fontFamily)
  const boldDefault = options?.fontWeight === '700' || options?.fontWeight === '600'
  const italicDefault = options?.fontStyle === 'italic'
  const blocks: Paragraph[] = []

  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: data.basicInfo.name || '姓名', bold: true, size: 36, font }),
      ],
      spacing: { after: 80 },
    }),
  )

  const contact = [data.basicInfo.position, data.basicInfo.phone, data.basicInfo.email, data.basicInfo.city]
    .filter(Boolean)
    .join('  |  ')
  if (contact) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: contact, size: 22, font })],
        spacing: { after: 200 },
      }),
    )
  }

  if (data.professionalSummary?.trim()) {
    blocks.push(sectionTitle('个人总结', font))
    blocks.push(paragraph(data.professionalSummary.trim(), { font, bold: boldDefault, italic: italicDefault, size: 22 }))
  }

  if (data.workExperience?.length) {
    blocks.push(sectionTitle('工作经历', font))
    for (const exp of data.workExperience) {
      const header = [exp.company, exp.position, [exp.startDate, exp.endDate].filter(Boolean).join(' - ')]
        .filter(Boolean)
        .join(' · ')
      if (header) blocks.push(paragraph(header, { font, bold: true, size: 22 }))
      for (const line of exp.description || []) {
        if (line?.trim()) blocks.push(paragraph(`• ${line.trim()}`, { font, size: 22 }))
      }
    }
  }

  if (data.education?.length) {
    blocks.push(sectionTitle('教育背景', font))
    for (const edu of data.education) {
      const line = [edu.school, edu.major, edu.degree, [edu.startDate, edu.endDate].filter(Boolean).join(' - ')]
        .filter(Boolean)
        .join(' · ')
      if (line) blocks.push(paragraph(line, { font, size: 22 }))
    }
  }

  if (data.projectExperience?.length) {
    blocks.push(sectionTitle('项目经历', font))
    for (const proj of data.projectExperience) {
      const header = [proj.name, proj.role, [proj.startDate, proj.endDate].filter(Boolean).join(' - ')]
        .filter(Boolean)
        .join(' · ')
      if (header) blocks.push(paragraph(header, { font, bold: true, size: 22 }))
      for (const line of proj.description || []) {
        if (line?.trim()) blocks.push(paragraph(`• ${line.trim()}`, { font, size: 22 }))
      }
    }
  }

  if (data.skills?.length) {
    blocks.push(sectionTitle('技能', font))
    for (const skill of data.skills) {
      const items = (skill.items || []).filter(Boolean).join('、')
      const line = skill.category ? `${skill.category}：${items}` : items
      if (line) blocks.push(paragraph(line, { font, size: 22 }))
    }
  }

  const doc = new Document({ sections: [{ children: blocks }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`)
}

async function capturePreviewCanvas(element: HTMLElement) {
  const html2canvas = (await import('html2canvas')).default
  const width = element.offsetWidth
  const height = element.scrollHeight

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: -window.scrollY,
    onclone: (clonedDoc, clonedElement) => {
      sanitizeExportClone(clonedDoc, clonedElement)
    },
  })
}

export async function exportResumeImage(
  element: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
) {
  const canvas = await capturePreviewCanvas(element)
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const ext = format === 'jpeg' ? '.jpg' : '.png'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, 0.95)
  })
  if (!blob) throw new Error('图片导出失败')
  saveAs(blob, filename.endsWith(ext) ? filename : `${filename}${ext}`)
}

export async function exportResumePdf(element: HTMLElement, filename: string, paperSize?: string) {
  const format = normalizePaperSize(paperSize)
  const pdfFormat = format === 'Letter' ? 'letter' : format === 'A5' ? 'a5' : 'a4'

  const canvas = await capturePreviewCanvas(element)
  const imgData = canvas.toDataURL('image/jpeg', 0.98)

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pdfFormat, compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

export async function exportResumeByFormat(params: {
  format: ResumeExportFormat
  data: ResumeData
  basename: string
  style?: {
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    paperSize?: string
    margins?: string
    fontSize?: number
  }
  /** 导出前进入非交互预览态（关闭联动虚线框） */
  beforeCapture?: () => Promise<void>
  /** 在 beforeCapture 之后获取预览根节点 */
  getPreviewElement: () => HTMLElement | null
}) {
  const { format, data, basename, style, beforeCapture, getPreviewElement } = params

  if (beforeCapture) {
    await beforeCapture()
  }
  await waitForPaint()

  const previewElement = getPreviewElement()
  if (!previewElement) {
    throw new Error('预览尚未加载，请稍后再试')
  }

  switch (format) {
    case 'docx':
      try {
        await exportResumeDocxFromPreview(
          () => capturePreviewCanvas(previewElement),
          basename,
          style,
        )
      } catch (error) {
        console.warn('预览截图转 Word 失败，回退结构化导出', error)
        await exportResumeDocx(data, basename, style)
      }
      break
    case 'png':
      await exportResumeImage(previewElement, basename, 'png')
      break
    case 'jpeg':
      await exportResumeImage(previewElement, basename, 'jpeg')
      break
    case 'pdf':
      await exportResumePdf(previewElement, basename, style?.paperSize)
      break
    default:
      throw new Error(`不支持的导出格式: ${format}`)
  }
}
