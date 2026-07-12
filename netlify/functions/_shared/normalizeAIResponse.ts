import { requiredMarketingPlanSections } from './marketingSchemas'

const persianFallback = 'این بخش بر اساس اطلاعات فعلی کسب‌وکار تهیه شده و نیازمند بازبینی است.'
const persianQuestion = 'لطفاً اطلاعات دقیق‌تری برای تصمیم بازاریابی ارائه کنید.'

export function normalizeQuestionsResponse(value: unknown): unknown {
  if (!isRecord(value)) return value

  const requiredSource = readArray(value.requiredQuestions) || readArray(value.questions) || []
  const optionalSource = readArray(value.optionalQuestions) || []
  const requiredQuestions = requiredSource.slice(0, 2).map((item, index) => normalizeQuestion(item, index, true))
  const optionalQuestions = optionalSource.slice(0, 1).map((item, index) => normalizeQuestion(item, index + requiredQuestions.length, false))
  const requestedMode = value.mode === 'ready_for_plan' ? 'ready_for_plan' : 'needs_clarification'
  const mode = requestedMode === 'needs_clarification' && requiredQuestions.length === 0
    ? 'ready_for_plan'
    : requestedMode

  return {
    mode,
    inputQualityScore: clampScore(value.inputQualityScore ?? value.confidenceScore ?? value.qualityScore, 65),
    diagnosis: ensurePersianString(value.diagnosis, 'کیفیت ورودی برای تدوین برنامه بازاریابی ارزیابی شد.'),
    missingInformation: normalizeStringArray(value.missingInformation ?? value.missingInfo),
    requiredQuestions: mode === 'ready_for_plan' ? [] : requiredQuestions,
    optionalQuestions,
    assumptionsIfProceeding: normalizeStringArray(value.assumptionsIfProceeding ?? value.assumptions),
  }
}

export function normalizePlanResponse(
  value: unknown,
  businessInput: Record<string, unknown>,
): unknown {
  if (!isRecord(value)) return value

  const providedSections = readArray(value.sections) || []
  const sectionMap = new Map<number, unknown>()
  providedSections.forEach((section, index) => {
    if (isRecord(section)) {
      const id = readInteger(section.id) || index + 1
      if (id >= 1 && id <= 17 && !sectionMap.has(id)) sectionMap.set(id, section)
    } else if (index < 17) {
      sectionMap.set(index + 1, section)
    }
  })

  const businessName = ensurePersianString(
    value.businessName ?? businessInput.businessName,
    'کسب‌وکار مورد بررسی',
  )
  const sections = requiredMarketingPlanSections.map((required) => {
    const source = sectionMap.get(required.id)
    if (isRecord(source)) {
      const contentType = normalizeContentType(source.contentType, required.id)
      return {
        id: required.id,
        title: required.title,
        contentType,
        content: normalizeSectionContent(source.content ?? source.text ?? source.description, businessName, contentType),
      }
    }
    return {
      id: required.id,
      title: required.title,
      contentType: defaultContentType(required.id),
      content: `${persianFallback} موضوع: ${required.title} برای ${businessName}.`,
    }
  })

  return {
    businessName,
    language: 'fa',
    planType: ensurePersianString(value.planType, 'برنامه بازاریابی مبتنی بر هوش مصنوعی'),
    inputQualityDiagnosis: ensurePersianString(value.inputQualityDiagnosis ?? value.diagnosis, 'ورودی برای تهیه نسخه اولیه برنامه کافی ارزیابی شد.'),
    assumptions: normalizeStringArray(value.assumptions),
    sections,
    kpis: normalizeKpis(value.kpis ?? value.kpiDashboard),
    actionPlan30Days: normalizeActions(value.actionPlan30Days ?? value.actionPlan),
    risks: ensureNonEmptyStrings(value.risks, 'ریسک اصلی، محدودیت داده و نیاز به آزمون عملی پیشنهادها است.'),
    qualityScore: normalizeQualityScore(value.qualityScore),
  }
}

function normalizeQuestion(value: unknown, index: number, required: boolean) {
  const source = isRecord(value) ? value : { question: value }
  const question = ensurePersianString(source.question ?? source.label, persianQuestion)
  const answerType = ['text', 'number', 'choice', 'multiChoice'].includes(String(source.expectedAnswerType))
    ? String(source.expectedAnswerType)
    : 'text'
  const options = normalizeStringArray(source.options)
  return {
    id: `question-${index + 1}`,
    question: padPersian(question, 18),
    whyItMatters: padPersian(ensurePersianString(source.whyItMatters, 'پاسخ این سؤال دقت تصمیم‌های بازاریابی را افزایش می‌دهد.'), 25),
    expectedAnswerType: answerType,
    ...(answerType === 'choice' || answerType === 'multiChoice'
      ? { options: options.length > 0 ? options : ['گزینه اول', 'گزینه دوم'] }
      : {}),
    required,
    priority: ['high', 'medium', 'low'].includes(String(source.priority)) ? source.priority : required ? 'high' : 'low',
    decisionImpact: normalizeDecisionImpact(source.decisionImpact),
  }
}

function normalizeKpis(value: unknown) {
  const source = readArray(value) || []
  const defaults = ['نرخ تبدیل', 'هزینه جذب مشتری', 'بازگشت سرمایه']
  const usedNames = new Set<string>()
  return Array.from({ length: Math.max(3, Math.min(source.length, 6)) }, (_, index) => {
    const item = isRecord(source[index]) ? source[index] : {}
    const baseName = ensurePersianString(item.name ?? item.metric, defaults[index] || `شاخص ${index + 1}`)
    const normalizedName = baseName.trim().toLowerCase()
    const name = usedNames.has(normalizedName) ? `${baseName} ${index + 1}` : baseName
    usedNames.add(name.trim().toLowerCase())
    return {
      name,
      reason: ensurePersianString(item.reason, 'برای سنجش اثربخشی اجرای برنامه بازاریابی'),
      formula: ensurePersianString(item.formula ?? item.method, 'مقدار نتیجه تقسیم بر مقدار ورودی مرتبط'),
      target: ensurePersianString(item.target ?? item.value, 'بهبود تدریجی بر اساس خط مبنا'),
      channel: ensurePersianString(item.channel, 'کانال منتخب برنامه'),
      reviewFrequency: ensurePersianString(item.reviewFrequency, 'بازبینی هفتگی'),
      riskOrCaution: ensurePersianString(item.riskOrCaution ?? item.risk, 'تفسیر پس از جمع‌آوری داده کافی'),
    }
  })
}

function normalizeActions(value: unknown) {
  const source = readArray(value) || []
  return [1, 2, 3, 4].map((week, index) => {
    const item = isRecord(source[index]) ? source[index] : {}
    return {
      week,
      focus: ensurePersianString(item.focus, `تمرکز اجرایی هفته ${week}`),
      actions: ensureNonEmptyStrings(item.actions, `اجرای اقدام اولویت‌دار هفته ${week} و ثبت نتیجه`),
      successMetric: ensurePersianString(item.successMetric ?? item.metric, 'ثبت نتیجه قابل‌اندازه‌گیری در پایان هفته'),
    }
  })
}

function normalizeQualityScore(value: unknown) {
  const source = isRecord(value) ? value : { score: value }
  return {
    score: clampScore(source.score, 70),
    strengths: ensureNonEmptyStrings(source.strengths, 'ساختار عملیاتی و قابل‌اندازه‌گیری'),
    weaknesses: ensureNonEmptyStrings(source.weaknesses, 'نیاز به داده واقعی بازار برای افزایش دقت'),
    missingInputs: ensureNonEmptyStrings(source.missingInputs, 'داده عملکرد واقعی کمپین‌ها هنوز موجود نیست'),
    improvementSuggestions: ensureNonEmptyStrings(source.improvementSuggestions, 'نتایج هر هفته ثبت و برنامه بازبینی شود'),
  }
}

function normalizeSectionContent(value: unknown, businessName: string, contentType: string): unknown {
  if (typeof value === 'string' && value.trim()) {
    const text = padPersian(ensurePersianString(value, persianFallback), 20)
    return ['cards', 'table', 'kpi', 'actionPlan'].includes(contentType) ? [{ description: text }] : text
  }
  if (Array.isArray(value)) {
    const normalized = value.map((item) => isRecord(item) ? normalizeRecordStrings(item) : ensurePersianString(item, '')).filter(Boolean)
    if (contentType === 'paragraph') return normalized.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('، ')
    return normalized.length > 0 ? normalized : `${persianFallback} کسب‌وکار: ${businessName}.`
  }
  if (isRecord(value)) return normalizeRecordStrings(value)
  return `${persianFallback} کسب‌وکار: ${businessName}.`
}

function normalizeRecordStrings(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (typeof item === 'string') return [key, ensurePersianString(item, persianFallback)]
    if (Array.isArray(item)) return [key, item.map((entry) => ensurePersianString(entry, '')).filter(Boolean)]
    return [key, item]
  }))
}

function normalizeContentType(value: unknown, id: number): string {
  const allowed = ['paragraph', 'list', 'cards', 'table', 'kpi', 'actionPlan', 'score']
  return allowed.includes(String(value)) ? String(value) : defaultContentType(id)
}

function defaultContentType(id: number): string {
  if ([3, 6, 10, 11, 12].includes(id)) return 'cards'
  if (id === 14) return 'kpi'
  if (id === 15) return 'actionPlan'
  if (id === 17) return 'score'
  return 'paragraph'
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => ensurePersianString(item, '')).filter(Boolean)
}

function ensureNonEmptyStrings(value: unknown, fallback: string): string[] {
  const items = normalizeStringArray(value)
  return items.length > 0 ? items : [fallback]
}

function ensurePersianString(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
  if (!text) return fallback
  return /[\u0600-\u06ff]/.test(text) ? text : `توضیح: ${text}`
}

function padPersian(value: string, minLength: number): string {
  return value.length >= minLength ? value : `${value} برای برنامه بازاریابی`
}

function normalizeDecisionImpact(value: unknown): string {
  const allowed = ['segmentation', 'positioning', 'channel', 'pricing', 'kpi', 'budget', 'funnel', 'competition', 'customer', 'offer', 'other']
  return allowed.includes(String(value)) ? String(value) : 'other'
}

function clampScore(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : fallback
}

function readArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined
}

function readInteger(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(number) ? number : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
