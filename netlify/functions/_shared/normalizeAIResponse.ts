import type {
  ClarifyingDecisionImpact,
  ClarifyingQuestionExpectedAnswerType,
  ClarifyingQuestionPriority,
  ClarifyingQuestionsResponse,
} from './marketingSchemas'

const priorities = new Set<ClarifyingQuestionPriority>(['بالا', 'متوسط', 'پایین'])
const impacts = new Set<ClarifyingDecisionImpact>([
  'segmentation', 'positioning', 'channel', 'pricing', 'kpi', 'budget',
  'funnel', 'competition', 'customer', 'offer', 'other',
])
const answerTypes = new Set<ClarifyingQuestionExpectedAnswerType>(['text', 'number', 'choice', 'multiChoice'])

export function normalizeQuestionsResponse(value: unknown): unknown {
  if (!isRecord(value)) return value
  const requiredSource = array(value.requiredQuestions) ?? array(value.questions) ?? []
  const optionalSource = array(value.optionalQuestions) ?? []
  const requiredQuestions = requiredSource.slice(0, 3).map((item, index) => normalizeQuestion(item, index, true))
  const optionalQuestions = optionalSource.slice(0, 1).map((item, index) => normalizeQuestion(item, index + requiredQuestions.length, false))
  const mode = value.mode === 'ready_for_plan' || requiredQuestions.length === 0
    ? 'ready_for_plan'
    : 'needs_clarification'

  const result: ClarifyingQuestionsResponse = {
    mode,
    inputQualityScore: score(value.inputQualityScore ?? value.confidenceScore ?? value.qualityScore),
    diagnosis: text(value.diagnosis) || 'اطلاعات ورودی برای تصمیم‌های بازاریابی ارزیابی شد.',
    missingInformation: strings(value.missingInformation ?? value.missingInfo),
    requiredQuestions: mode === 'ready_for_plan' ? [] : requiredQuestions,
    optionalQuestions,
    assumptionsIfProceeding: strings(value.assumptionsIfProceeding ?? value.assumptions),
  }
  return result
}

function normalizeQuestion(value: unknown, index: number, required: boolean) {
  const source = isRecord(value) ? value : { question: value }
  const expectedAnswerType = answerTypes.has(source.expectedAnswerType as ClarifyingQuestionExpectedAnswerType)
    ? source.expectedAnswerType as ClarifyingQuestionExpectedAnswerType
    : 'text'
  const priority = normalizePriority(source.priority, required)
  const decisionImpact = impacts.has(source.decisionImpact as ClarifyingDecisionImpact)
    ? source.decisionImpact as ClarifyingDecisionImpact
    : 'other'
  const question = text(source.question) || 'کدام انتخاب، اولویت اصلی تصمیم بازاریابی شماست؟'
  const options = strings(source.options)
  return {
    id: `decision-${index + 1}`,
    label: text(source.label) || 'تصمیم کلیدی',
    question,
    whyItMatters: text(source.whyItMatters) || 'پاسخ این سؤال مستقیماً اولویت بخش، کانال، قیمت یا KPI را تغییر می‌دهد.',
    expectedAnswerType,
    ...(expectedAnswerType === 'choice' || expectedAnswerType === 'multiChoice'
      ? { options: options.length > 0 ? options : ['گزینه نخست', 'گزینه دوم'] }
      : {}),
    required,
    priority,
    decisionImpact,
  }
}

function normalizePriority(value: unknown, required: boolean): ClarifyingQuestionPriority {
  if (priorities.has(value as ClarifyingQuestionPriority)) return value as ClarifyingQuestionPriority
  if (value === 'high') return 'بالا'
  if (value === 'medium') return 'متوسط'
  if (value === 'low') return 'پایین'
  return required ? 'بالا' : 'پایین'
}

function score(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 65
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean)
  const single = text(value)
  return single ? [single] : []
}

function array(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
