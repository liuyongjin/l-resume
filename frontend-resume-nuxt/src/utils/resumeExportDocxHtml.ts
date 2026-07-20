import { Document, ImageRun, Packer, Paragraph } from 'docx'
import { saveAs } from 'file-saver'
import { normalizePaperSize, PAPER_SPECS } from '~/utils/resumePaper'

export interface ResumeExportStyleOptions {
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  paperSize?: string
  margins?: string
  fontSize?: number
}

function marginMm(margins?: string): number {
  const map: Record<string, number> = { narrow: 12, normal: 20, wide: 28 }
  return map[margins || 'normal'] ?? 20
}

function mmToTwip(mm: number): number {
  return Math.round(mm * 56.7)
}

function pageWidthMm(paperSize?: string): number {
  const paper = normalizePaperSize(paperSize)
  const spec = PAPER_SPECS[paper]
  return Number.parseFloat(spec.width)
}

function pageHeightMm(paperSize?: string): number {
  const paper = normalizePaperSize(paperSize)
  const spec = PAPER_SPECS[paper]
  return Number.parseFloat(spec.height)
}

/** 将预览区截图嵌入 Word，保证与编辑器预览样式一致 */
export async function exportResumeDocxFromPreview(
  capturePreview: () => Promise<HTMLCanvasElement>,
  filename: string,
  options?: ResumeExportStyleOptions,
) {
  const canvas = await capturePreview()
  const dataUrl = canvas.toDataURL('image/png')
  const binary = atob(dataUrl.split(',')[1] || '')
  const imageData = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) imageData[i] = binary.charCodeAt(i)

  const renderedWidth = canvas.width / 2
  const renderedHeight = canvas.height / 2
  const margin = marginMm(options?.margins)
  const contentWidthMm = pageWidthMm(options?.paperSize) - margin * 2
  const contentWidthPx = Math.round((contentWidthMm * 96) / 25.4)
  const contentHeightPx = Math.round((renderedHeight / renderedWidth) * contentWidthPx)

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mmToTwip(pageWidthMm(options?.paperSize)),
              height: mmToTwip(pageHeightMm(options?.paperSize)),
            },
            margin: {
              top: mmToTwip(margin),
              right: mmToTwip(margin),
              bottom: mmToTwip(margin),
              left: mmToTwip(margin),
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                type: 'png',
                data: imageData,
                transformation: {
                  width: contentWidthPx,
                  height: contentHeightPx,
                },
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`)
}
