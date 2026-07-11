import type { MarketingPlan } from '../types'
import { kpiDefinitions } from '../data/kpiFramework'

const sectionTitles = {
  businessSummary: '1. خلاصه کسب‌وکار',
  customerDevelopment: '2. مرحله توسعه مشتری',
  marketSegments: '3. بخش‌های بازار',
  targetMarket: '4. بازار هدف',
  positioning: '5. بیانیه جایگاه‌یابی',
  personas: '6. پرسونای مشتریان',
  valueProposition: '7. ارزش پیشنهادی',
  usp: '8. پیشنهاد فروش منحصربه‌فرد (USP)',
  competitors: '9. تحلیل رقبا و جایگزین‌ها',
  marketingMix: '10. آمیخته بازاریابی 7P',
  funnel: '11. قیف و سفر مشتری',
  channels: '12. استراتژی کانال دیجیتال',
  pricing: '13. پیشنهاد اولیه قیمت‌گذاری',
  kpis: '14. داشبورد KPI',
  actionPlan: '15. برنامه اقدام ۳۰ روزه',
  risks: '16. ریسک‌ها و فرضیات',
  quality: '17. امتیاز کیفیت برنامه بازاریابی',
}

function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|')
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

function splitEntry(entry: string): { label: string; value: string } {
  const colonIdx = entry.indexOf(':')
  if (colonIdx === -1) {
    return { label: entry, value: '' }
  }

  return {
    label: entry.slice(0, colonIdx).trim(),
    value: entry.slice(colonIdx + 1).trim(),
  }
}

function htmlList(items: string[]): string {
  return `<ul>${items.map(item => `<li>${formatHtmlText(item)}</li>`).join('')}</ul>`
}

function htmlPanelList(items: string[]): string {
  return items.map(item => `<div class="panel">${formatHtmlText(item)}</div>`).join('')
}

export function exportMarketingPlanToMarkdown(plan: MarketingPlan, businessName: string): string {
  const { score, maxScore, details } = plan.qualityScore

  const lines: string[] = []

  lines.push(`# برنامه بازاریابی: ${businessName || 'بدون عنوان'}`)
  lines.push('')
  lines.push('> این خروجی از ورودی‌های ساختاریافته کسب‌وکار تولید شده و یک پیش‌نویس اولیه برای اعتبارسنجی بازار است.')
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push(`## ${sectionTitles.businessSummary}`)
  lines.push('')
  lines.push(plan.businessSummary)
  lines.push('')

  lines.push(`## ${sectionTitles.customerDevelopment}`)
  lines.push('')
  lines.push(plan.customerDevelopmentStage)
  lines.push('')

  lines.push(`## ${sectionTitles.marketSegments}`)
  lines.push('')
  plan.marketSegments.forEach((s) => {
    lines.push(`- ${s}`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.targetMarket}`)
  lines.push('')
  lines.push(plan.targetMarket)
  lines.push('')

  lines.push(`## ${sectionTitles.positioning}`)
  lines.push('')
  lines.push(plan.positioningStatement)
  lines.push('')

  lines.push(`## ${sectionTitles.personas}`)
  lines.push('')
  plan.customerPersonas.forEach((p) => {
    lines.push(`- ${p.replace(/\n/g, '\n  ')}`)
    lines.push('')
  })
  lines.push('')

  lines.push(`## ${sectionTitles.valueProposition}`)
  lines.push('')
  lines.push(plan.valueProposition)
  lines.push('')

  lines.push(`## ${sectionTitles.usp}`)
  lines.push('')
  lines.push(plan.usp)
  lines.push('')

  lines.push(`## ${sectionTitles.competitors}`)
  lines.push('')
  plan.competitorAnalysis.forEach((c) => {
    lines.push(`- ${c}`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.marketingMix}`)
  lines.push('')
  lines.push('| عنصر | توضیح |')
  lines.push('|---|---|')
  Object.entries(plan.marketingMix7p).forEach(([key, value]) => {
    lines.push(`| **${key}** | ${escapePipe(value)} |`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.funnel}`)
  lines.push('')
  lines.push('| مرحله | توضیح |')
  lines.push('|---|---|')
  plan.funnelJourney.forEach((entry) => {
    const { label, value } = splitEntry(entry)
    lines.push(`| **${escapePipe(label)}** | ${escapePipe(value)} |`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.channels}`)
  lines.push('')
  plan.channelStrategy.forEach((c) => {
    lines.push(`- ${c}`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.pricing}`)
  lines.push('')
  lines.push(plan.pricingRecommendation)
  lines.push('')

  lines.push(`## ${sectionTitles.kpis}`)
  lines.push('')
  plan.kpiDashboard.forEach((k) => {
    const def = kpiDefinitions[k.metric]
    const stage = def?.funnelStage ?? '—'
    const formula = def?.formula ?? '—'
    const priority = def?.priority ?? 'Medium'
    lines.push(`### ${k.metric}`)
    lines.push(`- **مرحله قیف:** ${stage}`)
    lines.push(`- **فرمول:** ${formula}`)
    lines.push(`- **اولویت:** ${priority}`)
    lines.push(`- **هدف:** ${k.value}`)
    lines.push(`- **معیار مقایسه:** ${k.benchmark}`)
    lines.push(`- **تفسیر:** ${k.interpretation}`)
    lines.push('')
  })
  lines.push('')

  lines.push(`## ${sectionTitles.actionPlan}`)
  lines.push('')
  plan.actionPlan.forEach((entry) => {
    const { label, value } = splitEntry(entry)
    if (!value) {
      lines.push(`- ${label}`)
    } else {
      lines.push(`**${label}:**`)
      const subItems = value.split(';').map((s) => s.trim()).filter(Boolean)
      subItems.forEach((item) => {
        lines.push(`  - ${item}`)
      })
    }
    lines.push('')
  })
  lines.push('')

  lines.push(`## ${sectionTitles.risks}`)
  lines.push('')
  plan.risksAssumptions.forEach((r) => {
    lines.push(`- ${r}`)
  })
  lines.push('')

  lines.push(`## ${sectionTitles.quality}`)
  lines.push('')
  lines.push(`**امتیاز: ${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)**`)
  lines.push('')
  details.forEach((d) => {
    lines.push(`- ${d}`)
  })
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push('*تهیه‌شده با MarketPilot AI برای برنامه‌ریزی منسجم، سنجش‌پذیر و قابل اجرا.*')

  return lines.join('\n')
}

export function exportMarketingPlanToWordHtml(plan: MarketingPlan, businessName: string): string {
  const { score, maxScore, details } = plan.qualityScore
  const title = `برنامه بازاریابی: ${businessName || 'بدون عنوان'}`
  const pct = Math.round((score / maxScore) * 100)

  const marketingMixRows = Object.entries(plan.marketingMix7p).map(([key, value]) => (
    `<tr><td><strong>${escapeHtml(key)}</strong></td><td>${formatHtmlText(value)}</td></tr>`
  )).join('')

  const funnelRows = plan.funnelJourney.map((entry) => {
    const { label, value } = splitEntry(entry)
    return `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${formatHtmlText(value)}</td></tr>`
  }).join('')

  const kpiRows = plan.kpiDashboard.map((k) => {
    const def = kpiDefinitions[k.metric]
    return `
      <tr>
        <td><strong>${escapeHtml(k.metric)}</strong></td>
        <td>${escapeHtml(def?.funnelStage ?? '—')}</td>
        <td>${escapeHtml(def?.formula ?? '—')}</td>
        <td>${escapeHtml(k.value)}</td>
        <td>${escapeHtml(k.benchmark)}</td>
        <td>${formatHtmlText(k.interpretation)}</td>
      </tr>
    `
  }).join('')

  const actionPlanHtml = plan.actionPlan.map((entry) => {
    const { label, value } = splitEntry(entry)
    if (!value) {
      return `<li>${formatHtmlText(label)}</li>`
    }

    const subItems = value.split(';').map((s) => s.trim()).filter(Boolean)
    return `<li><strong>${escapeHtml(label)}:</strong>${htmlList(subItems)}</li>`
  }).join('')

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      direction: rtl;
      font-family: Tahoma, "Segoe UI", Arial, sans-serif;
      color: #111827;
      line-height: 1.75;
      margin: 32px;
      max-width: 900px;
    }
    h1, h2, h3 {
      color: #1e293b;
      line-height: 1.4;
      page-break-after: avoid;
    }
    h1 {
      font-size: 24px;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 18px;
      margin-top: 26px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    p, li, td, th, .panel {
      unicode-bidi: plaintext;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 18px;
      direction: rtl;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      vertical-align: top;
      text-align: right;
    }
    th {
      background: #eef2ff;
      font-weight: 700;
    }
    ul {
      padding-right: 22px;
      margin: 8px 0 16px;
    }
    .panel {
      border: 1px solid #e5e7eb;
      background: #f8fafc;
      padding: 10px 12px;
      margin: 8px 0;
    }
    .note {
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <h2>${sectionTitles.businessSummary}</h2>
  <p>${formatHtmlText(plan.businessSummary)}</p>

  <h2>${sectionTitles.customerDevelopment}</h2>
  <p>${formatHtmlText(plan.customerDevelopmentStage)}</p>

  <h2>${sectionTitles.marketSegments}</h2>
  ${htmlList(plan.marketSegments)}

  <h2>${sectionTitles.targetMarket}</h2>
  <p>${formatHtmlText(plan.targetMarket)}</p>

  <h2>${sectionTitles.positioning}</h2>
  <p>${formatHtmlText(plan.positioningStatement)}</p>

  <h2>${sectionTitles.personas}</h2>
  ${htmlPanelList(plan.customerPersonas)}

  <h2>${sectionTitles.valueProposition}</h2>
  <p>${formatHtmlText(plan.valueProposition)}</p>

  <h2>${sectionTitles.usp}</h2>
  <p>${formatHtmlText(plan.usp)}</p>

  <h2>${sectionTitles.competitors}</h2>
  ${htmlList(plan.competitorAnalysis)}

  <h2>${sectionTitles.marketingMix}</h2>
  <table>
    <thead><tr><th>عنصر</th><th>توضیح</th></tr></thead>
    <tbody>${marketingMixRows}</tbody>
  </table>

  <h2>${sectionTitles.funnel}</h2>
  <table>
    <thead><tr><th>مرحله</th><th>توضیح</th></tr></thead>
    <tbody>${funnelRows}</tbody>
  </table>

  <h2>${sectionTitles.channels}</h2>
  ${htmlList(plan.channelStrategy)}

  <h2>${sectionTitles.pricing}</h2>
  <p>${formatHtmlText(plan.pricingRecommendation)}</p>

  <h2>${sectionTitles.kpis}</h2>
  <table>
    <thead>
      <tr>
        <th>سنجه</th>
        <th>مرحله قیف</th>
        <th>فرمول</th>
        <th>هدف</th>
        <th>معیار مقایسه</th>
        <th>تفسیر</th>
      </tr>
    </thead>
    <tbody>${kpiRows}</tbody>
  </table>

  <h2>${sectionTitles.actionPlan}</h2>
  <ul>${actionPlanHtml}</ul>

  <h2>${sectionTitles.risks}</h2>
  ${htmlList(plan.risksAssumptions)}

  <h2>${sectionTitles.quality}</h2>
  <p><strong>امتیاز: ${score}/${maxScore} (${pct}%)</strong></p>
  ${htmlList(details)}

</body>
</html>`
}
