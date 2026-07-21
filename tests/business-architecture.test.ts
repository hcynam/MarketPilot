import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBusinessBrief } from '../src/ai/buildBusinessBrief'
import { buildBaselineDigest } from '../src/ai/baselineDigest'
import { assessBusinessCompleteness } from '../src/ai/completeness'
import { builtInSampleOrigin, originAfterMeaningfulEdit } from '../src/ai/sampleState'
import { generateMarketingPlan } from '../src/engine/orchestrator'
import { buildStrategyPatchPrompt } from '../netlify/functions/_shared/promptBuilders'
import { exportMarketingPlanToMarkdown, exportMarketingPlanToWordHtml } from '../src/lib/markdownExport'
import { createMarketingPlanDocx, marketingPlanDocxFileName } from '../src/lib/docxExport'
import { marketingPlanPdfFileName } from '../src/lib/pdfExport'
import { createPrintableReportHtml } from '../src/lib/printDocument'
import { createReportPresentation } from '../src/lib/reportPresentation'
import { b2bSaas, consulting, localCafe, makeBusiness, onlineRetail, veryIncomplete } from './fixtures'
import type { MarketingPlan } from '../src/types'

test('compact brief omits empty values, deduplicates arrays, and truncates long text deterministically', () => {
  const longMeaning = `مسئله کلیدی مشتری ${'جزئیات '.repeat(400)}`
  const brief = buildBusinessBrief(makeBusiness({
    geographicScope: '',
    discountOptions: '   ',
    mainCustomerProblem: longMeaning,
    availableChannels: ['website', 'website', 'email'],
  }))

  assert.equal('geography' in brief, false)
  assert.equal('pricingNotes' in brief, false)
  assert.deepEqual(brief.availableChannels, ['website', 'email'])
  assert.ok((brief.customerProblem?.length ?? 0) <= 900)
  assert.match(brief.customerProblem ?? '', /^مسئله کلیدی مشتری/)
  assert.match(brief.customerProblem ?? '', /…$/)
})

test('canonical prompt contains each repeated fact once and never appends raw form input', () => {
  const input = makeBusiness({ currentAlternative: 'عبارت جایگزین یکتای آزمون' })
  const brief = buildBusinessBrief(input)
  const baseline = generateMarketingPlan(input)
  const prompt = buildStrategyPatchPrompt({ businessBrief: brief, baselineDigest: buildBaselineDigest(baseline, brief) })
  const combined = `${prompt.systemPrompt}\n${prompt.userPrompt}`

  assert.equal(combined.split('عبارت جایگزین یکتای آزمون').length - 1, 1)
  assert.equal(combined.split(input.targetCustomerGuess).length - 1, 1)
  assert.doesNotMatch(combined, /rawInput|businessInput/)
})

test('complete baseline plan stays local and only its compact digest enters the patch prompt', () => {
  const input = makeBusiness()
  const brief = buildBusinessBrief(input)
  const baseline = generateMarketingPlan(input)
  const digest = buildBaselineDigest(baseline, brief)
  const prompt = buildStrategyPatchPrompt({ businessBrief: brief, baselineDigest: digest })

  assert.ok(prompt.baselineDigestChars > 0)
  assert.doesNotMatch(prompt.userPrompt, /baselinePlan|businessSummary|marketingMix7p|qualityScore/)
  assert.equal(prompt.userPrompt.includes(JSON.stringify(baseline)), false)
  assert.ok(JSON.stringify(digest).length < JSON.stringify(baseline).length)
})

test('built-in sample explicitly skips clarification and an edit clears the stale sample origin', () => {
  const assessment = assessBusinessCompleteness(buildBusinessBrief(makeBusiness()))
  assert.equal(builtInSampleOrigin.source, 'built_in_sample')
  assert.equal(builtInSampleOrigin.skipClarification, true)
  assert.equal(assessment.questions.length, 0)

  const edited = originAfterMeaningfulEdit(builtInSampleOrigin, true)
  assert.equal(edited.source, 'user')
  assert.equal(edited.skipClarification, false)
  assert.equal(originAfterMeaningfulEdit(builtInSampleOrigin, false), builtInSampleOrigin)
})

test('complete normal business skips questions while incomplete input receives 3-6 unique relevant questions', () => {
  const complete = assessBusinessCompleteness(buildBusinessBrief(b2bSaas))
  const incomplete = assessBusinessCompleteness(buildBusinessBrief(veryIncomplete))

  assert.equal(complete.sufficient, true)
  assert.equal(complete.questions.length, 0)
  assert.equal(incomplete.sufficient, false)
  assert.ok(incomplete.questions.length >= 3 && incomplete.questions.length <= 6)
  assert.equal(new Set(incomplete.questions.map((item) => item.id)).size, incomplete.questions.length)
  assert.ok(incomplete.questions.every((item) => item.question.length > 20 && item.whyItMatters.length > 20))
})

test('representative B2B SaaS, local, consulting, and online retail scenarios keep a complete deterministic plan', () => {
  const scenarios = [b2bSaas, localCafe, consulting, onlineRetail]
  for (const input of scenarios) assertCompletePlan(generateMarketingPlan(input))

  const localPlan = generateMarketingPlan(localCafe)
  assert.match(`${localPlan.targetMarket} ${localPlan.channelStrategy.join(' ')}`, /محل|منطقه|ارجاع|شبکه|آفلاین|وب/i)
  const consultingPlan = generateMarketingPlan(consulting)
  assert.match(`${consultingPlan.valueProposition} ${consultingPlan.channelStrategy.join(' ')}`, /اعتماد|محتوا|ارجاع|تخصص|وب/i)
  const retailPlan = generateMarketingPlan(onlineRetail)
  assert.match(`${retailPlan.funnelJourney.join(' ')} ${retailPlan.kpiDashboard.map((item) => item.metric).join(' ')}`, /تبدیل|خرید|Conversion|فروش|CTR/i)
})

test('KPI, Markdown, DOCX, PDF, and print contracts remain valid', async () => {
  const plan = generateMarketingPlan(b2bSaas)
  assert.ok(plan.kpiDashboard.length >= 3)
  assert.ok(plan.kpiDashboard.every((item) => item.metric && item.value && item.benchmark))
  const markdown = exportMarketingPlanToMarkdown(plan, b2bSaas.businessName)
  const word = exportMarketingPlanToWordHtml(plan, b2bSaas.businessName)
  assert.match(markdown, /LeadFlow/)
  assert.match(markdown, /KPI/)
  assert.match(word, /<html/i)
  assert.match(word, /LeadFlow/)
  const report = createReportPresentation(plan, b2bSaas.businessName)
  assert.equal(report.chapters.flatMap((chapter) => chapter.sections).length, 17)
  assert.equal(report.chapters.flatMap((chapter) => chapter.sections).find((section) => section.kind === 'kpis')?.kpis?.length, 6)
  const printDocument = createPrintableReportHtml(report, 'pdf', false)
  assert.match(printDocument, /dir="rtl"/)
  assert.match(printDocument, /@page\{size:A4 portrait/)
  const docx = await createMarketingPlanDocx(report)
  assert.equal(docx.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  assert.deepEqual([...new Uint8Array(await docx.arrayBuffer()).slice(0, 2)], [0x50, 0x4b])
  assert.equal(marketingPlanDocxFileName(b2bSaas.businessName), 'LeadFlow-marketing-plan.docx')
  assert.equal(marketingPlanPdfFileName(b2bSaas.businessName), 'LeadFlow-marketing-plan.pdf')
  const appStyles = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  assert.match(appStyles, /@media print/)
  assert.match(appStyles, /\.app--has-plan/)
})

test('UI keeps internal-only, enhanced, and partially enhanced outcomes distinct', () => {
  const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(appSource, /'internal_only'/)
  assert.match(appSource, /'ai_enhanced'/)
  assert.match(appSource, /'ai_partially_enhanced'/)
  assert.match(appSource, /برنامه کامل با موتور داخلی MarketPilot تولید شد؛ بهبود هوش مصنوعی اعمال نشد/)
  assert.match(appSource, /merged\.diagnostic\.rejectedPatchAreas\.length > 0/)
})

function assertCompletePlan(plan: MarketingPlan): void {
  assert.ok(plan.businessSummary)
  assert.ok(plan.customerDevelopmentStage)
  assert.ok(plan.marketSegments.length)
  assert.ok(plan.targetMarket)
  assert.ok(plan.positioningStatement)
  assert.ok(plan.customerPersonas.length)
  assert.ok(plan.valueProposition)
  assert.ok(plan.usp)
  assert.ok(plan.competitorAnalysis.length)
  assert.ok(Object.keys(plan.marketingMix7p).length)
  assert.ok(plan.funnelJourney.length)
  assert.ok(plan.channelStrategy.length)
  assert.ok(plan.pricingRecommendation)
  assert.ok(plan.kpiDashboard.length)
  assert.ok(plan.actionPlan.length)
  assert.ok(plan.risksAssumptions.length)
  assert.ok(plan.qualityScore.maxScore > 0)
}
