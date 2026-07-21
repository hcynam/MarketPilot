import { normalizeStrategyPatchInput } from './normalizeStrategyPatch'
import type {
  AIStrategyPatch,
  ClarifyingDecisionImpact,
  ClarifyingQuestionExpectedAnswerType,
  ClarifyingQuestionPriority,
  StrategyPatchValidationResult,
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

type RejectedArea = { area: string; reason: string }

const validModes = new Set(['needs_clarification', 'ready_for_plan'])
const validQuestionAnswerTypes = new Set<ClarifyingQuestionExpectedAnswerType>(['text', 'number', 'choice', 'multiChoice'])
const validQuestionPriorities = new Set<ClarifyingQuestionPriority>(['high', 'medium', 'low'])
const validDecisionImpacts = new Set<ClarifyingDecisionImpact>([
  'segmentation', 'positioning', 'channel', 'pricing', 'kpi', 'budget', 'funnel',
  'competition', 'customer', 'offer', 'trust', 'distribution', 'goal', 'other',
])

export function safeParseJson(text: string): SafeJsonParseResult {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, data: null, errors: ['JSON text is empty.'] }
  }
  const trimmed = stripCodeFence(text.trim())
  const attempts = [trimmed]
  const firstObject = trimmed.indexOf('{')
  const lastObject = trimmed.lastIndexOf('}')
  if (firstObject >= 0 && lastObject > firstObject) attempts.push(trimmed.slice(firstObject, lastObject + 1))
  for (const candidate of attempts) {
    try {
      return { ok: true, data: JSON.parse(candidate), errors: [] }
    } catch {
      // Only one deterministic local extraction candidate is attempted.
    }
  }
  return { ok: false, data: null, errors: ['Invalid JSON.'] }
}

export function validateClarifyingQuestionsResponse(data: unknown): ValidationResult {
  const errors: string[] = []
  if (!isRecord(data)) return { ok: false, errors: ['Response must be a JSON object.'] }
  if (typeof data.mode !== 'string' || !validModes.has(data.mode)) errors.push('mode is invalid.')
  if (!isNumberInRange(data.inputQualityScore, 0, 100)) errors.push('inputQualityScore must be 0-100.')
  if (!isMeaningfulText(data.diagnosis, 10)) errors.push('diagnosis is required.')
  validateStringArray(data.missingInformation, 'missingInformation', errors, true)
  validateStringArray(data.assumptionsIfProceeding, 'assumptionsIfProceeding', errors, true)
  validateQuestionArray(data.requiredQuestions, 'requiredQuestions', errors)
  validateQuestionArray(data.optionalQuestions, 'optionalQuestions', errors)
  const required = Array.isArray(data.requiredQuestions) ? data.requiredQuestions : []
  const optional = Array.isArray(data.optionalQuestions) ? data.optionalQuestions : []
  if (data.mode === 'needs_clarification' && (required.length < 3 || required.length > 6)) errors.push('needs_clarification must contain 3-6 required questions.')
  if (data.mode === 'ready_for_plan' && required.length > 0) errors.push('ready_for_plan must not contain required questions.')
  if (optional.length > 2) errors.push('optionalQuestions must not contain more than 2 questions.')
  validateUniqueQuestionIds([...required, ...optional], errors)
  return { ok: errors.length === 0, errors }
}

export function validateStrategyPatch(data: unknown): StrategyPatchValidationResult {
  const normalized = normalizeStrategyPatchInput(data)
  const acceptedPatchAreas: string[] = []
  const rejectedPatchAreas: RejectedArea[] = normalized.unknownTopLevelKeys.map((key) => ({
    area: `unknown:${key}`,
    reason: 'Unknown top-level field was ignored.',
  }))
  const patch: AIStrategyPatch = {}
  const value = normalized.value

  if (!isRecord(value)) {
    return {
      patch,
      acceptedPatchAreas,
      rejectedPatchAreas: [...rejectedPatchAreas, { area: 'response', reason: 'Response must be a JSON object.' }],
      usablePatch: false,
      normalization: normalized,
    }
  }

  validateDiagnosis(value.diagnosis, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateAssumptions(value.assumptions, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateTargetMarket(value.targetMarket, patch, acceptedPatchAreas, rejectedPatchAreas)
  validatePositioning(value.positioning, patch, acceptedPatchAreas, rejectedPatchAreas)
  validatePersonas(value.personas, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateChannels(value.channelPriorities, patch, acceptedPatchAreas, rejectedPatchAreas)
  validatePricing(value.pricingDirection, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateKpis(value.kpis, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateActionPlan(value.actionPlan, patch, acceptedPatchAreas, rejectedPatchAreas)
  validateRisks(value.risks, patch, acceptedPatchAreas, rejectedPatchAreas)

  return {
    patch,
    acceptedPatchAreas,
    rejectedPatchAreas,
    usablePatch: acceptedPatchAreas.length > 0,
    normalization: normalized,
  }
}

function validateDiagnosis(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  if (value === undefined || value === null) return
  const text = sanitizeText(value)
  if (!isBusinessSpecificSentence(text)) {
    rejected.push({ area: 'diagnosis', reason: 'Diagnosis must be a meaningful business-specific sentence.' })
    return
  }
  patch.diagnosis = text
  accepted.push('diagnosis')
}

function validateAssumptions(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return
  if (!Array.isArray(value)) {
    rejected.push({ area: 'assumptions', reason: 'Assumptions must be an array.' })
    return
  }
  const values = sanitizeStringArray(value)
  if (values.length === 0) {
    rejected.push({ area: 'assumptions', reason: 'No meaningful assumptions were found.' })
    return
  }
  patch.assumptions = values
  accepted.push('assumptions')
}

function validateTargetMarket(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  if (value === undefined || value === null) return
  if (!isRecord(value)) return reject(rejected, 'targetMarket', 'Target market must be an object.')
  const primarySegment = meaningful(value.primarySegment)
  const selectionReason = meaningful(value.selectionReason)
  if (!primarySegment || !selectionReason) return reject(rejected, 'targetMarket', 'Primary segment and selection reason are required.')
  patch.targetMarket = {
    primarySegment,
    selectionReason,
    ...(meaningful(value.secondarySegment) ? { secondarySegment: meaningful(value.secondarySegment) } : {}),
  }
  accepted.push('targetMarket')
}

function validatePositioning(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  if (value === undefined || value === null) return
  if (!isRecord(value)) return reject(rejected, 'positioning', 'Positioning must be an object.')
  const positioningStatement = meaningful(value.positioningStatement)
  const valueProposition = meaningful(value.valueProposition)
  const usp = meaningful(value.usp)
  if (!positioningStatement && !valueProposition && !usp) return reject(rejected, 'positioning', 'At least one meaningful positioning field is required.')

  const result: NonNullable<AIStrategyPatch['positioning']> = {}
  if (positioningStatement) result.positioningStatement = positioningStatement
  if (valueProposition) result.valueProposition = valueProposition
  if (usp) result.usp = usp
  const proofNeeded = sanitizeStringArray(value.proofNeeded)
  if (proofNeeded.length > 0) result.proofNeeded = proofNeeded
  reportInvalidProvidedStrings(value, ['positioningStatement', 'valueProposition', 'usp'], 'positioning', rejected)
  patch.positioning = result
  accepted.push('positioning')
}

function validatePersonas(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  validateIndependentItems(value, 'personas', accepted, rejected, (item) => {
    const label = meaningful(item.label)
    const profile = meaningful(item.profile)
    const pain = meaningful(item.pain)
    if (!label || (!profile && !pain)) return null
    return compactObject({
      label,
      profile,
      pain,
      motivation: meaningful(item.motivation),
      objection: meaningful(item.objection),
      buyingTrigger: meaningful(item.buyingTrigger),
    })
  }, (items) => { patch.personas = items as NonNullable<AIStrategyPatch['personas']> })
}

function validateChannels(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  validateIndependentItems(value, 'channelPriorities', accepted, rejected, (item) => {
    const channel = meaningful(item.channel)
    const funnelRole = meaningful(item.funnelRole)
    const recommendedAction = meaningful(item.recommendedAction)
    const kpi = meaningful(item.kpi)
    const rationale = meaningful(item.rationale)
    if (!channel || (!recommendedAction && !funnelRole) || (!rationale && !kpi)) return null
    return compactObject({ channel, funnelRole, recommendedAction, kpi, rationale })
  }, (items) => { patch.channelPriorities = items as NonNullable<AIStrategyPatch['channelPriorities']> })
}

function validatePricing(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  if (value === undefined || value === null) return
  if (!isRecord(value)) return reject(rejected, 'pricingDirection', 'Pricing direction must be an object.')
  const recommendation = meaningful(value.recommendation)
  const rationale = meaningful(value.rationale)
  if (!recommendation || !rationale) return reject(rejected, 'pricingDirection', 'Recommendation and rationale are required.')
  patch.pricingDirection = compactObject({
    recommendation,
    rationale,
    validationExperiment: meaningful(value.validationExperiment),
  })
  accepted.push('pricingDirection')
}

function validateKpis(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  validateIndependentItems(value, 'kpis', accepted, rejected, (item) => {
    const name = meaningful(item.name)
    const formula = meaningful(item.formula)
    const initialTarget = meaningful(item.initialTarget)
    const reviewFrequency = meaningful(item.reviewFrequency)
    if (!name || (!formula && !initialTarget && !reviewFrequency)) return null
    return compactObject({ name, formula, initialTarget, reviewFrequency })
  }, (items) => { patch.kpis = items as NonNullable<AIStrategyPatch['kpis']> })
}

function validateActionPlan(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  validateIndependentItems(value, 'actionPlan', accepted, rejected, (item) => {
    const period = meaningful(item.period)
    const focus = meaningful(item.focus)
    const actions = sanitizeStringArray(item.actions)
    const successMetric = meaningful(item.successMetric)
    if (!period || !focus || (actions.length === 0 && !successMetric)) return null
    return compactObject({ period, focus, actions, successMetric })
  }, (items) => { patch.actionPlan = items as NonNullable<AIStrategyPatch['actionPlan']> })
}

function validateRisks(value: unknown, patch: AIStrategyPatch, accepted: string[], rejected: RejectedArea[]): void {
  validateIndependentItems(value, 'risks', accepted, rejected, (item) => {
    const risk = meaningful(item.risk)
    const mitigation = meaningful(item.mitigation)
    return risk && mitigation ? { risk, mitigation } : null
  }, (items) => { patch.risks = items as NonNullable<AIStrategyPatch['risks']> })
}

function validateIndependentItems(
  value: unknown,
  area: 'personas' | 'channelPriorities' | 'kpis' | 'actionPlan' | 'risks',
  accepted: string[],
  rejected: RejectedArea[],
  sanitize: (item: Record<string, unknown>) => Record<string, unknown> | null,
  assign: (items: Record<string, unknown>[]) => void,
): void {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return
  if (!Array.isArray(value)) return reject(rejected, area, `${area} must be an array.`)
  const items: Record<string, unknown>[] = []
  value.slice(0, 8).forEach((item, index) => {
    const sanitized = isRecord(item) ? sanitize(item) : null
    if (sanitized) items.push(sanitized)
    else rejected.push({ area: `${area}[${index}]`, reason: 'Item is missing the minimum meaningful fields.' })
  })
  if (items.length > 0) {
    assign(items)
    accepted.push(area)
  } else {
    rejected.push({ area, reason: 'No valid items were found.' })
  }
}

function reportInvalidProvidedStrings(
  source: Record<string, unknown>,
  keys: string[],
  area: string,
  rejected: RejectedArea[],
): void {
  keys.forEach((key) => {
    if (source[key] !== undefined && source[key] !== null && !meaningful(source[key])) {
      rejected.push({ area: `${area}.${key}`, reason: 'Provided value was empty or not meaningful.' })
    }
  })
}

function validateQuestionArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) return void errors.push(`${path} must be an array.`)
  value.forEach((question, index) => {
    if (!isRecord(question)) return void errors.push(`${path}[${index}] must be an object.`)
    if (!isMeaningfulText(question.id, 2)) errors.push(`${path}[${index}].id is invalid.`)
    if (!isMeaningfulText(question.question, 18)) errors.push(`${path}[${index}].question is invalid.`)
    if (!isMeaningfulText(question.whyItMatters, 20)) errors.push(`${path}[${index}].whyItMatters is invalid.`)
    if (typeof question.expectedAnswerType !== 'string' || !validQuestionAnswerTypes.has(question.expectedAnswerType as ClarifyingQuestionExpectedAnswerType)) errors.push(`${path}[${index}].expectedAnswerType is invalid.`)
    if (question.required !== true) errors.push(`${path}[${index}].required must be true.`)
    if (typeof question.priority !== 'string' || !validQuestionPriorities.has(question.priority as ClarifyingQuestionPriority)) errors.push(`${path}[${index}].priority is invalid.`)
    if (typeof question.decisionImpact !== 'string' || !validDecisionImpacts.has(question.decisionImpact as ClarifyingDecisionImpact)) errors.push(`${path}[${index}].decisionImpact is invalid.`)
    if ((question.expectedAnswerType === 'choice' || question.expectedAnswerType === 'multiChoice') && sanitizeStringArray(question.options).length === 0) errors.push(`${path}[${index}].options are required.`)
  })
}

function validateUniqueQuestionIds(questions: unknown[], errors: string[]): void {
  const seen = new Set<string>()
  questions.forEach((question) => {
    if (!isRecord(question) || typeof question.id !== 'string') return
    const id = question.id.trim().toLowerCase()
    if (seen.has(id)) errors.push(`Question id "${question.id}" is duplicated.`)
    seen.add(id)
  })
}

function validateStringArray(value: unknown, path: string, errors: string[], allowEmpty: boolean): void {
  if (!Array.isArray(value)) return void errors.push(`${path} must be an array.`)
  if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty.`)
  value.forEach((item, index) => {
    if (!isMeaningfulText(item, 2)) errors.push(`${path}[${index}] is invalid.`)
  })
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.map(sanitizeText).filter((item) => {
    const key = item.toLocaleLowerCase('fa')
    if (item.length < 3 || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 10)
}

function meaningful(value: unknown): string | undefined {
  const text = sanitizeText(value)
  return text.length >= 3 ? text : undefined
}

function isBusinessSpecificSentence(value: string): boolean {
  if (value.length < 12) return false
  if (/^(good|ok|fine|analysis|diagnosis|خوب|مناسب|تحلیل|تشخیص)[.!؟\s]*$/i.test(value)) return false
  return value.split(/\s+/).filter(Boolean).length >= 3
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T
}

function reject(rejected: RejectedArea[], area: string, reason: string): void {
  rejected.push({ area, reason })
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  const clean = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length <= 1200 ? clean : `${clean.slice(0, 1199)}…`
}

function stripCodeFence(value: string): string {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMeaningfulText(value: unknown, minLength: number): value is string {
  return typeof value === 'string' && value.trim().length >= minLength
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}
