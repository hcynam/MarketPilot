import type { MarketingPlan } from '../types'
import { kpiDefinitions } from '../data/kpiFramework'

type PdfBlock = {
  type: 'h1' | 'h2' | 'p' | 'li'
  text: string
}

const pageWidthPx = 1240
const pageHeightPx = 1754
const pageWidthPt = 595.28
const pageHeightPt = 841.89
const marginX = 92
const marginTop = 78
const marginBottom = 82
const bodyMaxWidth = pageWidthPx - marginX * 2
const fontStack = 'Tahoma, "Segoe UI", Arial, sans-serif'

function safeName(value: string): string {
  return (value || 'MarketPilot AI')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'MarketPilot AI'
}

function planBlocks(plan: MarketingPlan, businessName: string): PdfBlock[] {
  const { score, maxScore, details } = plan.qualityScore
  const blocks: PdfBlock[] = [
    { type: 'h1', text: `برنامه بازاریابی: ${businessName || 'MarketPilot AI'}` },
    { type: 'p', text: 'گزارش ساختاریافته برای تحلیل بازار، جایگاه‌یابی، قیف جذب، KPI و برنامه اقدام.' },
    { type: 'h2', text: '1. خلاصه کسب‌وکار' },
    { type: 'p', text: plan.businessSummary },
    { type: 'h2', text: '2. مرحله توسعه مشتری' },
    { type: 'p', text: plan.customerDevelopmentStage },
    { type: 'h2', text: '3. بخش‌های بازار' },
    ...plan.marketSegments.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '4. بازار هدف' },
    { type: 'p', text: plan.targetMarket },
    { type: 'h2', text: '5. بیانیه جایگاه‌یابی' },
    { type: 'p', text: plan.positioningStatement },
    { type: 'h2', text: '6. پرسونای مشتریان' },
    ...plan.customerPersonas.map((text): PdfBlock => ({ type: 'p', text })),
    { type: 'h2', text: '7. ارزش پیشنهادی' },
    { type: 'p', text: plan.valueProposition },
    { type: 'h2', text: '8. پیشنهاد فروش منحصربه‌فرد (USP)' },
    { type: 'p', text: plan.usp },
    { type: 'h2', text: '9. تحلیل رقبا و جایگزین‌ها' },
    ...plan.competitorAnalysis.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '10. آمیخته بازاریابی 7P' },
    ...Object.entries(plan.marketingMix7p).map(([key, value]): PdfBlock => ({ type: 'p', text: `${key}: ${value}` })),
    { type: 'h2', text: '11. قیف و سفر مشتری' },
    ...plan.funnelJourney.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '12. استراتژی کانال دیجیتال' },
    ...plan.channelStrategy.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '13. پیشنهاد اولیه قیمت‌گذاری' },
    { type: 'p', text: plan.pricingRecommendation },
    { type: 'h2', text: '14. داشبورد KPI' },
    ...plan.kpiDashboard.map((kpi): PdfBlock => {
      const def = kpiDefinitions[kpi.metric]
      return {
        type: 'p',
        text: `${kpi.metric} | مرحله: ${def?.funnelStage ?? '—'} | هدف: ${kpi.value} | معیار مقایسه: ${kpi.benchmark}. ${kpi.interpretation}`,
      }
    }),
    { type: 'h2', text: '15. برنامه اقدام ۳۰ روزه' },
    ...plan.actionPlan.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '16. ریسک‌ها و فرضیات' },
    ...plan.risksAssumptions.map((text): PdfBlock => ({ type: 'li', text })),
    { type: 'h2', text: '17. امتیاز کیفیت برنامه بازاریابی' },
    { type: 'p', text: `امتیاز: ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)` },
    ...details.map((text): PdfBlock => ({ type: 'li', text })),
  ]

  return blocks
}

function blockStyle(type: PdfBlock['type']): { font: string; color: string; lineHeight: number; before: number; after: number } {
  switch (type) {
    case 'h1':
      return { font: `700 34px ${fontStack}`, color: '#1f2a44', lineHeight: 46, before: 0, after: 22 }
    case 'h2':
      return { font: `700 25px ${fontStack}`, color: '#3730a3', lineHeight: 36, before: 24, after: 12 }
    case 'li':
      return { font: `400 21px ${fontStack}`, color: '#334155', lineHeight: 32, before: 4, after: 8 }
    default:
      return { font: `400 21px ${fontStack}`, color: '#334155', lineHeight: 32, before: 4, after: 12 }
  }
}

function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) lines.push(current)
    current = word

    if (ctx.measureText(current).width > maxWidth) {
      let chunk = ''
      for (const ch of current) {
        const next = chunk + ch
        if (ctx.measureText(next).width <= maxWidth) {
          chunk = next
        } else {
          if (chunk) lines.push(chunk)
          chunk = ch
        }
      }
      current = chunk
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  return text
    .split('\n')
    .flatMap((line) => wrapLine(ctx, line.trim(), maxWidth))
}

function createPage(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = pageWidthPx
  canvas.height = pageHeightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageWidthPx, pageHeightPx)
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'

  ctx.fillStyle = '#eef2ff'
  ctx.fillRect(0, 0, pageWidthPx, 20)

  return { canvas, ctx }
}

function renderPages(blocks: PdfBlock[]): string[] {
  const pages: HTMLCanvasElement[] = []
  let page = createPage()
  let y = marginTop

  const pushPage = () => {
    pages.push(page.canvas)
    page = createPage()
    y = marginTop
  }

  for (const block of blocks) {
    const style = blockStyle(block.type)
    const maxWidth = block.type === 'li' ? bodyMaxWidth - 26 : bodyMaxWidth
    page.ctx.font = style.font
    const lines = wrapText(page.ctx, block.type === 'li' ? `• ${block.text}` : block.text, maxWidth)
    const needed = style.before + lines.length * style.lineHeight + style.after

    if (y + needed > pageHeightPx - marginBottom) {
      pushPage()
    }

    y += style.before
    page.ctx.font = style.font
    page.ctx.fillStyle = style.color
    const x = pageWidthPx - marginX
    for (const line of lines) {
      page.ctx.fillText(line, x, y, maxWidth)
      y += style.lineHeight
    }

    if (block.type === 'h1') {
      page.ctx.fillStyle = '#4f46e5'
      page.ctx.fillRect(marginX, y + 2, bodyMaxWidth, 4)
      y += 12
    }

    y += style.after
  }

  pages.push(page.canvas)
  return pages.map((canvas) => canvas.toDataURL('image/jpeg', 0.92))
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.split(',')[1] ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function ascii(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function buildPdf(imageDataUrls: string[]): Blob {
  const objects: Uint8Array[] = []
  const pageObjectNumbers: number[] = []
  let nextObject = 1

  const addObject = (objectNumber: number, chunks: Uint8Array[]) => {
    objects[objectNumber] = concatBytes([
      ascii(`${objectNumber} 0 obj\n`),
      ...chunks,
      ascii('\nendobj\n'),
    ])
  }

  const catalogObject = nextObject++
  const pagesObject = nextObject++
  const pageInfos = imageDataUrls.map((dataUrl, index) => {
    const pageObject = nextObject++
    const contentObject = nextObject++
    const imageObject = nextObject++
    const imageBytes = dataUrlToBytes(dataUrl)
    const imageName = `Im${index + 1}`
    pageObjectNumbers.push(pageObject)

    addObject(imageObject, [
      ascii(`<< /Type /XObject /Subtype /Image /Width ${pageWidthPx} /Height ${pageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
      imageBytes,
      ascii('\nendstream'),
    ])

    const content = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/${imageName} Do\nQ`
    addObject(contentObject, [
      ascii(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`),
    ])

    addObject(pageObject, [
      ascii(`<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`),
    ])

    return { pageObject }
  })

  addObject(pagesObject, [
    ascii(`<< /Type /Pages /Kids [${pageInfos.map(({ pageObject }) => `${pageObject} 0 R`).join(' ')}] /Count ${pageInfos.length} >>`),
  ])
  addObject(catalogObject, [
    ascii(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`),
  ])

  const maxObject = nextObject - 1
  const chunks: Uint8Array[] = [ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')]
  const offsets = new Array<number>(maxObject + 1).fill(0)

  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber += 1) {
    offsets[objectNumber] = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    chunks.push(objects[objectNumber])
  }

  const startXref = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const xrefRows = offsets
    .map((offset, index) => (index === 0 ? '0000000000 65535 f ' : `${String(offset).padStart(10, '0')} 00000 n `))
    .join('\n')

  chunks.push(ascii(`xref\n0 ${maxObject + 1}\n${xrefRows}\ntrailer\n<< /Size ${maxObject + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${startXref}\n%%EOF`))

  return new Blob([concatBytes(chunks)], { type: 'application/pdf' })
}

export function createMarketingPlanPdf(plan: MarketingPlan, businessName: string): Blob {
  const images = renderPages(planBlocks(plan, businessName))
  return buildPdf(images)
}

export function marketingPlanPdfFileName(businessName: string): string {
  return `${safeName(businessName)}-marketing-plan.pdf`
}
