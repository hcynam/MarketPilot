import type {
  AIFinalMarketingPlanResponse,
  ClarifyingQuestionsResponse,
} from '../../netlify/functions/_shared/marketingSchemas'

type MarketingAiMode = 'questions' | 'plan'

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
}

interface FunctionSuccessResponse<T> {
  ok: true
  mode: MarketingAiMode
  data: T
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
}

export interface AIClientSuccess<T> {
  ok: true
  data: T
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
    }

    logProviderDiagnostic(failure)

    return failure
  }

  return {
    ok: true,
    data: json.data,
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
  }
}

function logProviderDiagnostic(error: AIClientFailure) {
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
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
