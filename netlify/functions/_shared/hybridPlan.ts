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

export interface BaselineDigest {
  business: Record<string, unknown>
  productAndCustomer: Record<string, unknown>
  commercialContext: Record<string, unknown>
  baselineSignals: Record<string, unknown>
  clarifyingAnswers: Record<string, unknown>
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

export type PatchParseStage = 'provider_response' | 'json_parse' | 'unwrap' | 'patch_validation' | 'patch_quality' | 'merge_quality'

export interface PreparedEnhancementPatch {
  patch: AIEnhancementPatch | null
  parseStage: PatchParseStage
  rawTopLevelKeys: string[]
  patchTopLevelKeys: string[]
  patchType: string
  validationIssues: string[]
  rawPreview?: string
}

export interface PatchAssessment {
  acceptedPatchAreas: string[]
  patchQualityScore: number
  validationIssues: string[]
  usable: boolean
}

const priorities = new Set<PersianPriority>(['بالا', 'متوسط', 'پایین'])
const fillerPatterns = [
  'این بخش بر اساس',
  'نیازمند بازبینی',
  'موضوع:',
  'استفاده از شبکه‌های اجتماعی',
  'تولید محتوای باکیفیت',
]
const wrapperKeys = ['patch', 'aiPatch', 'enhancementPatch', 'marketingPatch', 'data', 'result', 'output']
export const highValuePatchAreas = [
  'primaryTarget', 'positioningStatement', 'segments', 'usp', 'competitors',
  'digitalChannels', 'kpis', 'thirtyDayPlan', 'risks',
] as const

export function buildBaselineDigest(
  businessInput: Record<string, unknown>,
  baseline: BaselineMarketingPlan,
  clarifyingAnswers: Record<string, unknown>,
): BaselineDigest {
  return {
    business: pick(businessInput, ['businessName', 'businessType', 'marketModel', 'currentStage', 'marketingGoal']),
    productAndCustomer: pick(businessInput, ['productDescription', 'targetCustomerGuess', 'mainCustomerProblem', 'currentAlternative', 'keyDifferentiation']),
    commercialContext: pick(businessInput, ['pricingModel', 'currentPrice', 'monthlyBudget', 'teamCapacity', 'availableChannels', 'competitors', 'marketConstraints']),
    baselineSignals: {
      targetMarket: oneLine(baseline.targetMarket),
      usp: oneLine(baseline.usp),
      kpiNames: baseline.kpiDashboard.map((item) => item.metric).slice(0, 8),
      actionPlan: baseline.actionPlan.map(oneLine).slice(0, 4),
    },
    clarifyingAnswers,
  }
}

export function prepareEnhancementPatch(value: unknown): PreparedEnhancementPatch {
  const rawTopLevelKeys = isRecord(value) ? Object.keys(value).slice(0, 30) : []
  const rawPreview = sanitizedPreview(value)
  if (Array.isArray(value)) {
    return { patch: null, parseStage: 'unwrap', rawTopLevelKeys, patchTopLevelKeys: [], patchType: 'array', validationIssues: ['AI returned an array instead of patch object'], rawPreview }
  }
  if (!isRecord(value)) {
    return { patch: null, parseStage: 'unwrap', rawTopLevelKeys, patchTopLevelKeys: [], patchType: value === null ? 'null' : typeof value, validationIssues: [`AI patch must be an object; received ${value === null ? 'null' : typeof value}`], rawPreview }
  }

  let current: unknown = value
  const seen = new Set<unknown>()
  for (let depth = 0; depth < 8 && isRecord(current) && !seen.has(current); depth += 1) {
    seen.add(current)
    if (looksLikeFullPlan(current) && Array.isArray(current.sections)) {
      current = extractPatchFromFullPlan(current)
      break
    }
    if (looksLikePatch(current)) break
    const wrapper = wrapperKeys.find((key) => key in current)
    if (!wrapper) break
    current = current[wrapper]
  }
  if (isRecord(current) && !looksLikePatch(current) && looksLikeFullPlan(current)) {
    current = extractPatchFromFullPlan(current)
  }
  if (isRecord(current) && !looksLikePatch(current)) {
    const nested = wrapperKeys.map((key) => current[key]).find((item) => isRecord(item) && looksLikeFullPlan(item))
    if (isRecord(nested)) current = extractPatchFromFullPlan(nested)
  }
  if (Array.isArray(current)) {
    return { patch: null, parseStage: 'unwrap', rawTopLevelKeys, patchTopLevelKeys: [], patchType: 'array', validationIssues: ['AI returned an array instead of patch object'], rawPreview }
  }
  if (!isRecord(current)) {
    return { patch: null, parseStage: 'unwrap', rawTopLevelKeys, patchTopLevelKeys: [], patchType: current === null ? 'null' : typeof current, validationIssues: ['AI patch could not be unwrapped to an object'], rawPreview }
  }
  const patchTopLevelKeys = Object.keys(current).slice(0, 30)
  if (patchTopLevelKeys.length === 0) {
    return { patch: null, parseStage: 'unwrap', rawTopLevelKeys, patchTopLevelKeys, patchType: 'object', validationIssues: ['AI patch object is empty after parsing/unwrapping'], rawPreview }
  }
  const normalized = normalizeEnhancementPatch(current)
  if (!isEnhancementPatch(normalized)) {
    return { patch: null, parseStage: 'patch_validation', rawTopLevelKeys, patchTopLevelKeys, patchType: 'object', validationIssues: ['AI patch normalization did not produce an object'], rawPreview }
  }
  return { patch: normalized, parseStage: 'patch_validation', rawTopLevelKeys, patchTopLevelKeys, patchType: 'object', validationIssues: [], rawPreview }
}

export function assessEnhancementPatch(patch: AIEnhancementPatch): PatchAssessment {
  const acceptedPatchAreas = getAcceptedPatchAreas(patch)
  const strictIssues = validateEnhancementPatch(patch).errors
  const blockingQualityIssues = strictIssues.filter((issue) =>
    issue.includes('repeated filler') || issue.includes('repeats the same') || issue.includes('Priority labels'),
  )
  const validationIssues = [...strictIssues]
  return {
    acceptedPatchAreas,
    patchQualityScore: Math.round((acceptedPatchAreas.length / highValuePatchAreas.length) * 100),
    validationIssues: unique(validationIssues),
    usable: acceptedPatchAreas.length >= 3 && blockingQualityIssues.length === 0,
  }
}

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
  validateRecords(value.segments, 'segments', 3, ['name', 'problem', 'accessChannel', 'willingnessToPay', 'priority'], errors)
  validateObject(value.primaryTarget, 'primaryTarget', ['name', 'reason', 'whyNow'], errors)
  requireText(value.positioningStatement, 'positioningStatement', errors)
  requireText(value.usp, 'usp', errors)
  validateRecords(value.competitors, 'competitors', 3, ['name', 'type', 'strength', 'weakness', 'howToDifferentiate'], errors)
  validateRecords(value.digitalChannels, 'digitalChannels', 3, ['channel', 'priority', 'reason', 'firstExperiment'], errors)
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
  acceptedAreas: string[] = [...highValuePatchAreas],
): AIFinalMarketingPlanResponse {
  const accepted = new Set(acceptedAreas)
  const businessName = clean(businessInput.businessName) || 'کسب‌وکار'
  const choose = (candidate: string, fallback: string) => isUseful(candidate) ? candidate : fallback
  const sections: AIPlanSection[] = [
    section(1, choose(patch.summaryInsight, baseline.businessSummary), 'paragraph'),
    section(2, baseline.customerDevelopmentStage, 'paragraph'),
    section(3, accepted.has('segments') ? patch.segments.map((x) => `${x.name}: مسئله: ${x.problem}؛ مسیر دسترسی: ${x.accessChannel}؛ توان پرداخت: ${x.willingnessToPay}؛ اولویت: ${x.priority}`) : baseline.marketSegments, 'cards'),
    section(4, accepted.has('primaryTarget') ? `${patch.primaryTarget.name}: ${patch.primaryTarget.reason}؛ ${patch.primaryTarget.whyNow}` : baseline.targetMarket, 'paragraph'),
    section(5, accepted.has('positioningStatement') ? patch.positioningStatement : baseline.positioningStatement, 'paragraph'),
    section(6, accepted.has('personas') ? patch.personas.map((x) => `${x.name}\n• نقش: ${x.role}\n• درد: ${x.pain}\n• محرک: ${x.trigger}\n• اعتراض: ${x.objection}\n• پیام: ${x.message}`) : baseline.customerPersonas, 'cards'),
    section(7, baseline.valueProposition, 'paragraph'),
    section(8, accepted.has('usp') ? patch.usp : baseline.usp, 'paragraph'),
    section(9, accepted.has('competitors') ? patch.competitors.map((x) => `${x.name}: نوع: ${x.type}؛ قوت: ${x.strength}؛ ضعف: ${x.weakness}؛ تمایز پیشنهادی: ${x.howToDifferentiate}`) : baseline.competitorAnalysis, 'cards'),
    section(10, accepted.has('marketingMix7P') ? Object.fromEntries(patch.marketingMix7P.map((x) => [x.element, `${x.recommendation}؛ دلیل: ${x.reason}`])) : baseline.marketingMix7p, 'table'),
    section(11, accepted.has('funnel') ? patch.funnel.map((x) => `${x.stage}: اقدام: ${x.action}؛ کانال: ${x.channel}؛ معیار: ${x.metric}`) : baseline.funnelJourney, 'list'),
    section(12, accepted.has('digitalChannels') ? patch.digitalChannels.map((x) => `${x.channel}: اولویت ${x.priority}؛ دلیل: ${x.reason}؛ آزمایش نخست: ${x.firstExperiment}`) : baseline.channelStrategy, 'list'),
    section(13, accepted.has('pricingRecommendation') ? `${patch.pricingRecommendation.recommendedModel}: ${patch.pricingRecommendation.reason}؛ پیشنهاد آغازین: ${patch.pricingRecommendation.introOffer}؛ ریسک: ${patch.pricingRecommendation.risk}` : baseline.pricingRecommendation, 'paragraph'),
    section(14, accepted.has('kpis') ? patch.kpis : baseline.kpiDashboard, 'kpi'),
    section(15, accepted.has('thirtyDayPlan') ? patch.thirtyDayPlan : baseline.actionPlan, 'actionPlan'),
    section(16, accepted.has('risks') ? patch.risks : baseline.risksAssumptions, 'list'),
    section(17, choose(patch.qualityRationale, baseline.qualityScore.details.join('؛ ')), 'score'),
  ]
  const answerNotes = Object.values(clarifyingAnswers).flatMap((value) => Array.isArray(value) ? value : [value]).map(clean).filter(Boolean)

  return {
    businessName,
    language: 'fa',
    planType: 'برنامه بازاریابی ترکیبی؛ خط مبنا داخلی و تقویت راهبردی Groq',
    inputQualityDiagnosis: choose(patch.summaryInsight, 'برنامه بر خط مبنای داخلی معتبر و داده‌های ورودی استوار است.'),
    assumptions: answerNotes.slice(0, 4),
    sections,
    kpis: accepted.has('kpis') ? patch.kpis.map((x) => ({
      name: x.name, reason: x.whyItMatters, formula: x.measurement, target: x.target,
      channel: `کانال ${x.channel}`, reviewFrequency: 'هفتگی', riskOrCaution: 'هدف پس از مشاهده خط مبنا بازبینی شود.',
    })) : baselineToFinalResponse(baseline, businessInput).kpis,
    actionPlan30Days: accepted.has('thirtyDayPlan') ? patch.thirtyDayPlan.map((x, index) => ({
      week: index + 1, focus: x.week, actions: x.actions, successMetric: x.successMetric,
    })) : baselineToFinalResponse(baseline, businessInput).actionPlan30Days,
    risks: accepted.has('risks') ? patch.risks.map((x) => `${x.risk}؛ فرض: ${x.assumption}؛ آزمون اعتبارسنجی: ${x.validationTest}`) : baseline.risksAssumptions,
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
    name: meaningful(item.metric, 2, 'شاخص'),
    reason: meaningful(item.interpretation, 5, 'دلیل سنجش خط مبنای داخلی'),
    formula: meaningful(item.benchmark, 5, 'روش سنجش: ثبت هفتگی'),
    target: meaningful(item.value, 5, 'هدف: تعیین خط مبنا'),
    channel: 'کانال‌های منتخب برنامه', reviewFrequency: 'هفتگی',
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
  acceptedAreas: string[] = [...highValuePatchAreas],
  clarifyingAnswers: Record<string, unknown> = {},
): string[] {
  const issues: string[] = []
  if (acceptedAreas.length < 3) issues.push('Patch has fewer than 3 useful strategic areas.')
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
  const answerValues = Object.values(clarifyingAnswers)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(clean)
    .filter((value) => value.length >= 2)
  if (answerValues.length > 0 && !answerValues.some((value) => patchContent.includes(value))) {
    issues.push('Patch does not explicitly use any clarifying answer in its strategic recommendations.')
  }
  if (plan.sections.some((item) => JSON.stringify(item.content).replace(/[{}\[\]"\s,:]/g, '').length < 20)) {
    issues.push('One or more final sections are too short.')
  }
  return unique(issues)
}

function getAcceptedPatchAreas(patch: AIEnhancementPatch): string[] {
  const accepted: string[] = []
  if (recordAreaValid(patch.segments, 3, ['name', 'problem', 'accessChannel', 'willingnessToPay', 'priority'])) accepted.push('segments')
  if (objectAreaValid(patch.primaryTarget, ['name', 'reason', 'whyNow'])) accepted.push('primaryTarget')
  if (isUseful(patch.positioningStatement)) accepted.push('positioningStatement')
  if (isUseful(patch.usp)) accepted.push('usp')
  if (recordAreaValid(patch.competitors, 3, ['name', 'type', 'strength', 'weakness', 'howToDifferentiate'])) accepted.push('competitors')
  if (recordAreaValid(patch.digitalChannels, 3, ['channel', 'priority', 'reason', 'firstExperiment'])) accepted.push('digitalChannels')
  if (recordAreaValid(patch.kpis, 3, ['name', 'target', 'measurement', 'whyItMatters', 'channel'])) accepted.push('kpis')
  if (recordAreaValid(patch.thirtyDayPlan, 4, ['week', 'successMetric']) && patch.thirtyDayPlan.every((item) => item.actions.length >= 2 && item.actions.every(isUseful))) accepted.push('thirtyDayPlan')
  if (recordAreaValid(patch.risks, 2, ['risk', 'assumption', 'validationTest'])) accepted.push('risks')
  return accepted
}

function recordAreaValid(items: Array<Record<string, unknown>>, minimum: number, keys: string[]): boolean {
  return items.length >= minimum && items.every((item) => keys.every((key) => {
    const value = clean(item[key])
    return ['name', 'element', 'stage', 'week', 'priority', 'channel', 'type', 'role'].includes(key)
      ? value.length >= 2
      : isUseful(value)
  }))
}

function objectAreaValid(item: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => isUseful(clean(item[key])))
}

function looksLikePatch(value: Record<string, unknown>): boolean {
  return highValuePatchAreas.some((key) => key in value) || 'summaryInsight' in value || 'qualityRationale' in value
}

function looksLikeFullPlan(value: Record<string, unknown>): boolean {
  return Array.isArray(value.sections) || ('businessName' in value && ('kpis' in value || 'actionPlan30Days' in value))
}

function extractPatchFromFullPlan(value: Record<string, unknown>): Record<string, unknown> {
  const sections = records(value.sections)
  const byId = new Map(sections.map((item) => [Number(item.id), item.content]))
  return {
    summaryInsight: value.inputQualityDiagnosis ?? byId.get(1) ?? '',
    segments: byId.get(3) ?? value.segments ?? [],
    primaryTarget: value.primaryTarget ?? byId.get(4) ?? {},
    positioningStatement: value.positioningStatement ?? byId.get(5) ?? '',
    personas: value.personas ?? byId.get(6) ?? [],
    usp: value.usp ?? byId.get(8) ?? '',
    competitors: value.competitors ?? byId.get(9) ?? [],
    marketingMix7P: value.marketingMix7P ?? byId.get(10) ?? [],
    funnel: value.funnel ?? byId.get(11) ?? [],
    digitalChannels: value.digitalChannels ?? byId.get(12) ?? [],
    pricingRecommendation: value.pricingRecommendation ?? byId.get(13) ?? {},
    kpis: value.kpis ?? [],
    thirtyDayPlan: value.thirtyDayPlan ?? value.actionPlan30Days ?? [],
    risks: value.patchRisks ?? value.risks ?? [],
    qualityRationale: value.qualityRationale ?? (isRecord(value.qualityScore) ? value.qualityScore.improvementSuggestions : '') ?? '',
  }
}

function sanitizedPreview(value: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(value)
    if (!serialized) return undefined
    return serialized.replace(/gsk_[A-Za-z0-9_-]+|sk-or-[A-Za-z0-9_-]+|AIza[A-Za-z0-9_-]+/g, '[REDACTED]').slice(0, 400)
  } catch {
    return undefined
  }
}

function isEnhancementPatch(value: unknown): value is AIEnhancementPatch {
  return isRecord(value)
    && Array.isArray(value.segments)
    && isRecord(value.primaryTarget)
    && Array.isArray(value.personas)
    && Array.isArray(value.competitors)
    && Array.isArray(value.marketingMix7P)
    && Array.isArray(value.funnel)
    && Array.isArray(value.digitalChannels)
    && isRecord(value.pricingRecommendation)
    && Array.isArray(value.kpis)
    && Array.isArray(value.thirtyDayPlan)
    && Array.isArray(value.risks)
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

function meaningful(value: unknown, minimum: number, fallback: string): string {
  const normalized = clean(value)
  return normalized.length >= minimum ? normalized : normalized ? `${fallback} ${normalized}` : fallback
}

function pick(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))
}

function oneLine(value: unknown): string {
  return clean(value).slice(0, 500)
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
