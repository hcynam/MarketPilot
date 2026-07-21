import type { BaselineDigest } from './baselineDigest'
import type { CompactBusinessBrief } from './buildBusinessBrief'
import type {
  ClarifyingQuestionsResponse,
  RequestPreflightDiagnostic,
  StrategyPatchResponse,
} from '../../netlify/functions/_shared/marketingSchemas'

interface FunctionErrorResponse {
  ok: false
  errorCode?: string
  errorMessage?: string
  validationErrors?: string[]
  diagnostic?: RequestPreflightDiagnostic
}

interface FunctionSuccessResponse<T> {
  ok: true
  data: T
  diagnostic?: RequestPreflightDiagnostic
}

export interface AIClientFailure {
  ok: false
  errorMessage: string
  validationErrors?: string[]
  errorCode: string
  diagnostic?: RequestPreflightDiagnostic
}

export interface AIClientSuccess<T> {
  ok: true
  data: T
  diagnostic?: RequestPreflightDiagnostic
}

export type AIClientResult<T> = AIClientSuccess<T> | AIClientFailure

export interface RequestClarifyingQuestionsArgs {
  businessBrief: CompactBusinessBrief
  contextNotes?: string[]
}

export interface RequestFinalMarketingPlanArgs {
  businessBrief: CompactBusinessBrief
  baselineDigest: BaselineDigest
  clarifyingAnswers?: Record<string, unknown>
  contextNotes?: string[]
}

const endpoint = '/.netlify/functions/marketing-ai'

export function requestClarifyingQuestions(
  args: RequestClarifyingQuestionsArgs,
): Promise<AIClientResult<ClarifyingQuestionsResponse>> {
  return postMarketingAI({
    mode: 'questions',
    businessBrief: args.businessBrief,
    contextNotes: args.contextNotes,
  })
}

export function requestFinalMarketingPlan(
  args: RequestFinalMarketingPlanArgs,
): Promise<AIClientResult<StrategyPatchResponse>> {
  return postMarketingAI({
    mode: 'plan',
    businessBrief: args.businessBrief,
    baselineDigest: args.baselineDigest,
    clarifyingAnswers: args.clarifyingAnswers,
    contextNotes: args.contextNotes,
  })
}

async function postMarketingAI<T>(payload: Record<string, unknown>): Promise<AIClientResult<T>> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return failure('AI_NETWORK_FAILURE')
  }

  const json = await safeReadJson(response)
  if (!json) return failure('MALFORMED_FUNCTION_RESPONSE')
  if (!response.ok || !isFunctionSuccess<T>(json)) {
    const error = readFunctionError(json)
    return failure(error.errorCode || `HTTP_${response.status}`, error)
  }
  return { ok: true, data: json.data, diagnostic: json.diagnostic }
}

function failure(
  errorCode: string,
  source: Partial<FunctionErrorResponse> = {},
): AIClientFailure {
  return {
    ok: false,
    errorCode,
    errorMessage: source.errorMessage || userMessageForError(errorCode),
    validationErrors: source.validationErrors,
    diagnostic: source.diagnostic,
  }
}

export function userMessageForError(errorCode: string): string {
  if (errorCode === 'AI_REQUEST_TOO_LARGE' || errorCode === 'LOCAL_REQUEST_BUDGET_EXCEEDED' || errorCode === 'REQUEST_TOO_LARGE') {
    return 'حجم درخواست برای سرویس هوش مصنوعی مناسب نبود؛ برنامه کامل با موتور داخلی تولید شد.'
  }
  if (errorCode === 'AI_RATE_LIMITED') return 'سرویس هوش مصنوعی موقتاً به سقف استفاده رسیده است؛ برنامه کامل داخلی تولید شد.'
  if (errorCode === 'AI_AUTHENTICATION_FAILED' || errorCode === 'AI_AUTH_NOT_CONFIGURED') return 'سرویس هوش مصنوعی در حال حاضر پیکربندی یا قابل دسترس نیست؛ برنامه کامل داخلی تولید شد.'
  if (errorCode === 'AI_TIMEOUT') return 'پاسخ سرویس هوش مصنوعی بیش از حد طول کشید؛ برنامه کامل داخلی تولید شد.'
  if (errorCode === 'AI_PATCH_REJECTED' || errorCode === 'AI_SCHEMA_MISMATCH' || errorCode === 'AI_MALFORMED_JSON') return 'پیشنهاد هوش مصنوعی قابل اعمال نبود؛ ساختار کامل برنامه داخلی حفظ شد.'
  return 'سرویس هوش مصنوعی موقتاً در دسترس نبود؛ برنامه کامل با موتور داخلی تولید شد.'
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
  if (!isRecord(value)) return { ok: false, errorCode: 'MALFORMED_FUNCTION_RESPONSE' }
  return {
    ok: false,
    errorCode: typeof value.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value.errorMessage === 'string' ? value.errorMessage : undefined,
    validationErrors: Array.isArray(value.validationErrors) ? value.validationErrors.filter((item): item is string => typeof item === 'string') : undefined,
    diagnostic: isRecord(value.diagnostic) ? value.diagnostic as unknown as RequestPreflightDiagnostic : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
