import type {
  AIFinalMarketingPlanResponse,
  ClarifyingQuestionsResponse,
} from '../../netlify/functions/_shared/marketingSchemas'
import type { MarketingPlan } from '../types'

type MarketingAiMode = 'questions' | 'plan'
type PlanSource = 'ai-enhanced' | 'ai-partially-enhanced' | 'internal-fallback'
type PatchParseStage = 'provider_response' | 'json_parse' | 'unwrap' | 'patch_validation' | 'patch_quality' | 'merge_quality'

interface FunctionErrorResponse {
  ok: false
  mode?: MarketingAiMode | 'unknown'
  errorCode?: string
  errorMessage?: string
  validationErrors?: string[]
  providerStatus?: number
  providerStatusText?: string
  provider?: string
  providerErrorCode?: string
  providerErrorMessage?: string
  modelUsed?: string
  attempt?: 'json_mode' | 'raw_json_retry'
  validationStage?: 'questions' | 'plan' | 'plan-patch'
  validationIssues?: string[]
  receivedTopLevelKeys?: string[]
  patchTopLevelKeys?: string[]
  qualityIssues?: string[]
  planSource?: PlanSource
  parseStage?: PatchParseStage
  rawTopLevelKeys?: string[]
  patchType?: string
  acceptedPatchAreas?: string[]
  patchQualityScore?: number
  hasBaselinePlan?: boolean
  hasBaselineDigest?: boolean
  hasClarifyingAnswers?: boolean
  attemptedRepair?: boolean
  rawPreview?: string
}

interface FunctionSuccessResponse<T> {
  ok: true
  mode: MarketingAiMode
  data: T
  planSource?: PlanSource
  provider?: string
  modelUsed?: string
  qualityIssues?: string[]
  validationIssues?: string[]
  parseStage?: PatchParseStage
  rawTopLevelKeys?: string[]
  patchTopLevelKeys?: string[]
  patchType?: string
  acceptedPatchAreas?: string[]
  patchQualityScore?: number
  hasBaselinePlan?: boolean
  hasBaselineDigest?: boolean
  hasClarifyingAnswers?: boolean
  attemptedRepair?: boolean
  errorCode?: string
  providerStatus?: number
  providerStatusText?: string
  providerErrorCode?: string
  providerErrorMessage?: string
}

export interface AIClientFailure {
  ok: false
  errorMessage: string
  validationErrors?: string[]
  errorCode?: string
  providerStatus?: number
  providerStatusText?: string
  provider?: string
  providerErrorCode?: string
  providerErrorMessage?: string
  modelUsed?: string
  attempt?: 'json_mode' | 'raw_json_retry'
  validationStage?: 'questions' | 'plan' | 'plan-patch'
  validationIssues?: string[]
  receivedTopLevelKeys?: string[]
  patchTopLevelKeys?: string[]
  qualityIssues?: string[]
  planSource?: PlanSource
  parseStage?: PatchParseStage
  rawTopLevelKeys?: string[]
  patchType?: string
  acceptedPatchAreas?: string[]
  patchQualityScore?: number
  hasBaselinePlan?: boolean
  hasBaselineDigest?: boolean
  hasClarifyingAnswers?: boolean
  attemptedRepair?: boolean
  rawPreview?: string
}

export interface AIClientSuccess<T> {
  ok: true
  data: T
  planSource?: PlanSource
  provider?: string
  modelUsed?: string
  qualityIssues?: string[]
  validationIssues?: string[]
  parseStage?: PatchParseStage
  rawTopLevelKeys?: string[]
  patchTopLevelKeys?: string[]
  patchType?: string
  acceptedPatchAreas?: string[]
  patchQualityScore?: number
  hasBaselinePlan?: boolean
  hasBaselineDigest?: boolean
  hasClarifyingAnswers?: boolean
  attemptedRepair?: boolean
  errorCode?: string
  providerStatus?: number
  providerStatusText?: string
  providerErrorCode?: string
  providerErrorMessage?: string
}

export type AIClientResult<T> = AIClientSuccess<T> | AIClientFailure

export interface RequestClarifyingQuestionsArgs {
  businessInput: Record<string, unknown>
  contextNotes?: string[]
}

export interface RequestFinalMarketingPlanArgs {
  businessInput: Record<string, unknown>
  clarifyingAnswers?: Record<string, unknown>
  assumptions?: string[]
  baselinePlan: MarketingPlan
  contextNotes?: string[]
}

const endpoint = '/.netlify/functions/marketing-ai'

export function requestClarifyingQuestions(
  args: RequestClarifyingQuestionsArgs,
): Promise<AIClientResult<ClarifyingQuestionsResponse>> {
  return postMarketingAI<ClarifyingQuestionsResponse>({
    mode: 'questions',
    businessInput: args.businessInput,
    contextNotes: args.contextNotes,
  })
}

export function requestFinalMarketingPlan(
  args: RequestFinalMarketingPlanArgs,
): Promise<AIClientResult<AIFinalMarketingPlanResponse>> {
  return postMarketingAI<AIFinalMarketingPlanResponse>({
    mode: 'plan',
    businessInput: args.businessInput,
    clarifyingAnswers: args.clarifyingAnswers,
    assumptions: args.assumptions,
    baselinePlan: args.baselinePlan,
    contextNotes: args.contextNotes,
  })
}

async function postMarketingAI<T>(payload: Record<string, unknown>): Promise<AIClientResult<T>> {
  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: 'ارتباط با سرویس هوش مصنوعی برقرار نشد.',
    }
  }

  const json = await safeReadJson(response)
  if (!json) {
    return {
      ok: false,
      errorCode: 'MALFORMED_FUNCTION_RESPONSE',
      errorMessage: 'پاسخ سرویس هوش مصنوعی قابل خواندن نبود.',
    }
  }

  if (!response.ok || !isFunctionSuccess<T>(json)) {
    const error = readFunctionError(json)
    const failure: AIClientFailure = {
      ok: false,
      errorCode: error.errorCode || `HTTP_${response.status}`,
      errorMessage: error.errorMessage || 'سرویس هوش مصنوعی پاسخ معتبر برنگرداند.',
      validationErrors: error.validationErrors,
      providerStatus: error.providerStatus,
      providerStatusText: error.providerStatusText,
      provider: error.provider,
      providerErrorCode: error.providerErrorCode,
      providerErrorMessage: error.providerErrorMessage,
      modelUsed: error.modelUsed,
      attempt: error.attempt,
      validationStage: error.validationStage,
      validationIssues: error.validationIssues,
      receivedTopLevelKeys: error.receivedTopLevelKeys,
      patchTopLevelKeys: error.patchTopLevelKeys,
      qualityIssues: error.qualityIssues,
      planSource: error.planSource,
      parseStage: error.parseStage,
      rawTopLevelKeys: error.rawTopLevelKeys,
      patchType: error.patchType,
      acceptedPatchAreas: error.acceptedPatchAreas,
      patchQualityScore: error.patchQualityScore,
      hasBaselinePlan: error.hasBaselinePlan,
      hasClarifyingAnswers: error.hasClarifyingAnswers,
      attemptedRepair: error.attemptedRepair,
      rawPreview: error.rawPreview,
    }

    logProviderDiagnostic(failure)

    return failure
  }

  return {
    ok: true,
    data: json.data,
    planSource: json.planSource,
    provider: json.provider,
    modelUsed: json.modelUsed,
    qualityIssues: json.qualityIssues,
    validationIssues: json.validationIssues,
    parseStage: json.parseStage,
    rawTopLevelKeys: json.rawTopLevelKeys,
    patchTopLevelKeys: json.patchTopLevelKeys,
    patchType: json.patchType,
    acceptedPatchAreas: json.acceptedPatchAreas,
    patchQualityScore: json.patchQualityScore,
    hasBaselinePlan: json.hasBaselinePlan,
    hasBaselineDigest: json.hasBaselineDigest,
    hasClarifyingAnswers: json.hasClarifyingAnswers,
    attemptedRepair: json.attemptedRepair,
    errorCode: json.errorCode,
    providerStatus: json.providerStatus,
    providerStatusText: json.providerStatusText,
    providerErrorCode: json.providerErrorCode,
    providerErrorMessage: json.providerErrorMessage,
  }
}

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function isFunctionSuccess<T>(value: unknown): value is FunctionSuccessResponse<T> {
  return isRecord(value) && value.ok === true && 'data' in value
}

function readFunctionError(value: unknown): FunctionErrorResponse {
  if (!isRecord(value)) {
    return {
      ok: false,
      errorCode: 'MALFORMED_FUNCTION_RESPONSE',
      errorMessage: 'پاسخ سرویس هوش مصنوعی ساختار معتبر نداشت.',
    }
  }

  return {
    ok: false,
    errorCode: typeof value.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value.errorMessage === 'string' ? value.errorMessage : undefined,
    validationErrors: Array.isArray(value.validationErrors)
      ? value.validationErrors.filter((item): item is string => typeof item === 'string')
      : undefined,
    providerStatus: typeof value.providerStatus === 'number' ? value.providerStatus : undefined,
    providerStatusText: typeof value.providerStatusText === 'string' ? value.providerStatusText : undefined,
    provider: typeof value.provider === 'string' ? value.provider : undefined,
    providerErrorCode: typeof value.providerErrorCode === 'string' ? value.providerErrorCode : undefined,
    providerErrorMessage: typeof value.providerErrorMessage === 'string' ? value.providerErrorMessage : undefined,
    modelUsed: typeof value.modelUsed === 'string' ? value.modelUsed : undefined,
    attempt: value.attempt === 'json_mode' || value.attempt === 'raw_json_retry' ? value.attempt : undefined,
    validationStage: value.validationStage === 'questions' || value.validationStage === 'plan' || value.validationStage === 'plan-patch' ? value.validationStage : undefined,
    validationIssues: readStringArray(value.validationIssues),
    receivedTopLevelKeys: readStringArray(value.receivedTopLevelKeys),
    patchTopLevelKeys: readStringArray(value.patchTopLevelKeys),
    qualityIssues: readStringArray(value.qualityIssues),
    planSource: readPlanSource(value.planSource),
    parseStage: readParseStage(value.parseStage),
    rawTopLevelKeys: readStringArray(value.rawTopLevelKeys),
    patchType: typeof value.patchType === 'string' ? value.patchType : undefined,
    acceptedPatchAreas: readStringArray(value.acceptedPatchAreas),
    patchQualityScore: typeof value.patchQualityScore === 'number' ? value.patchQualityScore : undefined,
    hasBaselinePlan: typeof value.hasBaselinePlan === 'boolean' ? value.hasBaselinePlan : undefined,
    hasBaselineDigest: typeof value.hasBaselineDigest === 'boolean' ? value.hasBaselineDigest : undefined,
    hasClarifyingAnswers: typeof value.hasClarifyingAnswers === 'boolean' ? value.hasClarifyingAnswers : undefined,
    attemptedRepair: typeof value.attemptedRepair === 'boolean' ? value.attemptedRepair : undefined,
    rawPreview: typeof value.rawPreview === 'string' ? value.rawPreview : undefined,
  }
}

function logProviderDiagnostic(error: AIClientFailure) {
  if (error.errorCode === 'AI_VALIDATION_FAILED') {
    console.warn('AI validation diagnostic', {
      validationStage: error.validationStage,
      validationIssues: error.validationIssues,
      receivedTopLevelKeys: error.receivedTopLevelKeys,
      patchTopLevelKeys: error.patchTopLevelKeys,
      qualityIssues: error.qualityIssues,
      planSource: error.planSource,
      modelUsed: error.modelUsed,
    })
    return
  }

  if (typeof error.providerStatus !== 'number') return

  console.warn('Groq provider diagnostic', {
    ok: false,
    errorCode: error.errorCode,
    errorMessage: error.errorMessage,
    providerStatus: error.providerStatus,
    providerStatusText: error.providerStatusText,
    provider: error.provider,
    providerErrorCode: error.providerErrorCode,
    providerErrorMessage: error.providerErrorMessage,
    modelUsed: error.modelUsed,
    attempt: error.attempt,
  })
}

function readStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
}

function readPlanSource(value: unknown): PlanSource | undefined {
  return value === 'ai-enhanced' || value === 'ai-partially-enhanced' || value === 'internal-fallback' ? value : undefined
}

function readParseStage(value: unknown): PatchParseStage | undefined {
  return value === 'provider_response' || value === 'json_parse' || value === 'unwrap'
    || value === 'patch_validation' || value === 'patch_quality' || value === 'merge_quality'
    ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
