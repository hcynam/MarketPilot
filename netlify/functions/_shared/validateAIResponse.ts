import {
  requiredMarketingPlanSections,
  type ClarifyingDecisionImpact,
  type ClarifyingQuestionExpectedAnswerType,
  type ClarifyingQuestionPriority,
} from './marketingSchemas'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export interface SafeJsonParseResult {
  ok: boolean
  data: unknown | null
  errors: string[]
}

const validModes = new Set(['needs_clarification', 'ready_for_plan'])
const validQuestionAnswerTypes = new Set<ClarifyingQuestionExpectedAnswerType>([
  'text',
  'number',
  'choice',
  'multiChoice',
])
const validQuestionPriorities = new Set<ClarifyingQuestionPriority>(['بالا', 'متوسط', 'پایین'])
const validDecisionImpacts = new Set<ClarifyingDecisionImpact>([
  'segmentation',
  'positioning',
  'channel',
  'pricing',
  'kpi',
  'budget',
  'funnel',
  'competition',
  'customer',
  'offer',
  'other',
])
const validContentTypes = new Set([
  'paragraph',
  'list',
  'cards',
  'table',
  'kpi',
  'actionPlan',
  'score',
])

export function safeParseJson(text: string): SafeJsonParseResult {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, data: null, errors: ['JSON text is empty.'] }
  }

  const trimmed = stripCodeFence(text.trim())
  const attempts = [trimmed]
  const firstObject = trimmed.indexOf('{')
  const lastObject = trimmed.lastIndexOf('}')
  if (firstObject >= 0 && lastObject > firstObject) {
    attempts.push(trimmed.slice(firstObject, lastObject + 1))
  }

  for (const candidate of attempts) {
    try {
      return { ok: true, data: JSON.parse(candidate), errors: [] }
    } catch {
      // Keep trying recovery candidates.
    }
  }

  return { ok: false, data: null, errors: ['Invalid JSON. The AI response must be valid JSON only.'] }
}

export function validateClarifyingQuestionsResponse(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!isRecord(data)) {
    return { ok: false, errors: ['Response must be a JSON object.'] }
  }

  if (typeof data.mode !== 'string' || !validModes.has(data.mode)) {
    errors.push('mode must be "needs_clarification" or "ready_for_plan".')
  }

  if (!isNumberInRange(data.inputQualityScore, 0, 100)) {
    errors.push('inputQualityScore must be a number from 0 to 100.')
  }

  if (!isMeaningfulString(data.diagnosis, 10)) {
    errors.push('diagnosis must be a meaningful non-empty string.')
  }

  validateStringArray(data.missingInformation, 'missingInformation', errors, { allowEmpty: true })
  validateQuestionArray(data.requiredQuestions, 'requiredQuestions', errors)
  validateQuestionArray(data.optionalQuestions, 'optionalQuestions', errors)
  validateStringArray(data.assumptionsIfProceeding, 'assumptionsIfProceeding', errors, { allowEmpty: true })

  const requiredCount = Array.isArray(data.requiredQuestions) ? data.requiredQuestions.length : 0
  const optionalCount = Array.isArray(data.optionalQuestions) ? data.optionalQuestions.length : 0

  if (data.mode === 'needs_clarification' && (requiredCount < 1 || requiredCount > 3)) {
    errors.push('requiredQuestions must contain 1-3 questions when mode is needs_clarification.')
  }

  if (requiredCount > 3) {
    errors.push('requiredQuestions must not contain more than 3 questions.')
  }

  if (optionalCount > 1) {
    errors.push('optionalQuestions must not contain more than 1 question.')
  }

  validateUniqueQuestionIds(data.requiredQuestions, data.optionalQuestions, errors)

  return { ok: errors.length === 0, errors }
}

export function validateFinalMarketingPlanResponse(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!isRecord(data)) {
    return { ok: false, errors: ['Response must be a JSON object.'] }
  }

  if (!isMeaningfulString(data.businessName, 2)) {
    errors.push('businessName must be a non-empty string.')
  }

  if (data.language !== 'fa') {
    errors.push('language must be exactly "fa".')
  }

  if (!isMeaningfulString(data.planType, 5)) {
    errors.push('planType must be a non-empty string.')
  }

  if (!isMeaningfulString(data.inputQualityDiagnosis, 10)) {
    errors.push('inputQualityDiagnosis must be a meaningful non-empty string.')
  }

  validateStringArray(data.assumptions, 'assumptions', errors, { allowEmpty: true })

  if (!Array.isArray(data.sections)) {
    errors.push('sections must be an array.')
  } else {
    validatePlanSections(data.sections, errors)
  }

  if (!Array.isArray(data.kpis)) {
    errors.push('kpis must be an array.')
  } else if (data.kpis.length < 3) {
    errors.push('kpis must contain at least 3 items.')
  } else {
    validateUniqueKpiNames(data.kpis, errors)
    data.kpis.forEach((item, index) => validateKpiItem(item, `kpis[${index}]`, errors))
  }

  if (!Array.isArray(data.actionPlan30Days)) {
    errors.push('actionPlan30Days must be an array.')
  } else if (data.actionPlan30Days.length < 4) {
    errors.push('actionPlan30Days should contain weekly actions for the 30-day plan.')
  } else {
    validateUniqueActionPlanWeeks(data.actionPlan30Days, errors)
    data.actionPlan30Days.forEach((item, index) => validateActionPlanItem(item, `actionPlan30Days[${index}]`, errors))
  }

  if (!Array.isArray(data.risks) || data.risks.length === 0) {
    errors.push('risks must be a non-empty array.')
  } else {
    validateStringArray(data.risks, 'risks', errors, { minLength: 10 })
  }

  validateQualityScore(data.qualityScore, errors)

  return { ok: errors.length === 0, errors }
}

function validatePlanSections(sections: unknown[], errors: string[]): void {
  if (sections.length !== requiredMarketingPlanSections.length) {
    errors.push(`sections must contain exactly ${requiredMarketingPlanSections.length} items.`)
  }

  const byId = new Map<number, Record<string, unknown>>()

  sections.forEach((section, index) => {
    if (!isRecord(section)) {
      errors.push(`sections[${index}] must be an object.`)
      return
    }

    if (typeof section.id !== 'number' || !Number.isInteger(section.id) || section.id < 1 || section.id > 17) {
      errors.push(`sections[${index}].id must be an integer from 1 to 17.`)
    } else if (byId.has(section.id)) {
      errors.push(`sections contains duplicate id ${section.id}.`)
    } else {
      byId.set(section.id, section)
    }

    if (!isMeaningfulString(section.title, 2)) {
      errors.push(`sections[${index}].title must be a non-empty string.`)
    }

    if (typeof section.contentType !== 'string' || !validContentTypes.has(section.contentType)) {
      errors.push(`sections[${index}].contentType is invalid.`)
    }

    if (!hasMeaningfulContent(section.content)) {
      errors.push(`sections[${index}].content must not be empty or trivially short.`)
    }
  })

  requiredMarketingPlanSections.forEach((required) => {
    const section = byId.get(required.id)
    if (!section) {
      errors.push(`Missing required section ${required.id}: ${required.title}.`)
      return
    }

    if (section.title !== required.title) {
      errors.push(`Section ${required.id} title must be "${required.title}".`)
    }
  })
}

function validateKpiItem(item: unknown, path: string, errors: string[]): void {
  if (!isRecord(item)) {
    errors.push(`${path} must be an object.`)
    return
  }

  ;['name', 'reason', 'formula', 'target', 'channel', 'reviewFrequency', 'riskOrCaution'].forEach((key) => {
    if (!isMeaningfulString(item[key], key === 'name' ? 2 : 5)) {
      errors.push(`${path}.${key} must be a meaningful non-empty string.`)
    }
  })
}

function validateActionPlanItem(item: unknown, path: string, errors: string[]): void {
  if (!isRecord(item)) {
    errors.push(`${path} must be an object.`)
    return
  }

  if (typeof item.week !== 'number' || !Number.isInteger(item.week) || item.week < 1 || item.week > 5) {
    errors.push(`${path}.week must be an integer from 1 to 5.`)
  }
  if (!isMeaningfulString(item.focus, 5)) {
    errors.push(`${path}.focus must be a meaningful non-empty string.`)
  }
  validateStringArray(item.actions, `${path}.actions`, errors, { minLength: 8 })
  if (!isMeaningfulString(item.successMetric, 8)) {
    errors.push(`${path}.successMetric must be a meaningful non-empty string.`)
  }
}

function validateQuestionArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`)
    return
  }

  value.forEach((question, index) => validateQuestion(question, `${path}[${index}]`, errors))
}

function validateQuestion(question: unknown, path: string, errors: string[]): void {
  if (!isRecord(question)) {
    errors.push(`${path} must be an object.`)
    return
  }

  if (!isMeaningfulString(question.id, 2)) {
    errors.push(`${path}.id must be a non-empty string.`)
  }
  if (!isMeaningfulString(question.label, 2)) {
    errors.push(`${path}.label must be a non-empty Persian label.`)
  }
  if (!hasPersianText(question.label) || !hasPersianText(question.question) || !hasPersianText(question.whyItMatters)) {
    errors.push(`${path} user-visible label, question, and whyItMatters must be Persian.`)
  }
  if (!isMeaningfulString(question.question, 18)) {
    errors.push(`${path}.question must be specific and meaningful.`)
  }
  if (!isMeaningfulString(question.whyItMatters, 25)) {
    errors.push(`${path}.whyItMatters must explain the planning impact.`)
  }

  if (typeof question.expectedAnswerType !== 'string' || !validQuestionAnswerTypes.has(question.expectedAnswerType as ClarifyingQuestionExpectedAnswerType)) {
    errors.push(`${path}.expectedAnswerType is invalid.`)
  }

  if (typeof question.required !== 'boolean') {
    errors.push(`${path}.required must be boolean.`)
  }

  if (typeof question.priority !== 'string' || !validQuestionPriorities.has(question.priority as ClarifyingQuestionPriority)) {
    errors.push(`${path}.priority must be بالا, متوسط, or پایین.`)
  }

  if (typeof question.decisionImpact !== 'string' || !validDecisionImpacts.has(question.decisionImpact as ClarifyingDecisionImpact)) {
    errors.push(`${path}.decisionImpact is invalid.`)
  }

  if (
    (question.expectedAnswerType === 'choice' || question.expectedAnswerType === 'multiChoice') &&
    (!Array.isArray(question.options) || question.options.length === 0)
  ) {
    errors.push(`${path}.options must be provided for choice and multiChoice questions.`)
  }

  if (Array.isArray(question.options)) {
    validateStringArray(question.options, `${path}.options`, errors, { minLength: 1 })
  }
}

function validateQualityScore(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('qualityScore must be an object.')
    return
  }

  if (!isNumberInRange(value.score, 0, 100)) {
    errors.push('qualityScore.score must be a number from 0 to 100.')
  }

  ;['strengths', 'weaknesses', 'missingInputs', 'improvementSuggestions'].forEach((key) => {
    validateStringArray(value[key], `qualityScore.${key}`, errors, {
      allowEmpty: false,
      minLength: 5,
    })
  })
}

function validateUniqueQuestionIds(requiredQuestions: unknown, optionalQuestions: unknown, errors: string[]): void {
  const allQuestions = [
    ...(Array.isArray(requiredQuestions) ? requiredQuestions : []),
    ...(Array.isArray(optionalQuestions) ? optionalQuestions : []),
  ]
  const seen = new Set<string>()

  allQuestions.forEach((question, index) => {
    if (!isRecord(question) || typeof question.id !== 'string') return
    const normalized = question.id.trim().toLowerCase()
    if (!normalized) return
    if (seen.has(normalized)) {
      errors.push(`Question id "${question.id}" is duplicated.`)
    }
    seen.add(normalized)
  })

  if (allQuestions.length > 0 && seen.size === 0) {
    errors.push('Question ids must be valid and unique.')
  }
}

function validateUniqueKpiNames(kpis: unknown[], errors: string[]): void {
  const seen = new Set<string>()
  kpis.forEach((item) => {
    if (!isRecord(item) || typeof item.name !== 'string') return
    const normalized = item.name.trim().toLowerCase()
    if (!normalized) return
    if (seen.has(normalized)) {
      errors.push(`KPI name "${item.name}" is duplicated.`)
    }
    seen.add(normalized)
  })
}

function validateUniqueActionPlanWeeks(actionItems: unknown[], errors: string[]): void {
  const seen = new Set<number>()
  actionItems.forEach((item) => {
    if (!isRecord(item) || typeof item.week !== 'number' || !Number.isInteger(item.week)) return
    if (seen.has(item.week)) {
      errors.push(`actionPlan30Days contains duplicate week ${item.week}.`)
    }
    seen.add(item.week)
  })
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[],
  options: { allowEmpty?: boolean; minLength?: number } = {},
): void {
  const { allowEmpty = false, minLength = 3 } = options
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`)
    return
  }

  if (!allowEmpty && value.length === 0) {
    errors.push(`${path} must not be empty.`)
    return
  }

  value.forEach((item, index) => {
    if (!isMeaningfulString(item, minLength)) {
      errors.push(`${path}[${index}] must be a meaningful non-empty string.`)
    }
  })
}

function stripCodeFence(value: string): string {
  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMeaningfulString(value: unknown, minLength: number): value is string {
  return typeof value === 'string' && value.trim().length >= minLength
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function hasPersianText(value: unknown): boolean {
  return typeof value === 'string' && /[\u0600-\u06ff]/.test(value)
}

function hasMeaningfulContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length >= 20
  if (Array.isArray(value)) {
    return value.length > 0 && value.some((item) => hasMeaningfulContent(item))
  }
  if (isRecord(value)) {
    const serializedLength = JSON.stringify(value).replace(/[{}\[\]",:\s]/g, '').length
    return Object.keys(value).length > 0 && serializedLength >= 20
  }
  return value !== null && value !== undefined
}
