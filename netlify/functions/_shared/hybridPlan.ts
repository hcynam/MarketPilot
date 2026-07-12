import {
  requiredMarketingPlanSections,
  type AIFinalMarketingPlanResponse,
  type AIPlanSection,
} from './marketingSchemas'

export type PersianPriority = 'بالا' | 'متوسط' | 'پایین'

export interface BaselineMarketingPlan {
  businessSummary: string
  customerDevelopmentStage: string
  marketSegments: string[]
  targetMarket: string
  positioningStatement: string
  customerPersonas: string[]
  valueProposition: string
  usp: string
  competitorAnalysis: string[]
  marketingMix7p: Record<string, string>
  funnelJourney: string[]
  channelStrategy: string[]
  pricingRecommendation: string
  kpiDashboard: Array<{ metric: string; value: string; benchmark: string; interpretation: string }>
  actionPlan: string[]
  risksAssumptions: string[]
  qualityScore: { score: number; maxScore: number; details: string[] }
}

export interface AIEnhancementPatch {
  summaryInsight: string
  segments: Array<{ name: string; problem: string; accessChannel: string; willingnessToPay: string; priority: PersianPriority }>
  primaryTarget: { name: string; reason: string; whyNow: string }
  positioningStatement: string
  personas: Array<{ name: string; role: string; pain: string; trigger: string; objection: string; message: string }>
  usp: string
  competitors: Array<{ name: string; type: string; strength: string; weakness: string; howToDifferentiate: string }>
  marketingMix7P: Array<{ element: string; recommendation: string; reason: string }>
  funnel: Array<{ stage: string; action: string; channel: string; metric: string }>
  digitalChannels: Array<{ channel: string; priority: PersianPriority; reason: string; firstExperiment: string }>
  pricingRecommendation: { recommendedModel: string; reason: string; introOffer: string; risk: string }
  kpis: Array<{ name: string; target: string; measurement: string; whyItMatters: string; channel: string }>
  thirtyDayPlan: Array<{ week: string; actions: string[]; successMetric: string }>
  risks: Array<{ risk: string; assumption: string; validationTest: string }>
  qualityRationale: string
}

const priorities = new Set<PersianPriority>(['بالا', 'متوسط', 'پایین'])
const sevenP = ['Product', 'Price', 'Place', 'Promotion', 'People', 'Process', 'Physical Evidence']
const funnelStages = ['Awareness', 'Consideration', 'Conversion', 'Retention']
const fillerPatterns = [
  'این بخش بر اساس',
  'نیازمند بازبینی',
  'موضوع:',
  'استفاده از شبکه‌های اجتماعی',
  'تولید محتوای باکیفیت',
]

export function normalizeEnhancementPatch(value: unknown): unknown {
  if (!isRecord(value)) return value
  return {
    summaryInsight: clean(value.summaryInsight),
    segments: records(value.segments).map((item) => ({
      name: clean(item.name), problem: clean(item.problem), accessChannel: clean(item.accessChannel),
      willingnessToPay: clean(item.willingnessToPay), priority: priority(item.priority),
    })),
    primaryTarget: normalizeObject(value.primaryTarget, ['name', 'reason', 'whyNow']),
    positioningStatement: clean(value.positioningStatement),
    personas: records(value.personas).map((item) => ({
      name: clean(item.name), role: clean(item.role), pain: clean(item.pain), trigger: clean(item.trigger),
      objection: clean(item.objection), message: clean(item.message),
    })),
    usp: clean(value.usp),
    competitors: records(value.competitors).map((item) => ({
      name: clean(item.name), type: clean(item.type), strength: clean(item.strength),
      weakness: clean(item.weakness), howToDifferentiate: clean(item.howToDifferentiate),
    })),
    marketingMix7P: records(value.marketingMix7P ?? value.marketingMix7p).map((item) => ({
      element: clean(item.element), recommendation: clean(item.recommendation), reason: clean(item.reason),
    })),
    funnel: records(value.funnel).map((item) => ({
      stage: clean(item.stage), action: clean(item.action), channel: clean(item.channel), metric: clean(item.metric),
    })),
    digitalChannels: records(value.digitalChannels).map((item) => ({
      channel: clean(item.channel), priority: priority(item.priority), reason: clean(item.reason),
      firstExperiment: clean(item.firstExperiment),
    })),
    pricingRecommendation: normalizeObject(value.pricingRecommendation, ['recommendedModel', 'reason', 'introOffer', 'risk']),
    kpis: records(value.kpis).map((item) => ({
      name: clean(item.name), target: clean(item.target), measurement: clean(item.measurement),
      whyItMatters: clean(item.whyItMatters), channel: clean(item.channel),
    })),
    thirtyDayPlan: records(value.thirtyDayPlan).map((item) => ({
      week: clean(item.week), actions: strings(item.actions), successMetric: clean(item.successMetric),
    })),
    risks: records(value.risks).map((item) => ({
      risk: clean(item.risk), assumption: clean(item.assumption), validationTest: clean(item.validationTest),
    })),
    qualityRationale: clean(value.qualityRationale),
  }
}

export function validateEnhancementPatch(value: unknown): { ok: boolean; errors: string[] } {
  if (!isRecord(value)) return { ok: false, errors: ['Patch must be a JSON object.'] }
  const errors: string[] = []
  requireText(value.summaryInsight, 'summaryInsight', errors)
  validateRecords(value.segments, 'segments', 3, ['name', 'problem', 'accessChannel', 'willingnessToPay', 'priority'], errors)
  validateObject(value.primaryTarget, 'primaryTarget', ['name', 'reason', 'whyNow'], errors)
  requireText(value.positioningStatement, 'positioningStatement', errors)
  validateRecords(value.personas, 'personas', 2, ['name', 'role', 'pain', 'trigger', 'objection', 'message'], errors)
  requireText(value.usp, 'usp', errors)
  validateRecords(value.competitors, 'competitors', 3, ['name', 'type', 'strength', 'weakness', 'howToDifferentiate'], errors)
  validateRecords(value.marketingMix7P, 'marketingMix7P', 7, ['element', 'recommendation', 'reason'], errors)
  validateNamedCoverage(value.marketingMix7P, 'element', sevenP, 'marketingMix7P', errors)
  validateRecords(value.funnel, 'funnel', 4, ['stage', 'action', 'channel', 'metric'], errors)
  validateNamedCoverage(value.funnel, 'stage', funnelStages, 'funnel', errors)
  validateRecords(value.digitalChannels, 'digitalChannels', 3, ['channel', 'priority', 'reason', 'firstExperiment'], errors)
  validateObject(value.pricingRecommendation, 'pricingRecommendation', ['recommendedModel', 'reason', 'introOffer', 'risk'], errors)
  validateRecords(value.kpis, 'kpis', 3, ['name', 'target', 'measurement', 'whyItMatters', 'channel'], errors)
  validateRecords(value.thirtyDayPlan, 'thirtyDayPlan', 4, ['week', 'successMetric'], errors)
  records(value.thirtyDayPlan).forEach((item, index) => {
    const actions = strings(item.actions)
    if (actions.length < 2) errors.push(`thirtyDayPlan[${index}].actions needs at least 2 actions.`)
    actions.forEach((action, actionIndex) => requireText(action, `thirtyDayPlan[${index}].actions[${actionIndex}]`, errors))
  })
  validateRecords(value.risks, 'risks', 2, ['risk', 'assumption', 'validationTest'], errors)
  requireText(value.qualityRationale, 'qualityRationale', errors)

  const serialized = JSON.stringify(value)
  if (/"priority"\s*:\s*"(high|medium|low)"/i.test(serialized)) errors.push('Priority labels must be Persian.')
  if (hasRepeatedFiller(serialized)) errors.push('Patch contains repeated filler text.')
  if (findRepeatedLongStrings(value).length > 0) errors.push('Patch repeats the same analytical sentence.')
  return { ok: errors.length === 0, errors: unique(errors) }
}

export function mergeBaselineWithAIPatch(
  baseline: BaselineMarketingPlan,
  patch: AIEnhancementPatch,
  businessInput: Record<string, unknown>,
  clarifyingAnswers: Record<string, unknown>,
): AIFinalMarketingPlanResponse {
  const businessName = clean(businessInput.businessName) || 'کسب‌وکار'
  const choose = (candidate: string, fallback: string) => isUseful(candidate) ? candidate : fallback
  const sections: AIPlanSection[] = [
    section(1, choose(patch.summaryInsight, baseline.businessSummary), 'paragraph'),
    section(2, baseline.customerDevelopmentStage, 'paragraph'),
    section(3, patch.segments.length >= 3 ? patch.segments.map((x) => `${x.name}: مسئله: ${x.problem}؛ مسیر دسترسی: ${x.accessChannel}؛ توان پرداخت: ${x.willingnessToPay}؛ اولویت: ${x.priority}`) : baseline.marketSegments, 'cards'),
    section(4, patch.primaryTarget ? `${patch.primaryTarget.name}: ${patch.primaryTarget.reason}؛ ${patch.primaryTarget.whyNow}` : baseline.targetMarket, 'paragraph'),
    section(5, choose(patch.positioningStatement, baseline.positioningStatement), 'paragraph'),
    section(6, patch.personas.length >= 2 ? patch.personas.map((x) => `${x.name}\n• نقش: ${x.role}\n• درد: ${x.pain}\n• محرک: ${x.trigger}\n• اعتراض: ${x.objection}\n• پیام: ${x.message}`) : baseline.customerPersonas, 'cards'),
    section(7, baseline.valueProposition, 'paragraph'),
    section(8, choose(patch.usp, baseline.usp), 'paragraph'),
    section(9, patch.competitors.length >= 3 ? patch.competitors.map((x) => `${x.name}: نوع: ${x.type}؛ قوت: ${x.strength}؛ ضعف: ${x.weakness}؛ تمایز پیشنهادی: ${x.howToDifferentiate}`) : baseline.competitorAnalysis, 'cards'),
    section(10, patch.marketingMix7P.length === 7 ? Object.fromEntries(patch.marketingMix7P.map((x) => [x.element, `${x.recommendation}؛ دلیل: ${x.reason}`])) : baseline.marketingMix7p, 'table'),
    section(11, patch.funnel.length === 4 ? patch.funnel.map((x) => `${x.stage}: اقدام: ${x.action}؛ کانال: ${x.channel}؛ معیار: ${x.metric}`) : baseline.funnelJourney, 'list'),
    section(12, patch.digitalChannels.length >= 3 ? patch.digitalChannels.map((x) => `${x.channel}: اولویت ${x.priority}؛ دلیل: ${x.reason}؛ آزمایش نخست: ${x.firstExperiment}`) : baseline.channelStrategy, 'list'),
    section(13, patch.pricingRecommendation ? `${patch.pricingRecommendation.recommendedModel}: ${patch.pricingRecommendation.reason}؛ پیشنهاد آغازین: ${patch.pricingRecommendation.introOffer}؛ ریسک: ${patch.pricingRecommendation.risk}` : baseline.pricingRecommendation, 'paragraph'),
    section(14, patch.kpis, 'kpi'),
    section(15, patch.thirtyDayPlan, 'actionPlan'),
    section(16, patch.risks, 'list'),
    section(17, patch.qualityRationale, 'score'),
  ]
  const answerNotes = Object.values(clarifyingAnswers).flatMap((value) => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean)

  return {
    businessName,
    language: 'fa',
    planType: 'برنامه بازاریابی ترکیبی؛ خط مبنا داخلی و تقویت راهبردی Groq',
    inputQualityDiagnosis: choose(patch.summaryInsight, 'برنامه بر خط مبنای داخلی معتبر و داده‌های ورودی استوار است.'),
    assumptions: answerNotes.slice(0, 4),
    sections,
    kpis: patch.kpis.map((x) => ({
      name: x.name, reason: x.whyItMatters, formula: x.measurement, target: x.target,
      channel: `کانال ${x.channel}`, reviewFrequency: 'هفتگی', riskOrCaution: 'هدف پس از مشاهده خط مبنا بازبینی شود.',
    })),
    actionPlan30Days: patch.thirtyDayPlan.map((x, index) => ({
      week: index + 1, focus: x.week, actions: x.actions, successMetric: x.successMetric,
    })),
    risks: patch.risks.map((x) => `${x.risk}؛ فرض: ${x.assumption}؛ آزمون اعتبارسنجی: ${x.validationTest}`),
    qualityScore: {
      score: Math.max(70, Math.min(95, baseline.qualityScore.score + 8)),
      strengths: ['ترکیب خط مبنای قطعی با تحلیل راهبردی اختصاصی'],
      weaknesses: ['نتایج پیشنهادی باید با داده واقعی بازار آزموده شوند'],
      missingInputs: nonEmpty(
        baseline.qualityScore.details.filter((x) => x.includes('○') || x.includes('✗')).slice(0, 3).map(stripMarker).filter(Boolean).concat(answerNotes.length ? [] : ['پاسخ‌های تکمیلی محدودی ثبت شده است']),
        'داده واقعی عملکرد بازار هنوز ثبت نشده است',
      ),
      improvementSuggestions: ['نتایج آزمایش‌های چهار هفته نخست ثبت و برنامه بر اساس شواهد بازبینی شود'],
    },
  }
}

export function baselineToFinalResponse(
  baseline: BaselineMarketingPlan,
  businessInput: Record<string, unknown>,
): AIFinalMarketingPlanResponse {
  const values: Array<[number, unknown, AIPlanSection['contentType']]> = [
    [1, baseline.businessSummary, 'paragraph'], [2, baseline.customerDevelopmentStage, 'paragraph'],
    [3, baseline.marketSegments, 'list'], [4, baseline.targetMarket, 'paragraph'],
    [5, baseline.positioningStatement, 'paragraph'], [6, baseline.customerPersonas, 'cards'],
    [7, baseline.valueProposition, 'paragraph'], [8, baseline.usp, 'paragraph'],
    [9, baseline.competitorAnalysis, 'list'], [10, baseline.marketingMix7p, 'table'],
    [11, baseline.funnelJourney, 'list'], [12, baseline.channelStrategy, 'list'],
    [13, baseline.pricingRecommendation, 'paragraph'], [14, baseline.kpiDashboard, 'kpi'],
    [15, baseline.actionPlan, 'actionPlan'], [16, baseline.risksAssumptions, 'list'],
    [17, baseline.qualityScore, 'score'],
  ]
  const kpis = baseline.kpiDashboard.slice(0, Math.max(3, baseline.kpiDashboard.length)).map((item) => ({
    name: item.metric, reason: item.interpretation, formula: item.benchmark,
    target: item.value, channel: 'کانال‌های منتخب برنامه', reviewFrequency: 'هفتگی',
    riskOrCaution: 'هدف با داده واقعی بازبینی شود.',
  }))
  while (kpis.length < 3) {
    const index = kpis.length + 1
    kpis.push({ name: `شاخص داخلی ${index}`, reason: 'شاخص برگرفته از خط مبنای داخلی', formula: 'ثبت هفتگی', target: 'تعیین خط مبنا', channel: 'کانال منتخب', reviewFrequency: 'هفتگی', riskOrCaution: 'نیازمند داده واقعی' })
  }
  const actions = baseline.actionPlan.slice(0, 4).map((item, index) => ({ week: index + 1, focus: `هفته ${index + 1}`, actions: [item], successMetric: 'ثبت نتیجه قابل‌اندازه‌گیری هفته' }))
  while (actions.length < 4) actions.push({ week: actions.length + 1, focus: `هفته ${actions.length + 1}`, actions: ['اجرای اقدام اولویت‌دار خط مبنا'], successMetric: 'ثبت نتیجه قابل‌اندازه‌گیری هفته' })

  return {
    businessName: clean(businessInput.businessName) || 'کسب‌وکار', language: 'fa',
    planType: 'برنامه بازاریابی موتور تحلیلی داخلی',
    inputQualityDiagnosis: 'به دلیل رد patch هوش مصنوعی، خط مبنای معتبر داخلی حفظ شد.', assumptions: [],
    sections: values.map(([id, content, type]) => section(id, content, type)),
    kpis, actionPlan30Days: actions, risks: baseline.risksAssumptions.length ? baseline.risksAssumptions : ['ریسک‌ها باید با داده واقعی بازار بازبینی شوند.'],
    qualityScore: {
      score: Math.max(0, Math.min(100, baseline.qualityScore.score)),
      strengths: ['خط مبنای قطعی و سازگار با ورودی‌ها'],
      weaknesses: ['patch راهبردی هوش مصنوعی معیار کیفیت را پاس نکرد'],
      missingInputs: ['شواهد واقعی بازار و کمپین تکمیل نشده است'],
      improvementSuggestions: ['پس از تکمیل داده‌ها، تحلیل هوشمند دوباره اجرا شود'],
    },
  }
}

export function evaluateHybridQuality(
  plan: AIFinalMarketingPlanResponse,
  patch: AIEnhancementPatch,
  businessInput: Record<string, unknown>,
): string[] {
  const issues = validateEnhancementPatch(patch).errors
  const content = JSON.stringify(plan)
  const patchContent = JSON.stringify(patch)
  for (const pattern of fillerPatterns) {
    if (occurrences(content, pattern) >= 2) issues.push(`Repeated filler: ${pattern}`)
  }
  const suppliedName = clean(businessInput.businessName).toLowerCase()
  if (suppliedName !== 'marketpilot ai' && occurrences(content, 'MarketPilot AI') >= 2) {
    issues.push('App name is repeated as unrelated content.')
  }
  if (/"priority"\s*:\s*"(high|medium|low)"/i.test(content)) issues.push('English priority label remains.')
  const groundingValues = [
    businessInput.productDescription, businessInput.targetCustomerGuess, businessInput.mainCustomerProblem,
    businessInput.keyDifferentiation, businessInput.currentPrice, businessInput.monthlyBudget,
  ].map(clean).filter((x) => x.length >= 6)
  if (groundingValues.length > 0 && !groundingValues.some((value) => patchContent.includes(value))) {
    issues.push('No direct grounding in supplied product, customer, differentiation, price, or budget details.')
  }
  if (plan.sections.some((item) => JSON.stringify(item.content).replace(/[{}\[\]"\s,:]/g, '').length < 20)) {
    issues.push('One or more final sections are too short.')
  }
  return unique(issues)
}

function section(id: number, content: unknown, contentType: AIPlanSection['contentType']): AIPlanSection {
  const title = requiredMarketingPlanSections.find((item) => item.id === id)?.title || String(id)
  return { id, title, contentType, content: content as AIPlanSection['content'] }
}

function validateRecords(value: unknown, path: string, minimum: number, keys: string[], errors: string[]) {
  const items = records(value)
  if (items.length < minimum) errors.push(`${path} needs at least ${minimum} items.`)
  items.forEach((item, index) => keys.forEach((key) => requireField(item[key], `${path}[${index}].${key}`, key, errors)))
}

function validateObject(value: unknown, path: string, keys: string[], errors: string[]) {
  if (!isRecord(value)) { errors.push(`${path} must be an object.`); return }
  keys.forEach((key) => requireText(value[key], `${path}.${key}`, errors))
}

function validateNamedCoverage(value: unknown, key: string, required: string[], path: string, errors: string[]) {
  const names = new Set(records(value).map((item) => clean(item[key]).toLowerCase()))
  required.forEach((name) => { if (!names.has(name.toLowerCase())) errors.push(`${path} is missing ${name}.`) })
}

function requireText(value: unknown, path: string, errors: string[]) {
  if (!isUseful(clean(value))) errors.push(`${path} is missing, too short, or generic.`)
}

function requireField(value: unknown, path: string, key: string, errors: string[]) {
  const compactKeys = new Set(['name', 'element', 'stage', 'week', 'priority', 'channel', 'type', 'role'])
  const normalized = clean(value)
  if (compactKeys.has(key)) {
    if (normalized.length < 2) errors.push(`${path} is missing or too short.`)
    return
  }
  requireText(value, path, errors)
}

function normalizeObject(value: unknown, keys: string[]): Record<string, string> {
  const source = isRecord(value) ? value : {}
  return Object.fromEntries(keys.map((key) => [key, clean(source[key])]))
}

function isUseful(value: string): boolean {
  const normalized = value.trim()
  return normalized.length >= 8 && !fillerPatterns.some((pattern) => normalized.includes(pattern))
}

function hasRepeatedFiller(value: string): boolean {
  return fillerPatterns.some((pattern) => occurrences(value, pattern) >= 2)
}

function priority(value: unknown): PersianPriority {
  if (priorities.has(value as PersianPriority)) return value as PersianPriority
  if (value === 'high') return 'بالا'
  if (value === 'low') return 'پایین'
  return 'متوسط'
}

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean)
  const single = clean(value)
  return single ? [single] : []
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : value == null ? '' : String(value).trim()
}

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}

function stripMarker(value: string): string {
  return value.replace(/^[✓✔○✗]\s*/, '').trim()
}

function unique(values: string[]): string[] {
  return [...new Set(values)].slice(0, 20)
}

function nonEmpty(values: string[], fallback: string): string[] {
  return values.length ? values : [fallback]
}

function findRepeatedLongStrings(value: unknown): string[] {
  const seen = new Map<string, number>()
  const visit = (item: unknown) => {
    if (typeof item === 'string') {
      const normalized = clean(item).toLowerCase()
      if (normalized.length >= 20) seen.set(normalized, (seen.get(normalized) || 0) + 1)
      return
    }
    if (Array.isArray(item)) item.forEach(visit)
    else if (isRecord(item)) Object.values(item).forEach(visit)
  }
  visit(value)
  return [...seen.entries()].filter(([, count]) => count >= 3).map(([text]) => text)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
