import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sampleBusiness } from '../src/data/sample'
import { generateMarketingPlan } from '../src/engine/orchestrator'
import { createMarketingPlanDocx } from '../src/lib/docxExport'
import { createPrintableReportHtml } from '../src/lib/printDocument'
import { createReportPresentation } from '../src/lib/reportPresentation'

const root = resolve(import.meta.dirname, '..')
const outputPdf = resolve(root, 'output', 'pdf')
const outputDocx = resolve(root, 'output', 'docx')

await Promise.all([
  mkdir(outputPdf, { recursive: true }),
  mkdir(outputDocx, { recursive: true }),
])

const plan = generateMarketingPlan(sampleBusiness)
const model = createReportPresentation(plan, sampleBusiness.businessName)
const html = createPrintableReportHtml(model, 'pdf', false)
const docx = await createMarketingPlanDocx(model)

await Promise.all([
  writeFile(resolve(outputPdf, 'MarketPilot-AI-print-document.html'), html, 'utf8'),
  writeFile(resolve(outputDocx, 'MarketPilot-AI-marketing-plan.docx'), new Uint8Array(await docx.arrayBuffer())),
])

process.stdout.write(JSON.stringify({
  sections: model.chapters.flatMap((chapter) => chapter.sections).length,
  kpis: model.chapters.flatMap((chapter) => chapter.sections).find((section) => section.kind === 'kpis')?.kpis?.length ?? 0,
  html: resolve(outputPdf, 'MarketPilot-AI-print-document.html'),
  docx: resolve(outputDocx, 'MarketPilot-AI-marketing-plan.docx'),
}))

