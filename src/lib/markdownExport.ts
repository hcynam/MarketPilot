import type { MarketingPlan } from '../types'
import { kpiDefinitions } from '../data/kpiFramework'
import { reportChapters, reportSectionTitles as sectionTitles, splitReportEntry } from './reportPresentation'

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatHtmlText(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function htmlList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${formatHtmlText(item)}</li>`).join('')}</ul>`
}

function htmlRows(items: string[]): string {
  return items.map((item) => {
    const { label, value } = splitReportEntry(item)
    return value
      ? `<tr><th scope="row">${escapeHtml(label)}</th><td>${formatHtmlText(value)}</td></tr>`
      : `<tr><td colspan="2">${formatHtmlText(label)}</td></tr>`
  }).join('')
}

function markdownRows(items: string[]): string[] {
  return items.map((item) => {
    const { label, value } = splitReportEntry(item)
    return value
      ? `| **${escapePipe(label)}** | ${escapePipe(value)} |`
      : `|  | ${escapePipe(label)} |`
  })
}

function wordChapter(index: number): string {
  const chapter = reportChapters[index]
  return `<div class="chapter-break"><span>${chapter.index}</span><h1>${chapter.title}</h1><p>${chapter.range}</p></div>`
}

export function exportMarketingPlanToMarkdown(plan: MarketingPlan, businessName: string): string {
  const { score, maxScore, details } = plan.qualityScore
  const pct = Math.round((score / maxScore) * 100)
  const lines: string[] = [
    '# گزارش مدیریتی برنامه بازاریابی',
    '',
    `## ${businessName || 'بدون عنوان'}`,
    '',
    '> این خروجی از ورودی‌های ساختاریافته کسب‌وکار تولید شده و یک پیش‌نویس اولیه برای اعتبارسنجی بازار است.',
    '',
    '**مسیر تصمیم:** ورودی ← تحلیل ← برنامه ← سنجش',
    '',
    '### نمای تصمیم مدیریتی',
    '',
    '| شاخص | مقدار موجود |',
    '|---|---|',
  ]

  if (businessName) lines.push(`| **کسب‌وکار** | ${escapePipe(businessName)} |`)
  if (plan.customerDevelopmentStage) lines.push(`| **مرحله توسعه مشتری** | ${escapePipe(plan.customerDevelopmentStage)} |`)
  if (plan.targetMarket) lines.push(`| **بازار هدف** | ${escapePipe(plan.targetMarket)} |`)
  if (plan.valueProposition) lines.push(`| **ارزش پیشنهادی** | ${escapePipe(plan.valueProposition)} |`)
  if (plan.pricingRecommendation) lines.push(`| **جهت قیمت‌گذاری** | ${escapePipe(plan.pricingRecommendation)} |`)
  lines.push(`| **سنجه‌های تعریف‌شده** | ${plan.kpiDashboard.length.toLocaleString('fa-IR')} |`)
  lines.push(`| **کیفیت برنامه** | ${score}/${maxScore} (${pct}%) |`)
  lines.push('')
  lines.push('---', '', `## فصل ${reportChapters[0].index} — ${reportChapters[0].title}`, `_${reportChapters[0].range}_`, '')

  lines.push(`### ${sectionTitles.businessSummary}`, '', plan.businessSummary, '')
  lines.push(`### ${sectionTitles.customerDevelopment}`, '', plan.customerDevelopmentStage, '')
  lines.push(`### ${sectionTitles.marketSegments}`, '', '| بُعد | شرح |', '|---|---|', ...markdownRows(plan.marketSegments), '')
  lines.push(`### ${sectionTitles.targetMarket}`, '', plan.targetMarket, '')

  lines.push('---', '', `## فصل ${reportChapters[1].index} — ${reportChapters[1].title}`, `_${reportChapters[1].range}_`, '')
  lines.push(`### ${sectionTitles.positioning}`, '', `> ${plan.positioningStatement.replace(/\n/g, '\n> ')}`, '')
  lines.push(`### ${sectionTitles.personas}`, '')
  plan.customerPersonas.forEach((persona, index) => {
    const linesInPersona = persona.split('\n').filter(Boolean)
    lines.push(`#### پروفایل ${index + 1}: ${linesInPersona[0] ?? ''}`)
    linesInPersona.slice(1).forEach((line) => lines.push(`- ${line.replace(/^•\s*/, '')}`))
    lines.push('')
  })
  lines.push(`### ${sectionTitles.valueProposition}`, '', plan.valueProposition, '')
  lines.push(`### ${sectionTitles.usp}`, '', `> **USP:** ${plan.usp.replace(/\n/g, '\n> ')}`, '')
  lines.push(`### ${sectionTitles.competitors}`, '', '| موضوع | تحلیل موجود |', '|---|---|', ...markdownRows(plan.competitorAnalysis), '')

  lines.push('---', '', `## فصل ${reportChapters[2].index} — ${reportChapters[2].title}`, `_${reportChapters[2].range}_`, '')
  lines.push(`### ${sectionTitles.marketingMix}`, '', '| عنصر | توضیح |', '|---|---|')
  Object.entries(plan.marketingMix7p).forEach(([key, value]) => lines.push(`| **${escapePipe(key)}** | ${escapePipe(value)} |`))
  lines.push('', `### ${sectionTitles.funnel}`, '', '| مرحله | توضیح |', '|---|---|', ...markdownRows(plan.funnelJourney), '')
  lines.push(`### ${sectionTitles.channels}`, '', '| محور کانال | راهبرد |', '|---|---|', ...markdownRows(plan.channelStrategy), '')

  lines.push('---', '', `## فصل ${reportChapters[3].index} — ${reportChapters[3].title}`, `_${reportChapters[3].range}_`, '')
  lines.push(`### ${sectionTitles.pricing}`, '', `> **جهت قیمت‌گذاری موجود:** ${plan.pricingRecommendation.replace(/\n/g, '\n> ')}`, '')

  lines.push('---', '', `## فصل ${reportChapters[4].index} — ${reportChapters[4].title}`, `_${reportChapters[4].range}_`, '')
  lines.push(`### ${sectionTitles.kpis}`, '', '| سنجه | مرحله قیف | فرمول | اولویت | هدف | معیار مقایسه | تفسیر |', '|---|---|---|---|---|---|---|')
  plan.kpiDashboard.forEach((kpi) => {
    const def = kpiDefinitions[kpi.metric]
    lines.push(`| **${escapePipe(kpi.metric)}** | ${escapePipe(def?.funnelStage ?? '—')} | \`${escapePipe(def?.formula ?? '—')}\` | ${escapePipe(def?.priority ?? 'Medium')} | ${escapePipe(kpi.value)} | ${escapePipe(kpi.benchmark)} | ${escapePipe(kpi.interpretation)} |`)
  })
  lines.push('', `### ${sectionTitles.actionPlan}`, '')
  plan.actionPlan.forEach((entry) => {
    const { label, value } = splitReportEntry(entry)
    const tasks = value.split(';').map((item) => item.trim()).filter(Boolean)
    if (tasks.length === 0) lines.push(`- [ ] ${entry}`)
    else tasks.forEach((task) => lines.push(`- [ ] **${label}:** ${task}`))
  })
  lines.push('', `### ${sectionTitles.risks}`, '', '| نوع | شرح موجود |', '|---|---|', ...markdownRows(plan.risksAssumptions), '')
  lines.push(`### ${sectionTitles.quality}`, '', `**امتیاز: ${score}/${maxScore} (${pct}%)**`, '')
  details.forEach((detail) => {
    const passed = /^[✓✔]/.test(detail)
    lines.push(`- [${passed ? 'x' : ' '}] ${detail.replace(/^[✓✔○]\s*/, '')}`)
  })
  lines.push('', '---', '', '*تهیه‌شده با MarketPilot AI برای برنامه‌ریزی منسجم، سنجش‌پذیر و قابل اجرا.*')
  return lines.join('\n')
}

export function exportMarketingPlanToWordHtml(plan: MarketingPlan, businessName: string): string {
  const { score, maxScore, details } = plan.qualityScore
  const pct = Math.round((score / maxScore) * 100)
  const title = `برنامه بازاریابی: ${businessName || 'بدون عنوان'}`
  const mixRows = Object.entries(plan.marketingMix7p).map(([key, value]) => `<tr><th scope="row">${escapeHtml(key)}</th><td>${formatHtmlText(value)}</td></tr>`).join('')
  const kpiRows = plan.kpiDashboard.map((kpi) => {
    const def = kpiDefinitions[kpi.metric]
    return `<tr><th scope="row">${escapeHtml(kpi.metric)}</th><td>${escapeHtml(def?.funnelStage ?? '—')}</td><td class="ltr">${escapeHtml(def?.formula ?? '—')}</td><td>${escapeHtml(def?.priority ?? 'Medium')}</td><td>${formatHtmlText(kpi.value)}</td><td>${formatHtmlText(kpi.benchmark)}</td><td>${formatHtmlText(kpi.interpretation)}</td></tr>`
  }).join('')
  const personaHtml = plan.customerPersonas.map((persona) => {
    const lines = persona.split('\n').filter(Boolean)
    return `<div class="profile"><h3>${escapeHtml(lines[0] ?? '')}</h3>${htmlList(lines.slice(1).map((line) => line.replace(/^•\s*/, '')))}</div>`
  }).join('')
  const actionRows = plan.actionPlan.map((entry) => {
    const { label, value } = splitReportEntry(entry)
    const tasks = value.split(';').map((item) => item.trim()).filter(Boolean)
    return `<tr><th scope="row">${escapeHtml(label)}</th><td>${tasks.length ? htmlList(tasks) : formatHtmlText(entry)}</td></tr>`
  }).join('')

  return `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
@page Section1 { size: A4; margin: 20mm 18mm 18mm; mso-header: h1; mso-footer: f1; }
body { direction: rtl; font-family: Tahoma, "Segoe UI", Arial, sans-serif; color: #18302f; line-height: 1.75; margin: 0; }
.Section1 { page: Section1; }
.word-header, .word-footer { color: #526d6b; font-size: 9pt; }
.word-header { mso-element: header; border-bottom: 1px solid #9eb5b1; padding-bottom: 4pt; }
.word-footer { mso-element: footer; text-align: center; }
.cover { box-sizing: border-box; height: 600pt; page-break-after: always; padding-top: 60pt; }
.brand { color: #0e5e5a; font-size: 12pt; font-weight: bold; letter-spacing: 1pt; }
.cover-title { color: #102a2a; font-size: 30pt; line-height: 1.3; margin: 18pt 0 8pt; }
.cover-business { color: #0e5e5a; font-size: 20pt; margin: 0 0 30pt; }
.decision-path { width: 100%; border-collapse: separate; border-spacing: 8pt; margin: 24pt 0; }
.decision-path td { text-align: center; border: 1px solid #0e5e5a; background: #eaf0ee; padding: 10pt 4pt; font-weight: bold; }
.cover-note { color: #526d6b; border-top: 2px solid #d66a3a; padding-top: 10pt; }
.snapshot { margin: 0 0 24pt; }
.chapter-break { page-break-before: always; border-top: 4pt solid #0e5e5a; padding-top: 12pt; margin-bottom: 18pt; }
.chapter-break span { color: #d66a3a; font-size: 18pt; font-weight: bold; }
.chapter-break h1 { display: inline; margin-right: 10pt; color: #102a2a; font-size: 20pt; }
.chapter-break p { color: #526d6b; margin: 4pt 0 0; }
h2 { color: #102a2a; font-size: 15pt; margin: 20pt 0 8pt; padding-bottom: 5pt; border-bottom: 1px solid #cbd8d5; page-break-after: avoid; }
h3 { color: #0e5e5a; font-size: 11pt; margin: 5pt 0; page-break-after: avoid; }
p, li, td, th { unicode-bidi: plaintext; orphans: 3; widows: 3; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0 16pt; direction: rtl; page-break-inside: auto; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #9eb5b1; padding: 7pt 8pt; vertical-align: top; text-align: right; }
thead th { background: #dcebea; color: #102a2a; font-weight: bold; }
tbody th { width: 27%; background: #f4f7f6; color: #102a2a; }
ul { margin: 4pt 0 10pt; padding-right: 18pt; }
.snapshot th { width: 25%; }
.callout { border: 1px solid #9eb5b1; background: #f4f7f6; padding: 10pt 12pt; page-break-inside: avoid; }
.profile { border: 1px solid #cbd8d5; padding: 9pt 11pt; margin: 7pt 0; page-break-inside: avoid; }
.quality-block { page-break-inside: avoid; }
.ltr { direction: ltr; text-align: left; unicode-bidi: embed; }
</style></head><body><div class="Section1">
<div class="word-header" id="h1">MarketPilot AI · گزارش مدیریتی برنامه بازاریابی</div>
<div class="word-footer" id="f1">MarketPilot AI</div>
<section class="cover"><div class="brand">MARKETPILOT AI</div><h1 class="cover-title">گزارش مدیریتی برنامه بازاریابی</h1><p class="cover-business">${escapeHtml(businessName || 'بدون عنوان')}</p>
<table class="decision-path"><tr><td>ورودی</td><td>تحلیل</td><td>برنامه</td><td>سنجش</td></tr></table>
<p class="cover-note">گزارش ساختاریافته برای تحلیل بازار، جایگاه‌یابی، کانال، KPI و برنامه اقدام. این سند بر داده‌های موجود برنامه تکیه دارد.</p></section>
<h1>نمای تصمیم مدیریتی</h1><table class="snapshot"><tbody>
${businessName ? `<tr><th>کسب‌وکار</th><td>${escapeHtml(businessName)}</td></tr>` : ''}
<tr><th>مرحله توسعه مشتری</th><td>${formatHtmlText(plan.customerDevelopmentStage)}</td></tr>
<tr><th>بازار هدف</th><td>${formatHtmlText(plan.targetMarket)}</td></tr>
<tr><th>ارزش پیشنهادی</th><td>${formatHtmlText(plan.valueProposition)}</td></tr>
<tr><th>جهت قیمت‌گذاری</th><td>${formatHtmlText(plan.pricingRecommendation)}</td></tr>
<tr><th>سنجه‌های تعریف‌شده</th><td>${plan.kpiDashboard.length.toLocaleString('fa-IR')}</td></tr>
<tr><th>کیفیت برنامه</th><td>${score}/${maxScore} (${pct}%)</td></tr></tbody></table>
${wordChapter(0)}
<h2>${sectionTitles.businessSummary}</h2><p>${formatHtmlText(plan.businessSummary)}</p>
<h2>${sectionTitles.customerDevelopment}</h2><p>${formatHtmlText(plan.customerDevelopmentStage)}</p>
<h2>${sectionTitles.marketSegments}</h2><table><thead><tr><th>بُعد</th><th>شرح</th></tr></thead><tbody>${htmlRows(plan.marketSegments)}</tbody></table>
<h2>${sectionTitles.targetMarket}</h2><p>${formatHtmlText(plan.targetMarket)}</p>
${wordChapter(1)}
<h2>${sectionTitles.positioning}</h2><div class="callout">${formatHtmlText(plan.positioningStatement)}</div>
<h2>${sectionTitles.personas}</h2>${personaHtml}
<h2>${sectionTitles.valueProposition}</h2><p>${formatHtmlText(plan.valueProposition)}</p>
<h2>${sectionTitles.usp}</h2><div class="callout">${formatHtmlText(plan.usp)}</div>
<h2>${sectionTitles.competitors}</h2><table><thead><tr><th>موضوع</th><th>تحلیل موجود</th></tr></thead><tbody>${htmlRows(plan.competitorAnalysis)}</tbody></table>
${wordChapter(2)}
<h2>${sectionTitles.marketingMix}</h2><table><thead><tr><th>عنصر</th><th>توضیح</th></tr></thead><tbody>${mixRows}</tbody></table>
<h2>${sectionTitles.funnel}</h2><table><thead><tr><th>مرحله</th><th>توضیح</th></tr></thead><tbody>${htmlRows(plan.funnelJourney)}</tbody></table>
<h2>${sectionTitles.channels}</h2><table><thead><tr><th>محور کانال</th><th>راهبرد</th></tr></thead><tbody>${htmlRows(plan.channelStrategy)}</tbody></table>
${wordChapter(3)}
<h2>${sectionTitles.pricing}</h2><div class="callout">${formatHtmlText(plan.pricingRecommendation)}</div>
${wordChapter(4)}
<h2>${sectionTitles.kpis}</h2><table><thead><tr><th>سنجه</th><th>مرحله قیف</th><th>فرمول</th><th>اولویت</th><th>هدف</th><th>معیار مقایسه</th><th>تفسیر</th></tr></thead><tbody>${kpiRows}</tbody></table>
<h2>${sectionTitles.actionPlan}</h2><table><thead><tr><th>بازه</th><th>اقدام‌ها</th></tr></thead><tbody>${actionRows}</tbody></table>
<h2>${sectionTitles.risks}</h2><table><thead><tr><th>نوع</th><th>شرح موجود</th></tr></thead><tbody>${htmlRows(plan.risksAssumptions)}</tbody></table>
<section class="quality-block"><h2>${sectionTitles.quality}</h2><p><strong>امتیاز: ${score}/${maxScore} (${pct}%)</strong></p>${htmlList(details)}</section>
</div></body></html>`
}
