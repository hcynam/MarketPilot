import type {
  AIFinalMarketingPlanResponse,
  AIKpiItem,
  AIActionPlanItem,
  AIPlanSection,
  AIQualityScore,
} from '../../netlify/functions/_shared/marketingSchemas'
import type { BusinessInput, KPI, MarketingPlan } from '../types'

const keyLabelMap: Record<string, string> = {
  segmentName: 'نام بخش',
  description: 'توضیح',
  pain: 'درد یا مسئله',
  accessPath: 'مسیر دسترسی',
  willingnessToPay: 'تمایل به پرداخت',
  priority: 'اولویت',
  name: 'نام',
  profile: 'پروفایل',
  needs: 'نیازها',
  objections: 'اعتراض‌ها',
  trigger: 'محرک تصمیم',
  message: 'پیام',
  channel: 'کانال',
  funnelStage: 'مرحله قیف',
  goal: 'هدف',
  action: 'اقدام',
  kpi: 'KPI',
  risk: 'ریسک',
  budgetFit: 'تناسب با بودجه',
  element: 'عنصر',
  diagnosis: 'تشخیص',
  recommendation: 'پیشنهاد',
  customerMindset: 'ذهنیت مشتری',
  formula: 'فرمول',
  target: 'هدف عددی',
  reviewFrequency: 'دوره بازبینی',
  riskOrCaution: 'ریسک یا احتیاط',
  successMetric: 'معیار موفقیت',
  strengths: 'نقاط قوت',
  weaknesses: 'نقاط ضعف',
  missingInputs: 'ورودی‌های ناقص',
  improvementSuggestions: 'پیشنهادهای بهبود',
}

const incompleteSectionText =
  'این بخش توسط هوش مصنوعی ناقص تولید شد و نیاز به بازبینی دارد.'

export function adaptAIPlanToMarketingPlan(
  aiPlan: AIFinalMarketingPlanResponse,
  originalInput: BusinessInput,
): MarketingPlan {
  const sections = new Map(aiPlan.sections.map((section) => [section.id, section]))
  const assumptions = aiPlan.assumptions.length > 0
    ? aiPlan.assumptions
    : ['فرضیه مشخصی از سوی هوش مصنوعی گزارش نشده است.']

  return {
    businessSummary: withAssumptions(sectionText(sections.get(1)), assumptions, aiPlan.inputQualityDiagnosis),
    customerDevelopmentStage: sectionText(sections.get(2)),
    marketSegments: sectionList(sections.get(3)),
    targetMarket: sectionText(sections.get(4)),
    positioningStatement: sectionText(sections.get(5)),
    customerPersonas: sectionList(sections.get(6)),
    valueProposition: sectionText(sections.get(7)),
    usp: sectionText(sections.get(8)),
    competitorAnalysis: sectionList(sections.get(9)),
    marketingMix7p: sectionRecord(sections.get(10)),
    funnelJourney: sectionList(sections.get(11)),
    channelStrategy: sectionList(sections.get(12)),
    pricingRecommendation: sectionText(sections.get(13)),
    kpiDashboard: formatAIKpis(aiPlan.kpis),
    actionPlan: formatAIActionPlan(aiPlan.actionPlan30Days),
    risksAssumptions: [
      ...aiPlan.risks,
      ...assumptions.map((assumption) => `فرضیه: ${assumption}`),
    ],
    qualityScore: formatAIQualityScore(aiPlan.qualityScore, originalInput),
  }
}

export function formatAISectionContent(content: unknown): string {
  if (typeof content === 'string') {
    return clean(content)
  }

  if (Array.isArray(content)) {
    const items = content.map((item) => formatAISectionContent(item)).filter(Boolean)
    return items.length > 0 ? items.join('\n') : incompleteSectionText
  }

  if (isRecord(content)) {
    return Object.entries(content)
      .map(([key, value]) => `${humanizeKey(key)}: ${formatAISectionValue(value)}`)
      .filter(Boolean)
      .join('\n')
  }

  return incompleteSectionText
}

export function formatAIKpis(kpis: AIKpiItem[]): KPI[] {
  return kpis.map((kpi) => ({
    metric: kpi.name || 'KPI',
    value: kpi.target || 'نیازمند هدف‌گذاری',
    benchmark: `${kpi.formula || 'روش سنجش نامشخص'} | بازبینی: ${kpi.reviewFrequency || 'نامشخص'}`,
    interpretation: [
      kpi.reason && `دلیل: ${kpi.reason}`,
      kpi.channel && `کانال: ${kpi.channel}`,
      kpi.riskOrCaution && `احتیاط: ${kpi.riskOrCaution}`,
    ].filter(Boolean).join(' | ') || incompleteSectionText,
  }))
}

export function formatAIActionPlan(items: AIActionPlanItem[]): string[] {
  return items
    .slice()
    .sort((a, b) => a.week - b.week)
    .map((item) => {
      const actions = item.actions.length > 0 ? item.actions.join('; ') : incompleteSectionText
      const metric = item.successMetric ? `; معیار موفقیت: ${item.successMetric}` : ''
      return `هفته ${item.week}: ${item.focus}; ${actions}${metric}`
    })
}

export function formatAIQualityScore(
  quality: AIQualityScore,
  originalInput: BusinessInput,
): MarketingPlan['qualityScore'] {
  const details = [
    ...quality.strengths.map((item) => `✓ نقطه قوت: ${item}`),
    ...quality.weaknesses.map((item) => `○ ضعف: ${item}`),
    ...quality.missingInputs.map((item) => `○ ورودی ناقص: ${item}`),
    ...quality.improvementSuggestions.map((item) => `○ پیشنهاد بهبود: ${item}`),
  ]

  if (details.length === 0) {
    details.push(`○ کیفیت برنامه برای ${originalInput.businessName || 'این کسب‌وکار'} نیازمند بازبینی دستی است.`)
  }

  return {
    score: clampScore(quality.score),
    maxScore: 100,
    details,
  }
}

function sectionText(section: AIPlanSection | undefined): string {
  if (!section) return incompleteSectionText
  const text = formatAISectionContent(section.content)
  return text.trim() || incompleteSectionText
}

function sectionList(section: AIPlanSection | undefined): string[] {
  if (!section) return [incompleteSectionText]
  if (Array.isArray(section.content)) {
    const items = section.content.map((item) => formatAISectionContent(item)).filter(Boolean)
    return items.length > 0 ? items : [incompleteSectionText]
  }

  return splitToList(formatAISectionContent(section.content))
}

function sectionRecord(section: AIPlanSection | undefined): Record<string, string> {
  if (!section) return { 'نیازمند بازبینی': incompleteSectionText }
  if (Array.isArray(section.content)) {
    const entries = section.content
      .map((item, index) => {
        if (isRecord(item)) {
          const label = readString(item.element) || readString(item.title) || `عنصر ${index + 1}`
          return [label, formatAISectionContent(item)] as const
        }
        return [`عنصر ${index + 1}`, formatAISectionContent(item)] as const
      })

    return Object.fromEntries(entries)
  }

  if (isRecord(section.content)) {
    return Object.fromEntries(
      Object.entries(section.content).map(([key, value]) => [humanizeKey(key), formatAISectionValue(value)]),
    )
  }

  return { 'آمیخته بازاریابی': formatAISectionContent(section.content) }
}

function withAssumptions(summary: string, assumptions: string[], diagnosis: string): string {
  return [
    summary,
    diagnosis ? `تشخیص کیفیت ورودی: ${diagnosis}` : '',
    assumptions.length > 0 ? `فرضیات کلیدی: ${assumptions.join('؛ ')}` : '',
  ].filter(Boolean).join('\n')
}

function splitToList(value: string): string[] {
  const items = value
    .split(/\n+|•|؛/)
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : [value || incompleteSectionText]
}

function formatAISectionValue(value: unknown): string {
  if (typeof value === 'string') return clean(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((item) => formatAISectionValue(item)).join('، ')
  if (isRecord(value)) return formatAISectionContent(value)
  return ''
}

function humanizeKey(key: string): string {
  if (keyLabelMap[key]) {
    return keyLabelMap[key]
  }

  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

function clean(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
