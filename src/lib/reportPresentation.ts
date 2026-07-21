import { kpiDefinitions } from '../data/kpiFramework'
import type { MarketingPlan } from '../types'

export const reportSectionTitles = {
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
} as const

export const reportChapters = [
  { index: '۰۱', title: 'شناخت کسب‌وکار و بازار', range: 'بخش‌های ۱ تا ۴' },
  { index: '۰۲', title: 'جایگاه و پیشنهاد ارزش', range: 'بخش‌های ۵ تا ۹' },
  { index: '۰۳', title: 'استراتژی و کانال‌ها', range: 'بخش‌های ۱۰ تا ۱۲' },
  { index: '۰۴', title: 'قیمت‌گذاری و اجرا', range: 'بخش ۱۳' },
  { index: '۰۵', title: 'KPI، اقدام و ریسک', range: 'بخش‌های ۱۴ تا ۱۷' },
] as const

export function splitReportEntry(entry: string): { label: string; value: string } {
  const colonIndex = entry.indexOf(':')
  if (colonIndex < 0) return { label: entry.trim(), value: '' }
  return {
    label: entry.slice(0, colonIndex).trim(),
    value: entry.slice(colonIndex + 1).trim(),
  }
}

export type ReportRow = {
  label: string
  value: string
}

export type ReportKpi = {
  metric: string
  funnelStage: string
  formula: string
  priority: string
  frequency: string
  target: string
  benchmark: string
  interpretation: string
}

export type ReportSection = {
  key: keyof typeof reportSectionTitles
  title: string
  kind: 'prose' | 'callout' | 'table' | 'personas' | 'mix' | 'funnel' | 'kpis' | 'timeline' | 'risks' | 'quality'
  text?: string
  rows?: ReportRow[]
  personas?: Array<{ title: string; details: string[] }>
  kpis?: ReportKpi[]
  quality?: { score: number; maxScore: number; percent: number; details: string[] }
}

export type ReportPresentation = {
  metadata: {
    businessName: string
    title: string
    language: 'fa'
    direction: 'rtl'
  }
  decisionPath: string[]
  executiveSnapshot: ReportRow[]
  chapters: Array<{
    index: string
    title: string
    range: string
    sections: ReportSection[]
  }>
  sectionCount: 17
}

function rows(items: string[]): ReportRow[] {
  return items.map((item) => {
    const { label, value } = splitReportEntry(item)
    return { label: value ? label : '', value: value || label }
  })
}

function personas(items: string[]): Array<{ title: string; details: string[] }> {
  return items.map((item) => {
    const lines = item.split('\n').map((line) => line.trim()).filter(Boolean)
    return {
      title: lines[0] ?? '',
      details: lines.slice(1).map((line) => line.replace(/^[•]\s*/, '')),
    }
  })
}

export function createReportPresentation(plan: MarketingPlan, businessName: string): ReportPresentation {
  const safeBusinessName = businessName.trim() || 'بدون عنوان'
  const { score, maxScore, details } = plan.qualityScore
  const sections: Record<keyof typeof reportSectionTitles, ReportSection> = {
    businessSummary: { key: 'businessSummary', title: reportSectionTitles.businessSummary, kind: 'prose', text: plan.businessSummary },
    customerDevelopment: { key: 'customerDevelopment', title: reportSectionTitles.customerDevelopment, kind: 'prose', text: plan.customerDevelopmentStage },
    marketSegments: { key: 'marketSegments', title: reportSectionTitles.marketSegments, kind: 'table', rows: rows(plan.marketSegments) },
    targetMarket: { key: 'targetMarket', title: reportSectionTitles.targetMarket, kind: 'prose', text: plan.targetMarket },
    positioning: { key: 'positioning', title: reportSectionTitles.positioning, kind: 'callout', text: plan.positioningStatement },
    personas: { key: 'personas', title: reportSectionTitles.personas, kind: 'personas', personas: personas(plan.customerPersonas) },
    valueProposition: { key: 'valueProposition', title: reportSectionTitles.valueProposition, kind: 'prose', text: plan.valueProposition },
    usp: { key: 'usp', title: reportSectionTitles.usp, kind: 'callout', text: plan.usp },
    competitors: { key: 'competitors', title: reportSectionTitles.competitors, kind: 'table', rows: rows(plan.competitorAnalysis) },
    marketingMix: {
      key: 'marketingMix',
      title: reportSectionTitles.marketingMix,
      kind: 'mix',
      rows: Object.entries(plan.marketingMix7p).map(([label, value]) => ({ label, value })),
    },
    funnel: { key: 'funnel', title: reportSectionTitles.funnel, kind: 'funnel', rows: rows(plan.funnelJourney) },
    channels: { key: 'channels', title: reportSectionTitles.channels, kind: 'table', rows: rows(plan.channelStrategy) },
    pricing: { key: 'pricing', title: reportSectionTitles.pricing, kind: 'callout', text: plan.pricingRecommendation },
    kpis: {
      key: 'kpis',
      title: reportSectionTitles.kpis,
      kind: 'kpis',
      kpis: plan.kpiDashboard.map((kpi) => {
        const definition = kpiDefinitions[kpi.metric]
        return {
          metric: kpi.metric,
          funnelStage: definition?.funnelStage ?? '—',
          formula: definition?.formula ?? '—',
          priority: definition?.priority ?? 'Medium',
          frequency: definition?.frequency ?? '—',
          target: kpi.value,
          benchmark: kpi.benchmark,
          interpretation: kpi.interpretation,
        }
      }),
    },
    actionPlan: { key: 'actionPlan', title: reportSectionTitles.actionPlan, kind: 'timeline', rows: rows(plan.actionPlan) },
    risks: { key: 'risks', title: reportSectionTitles.risks, kind: 'risks', rows: rows(plan.risksAssumptions) },
    quality: {
      key: 'quality',
      title: reportSectionTitles.quality,
      kind: 'quality',
      quality: { score, maxScore, percent: Math.round((score / maxScore) * 100), details },
    },
  }

  return {
    metadata: {
      businessName: safeBusinessName,
      title: 'گزارش مدیریتی برنامه بازاریابی',
      language: 'fa',
      direction: 'rtl',
    },
    decisionPath: ['ورودی', 'تحلیل', 'برنامه', 'سنجش'],
    executiveSnapshot: [
      { label: 'کسب‌وکار', value: safeBusinessName },
      { label: 'مرحله توسعه مشتری', value: plan.customerDevelopmentStage },
      { label: 'بازار هدف', value: plan.targetMarket },
      { label: 'ارزش پیشنهادی', value: plan.valueProposition },
      { label: 'جهت قیمت‌گذاری', value: plan.pricingRecommendation },
      { label: 'سنجه‌های تعریف‌شده', value: plan.kpiDashboard.length.toLocaleString('fa-IR') },
      { label: 'کیفیت برنامه', value: `${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)` },
    ],
    chapters: [
      { ...reportChapters[0], sections: [sections.businessSummary, sections.customerDevelopment, sections.marketSegments, sections.targetMarket] },
      { ...reportChapters[1], sections: [sections.positioning, sections.personas, sections.valueProposition, sections.usp, sections.competitors] },
      { ...reportChapters[2], sections: [sections.marketingMix, sections.funnel, sections.channels] },
      { ...reportChapters[3], sections: [sections.pricing] },
      { ...reportChapters[4], sections: [sections.kpis, sections.actionPlan, sections.risks, sections.quality] },
    ],
    sectionCount: 17,
  }
}
