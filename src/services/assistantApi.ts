import type {
  AssistantErrorResponse,
  AssistantRequest,
  AssistantResponse,
  AssistantSuccessResponse,
} from '../types/assistant'

export const MAX_ASSISTANT_MESSAGE_LENGTH = 1500
const assistantEndpoint = '/.netlify/functions/marketing-assistant'
const clientTimeoutMs = 30_000

export class AssistantApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'AssistantApiError'
  }
}

export async function requestMarketingAssistant(
  payload: AssistantRequest,
): Promise<AssistantSuccessResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), clientTimeoutMs)

  try {
    const response = await fetch(assistantEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const body = await readResponse(response)

    if (!response.ok || !body.success) {
      const error = body.success ? null : body.error
      throw new AssistantApiError(
        error?.code || `HTTP_${response.status}`,
        error?.message || 'در حال حاضر امکان دریافت پاسخ وجود ندارد. لطفاً دوباره تلاش کنید.',
      )
    }

    return body
  } catch (error) {
    if (error instanceof AssistantApiError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AssistantApiError('AI_TIMEOUT', 'دریافت پاسخ بیش از حد معمول طول کشید. لطفاً دوباره تلاش کنید.')
    }
    throw new AssistantApiError('AI_NETWORK_FAILURE', 'ارتباط با دستیار برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.')
  } finally {
    window.clearTimeout(timeout)
  }
}

async function readResponse(response: Response): Promise<AssistantResponse> {
  try {
    const value: unknown = await response.json()
    if (isSuccessResponse(value) || isErrorResponse(value)) return value
  } catch { /* normalized below */ }
  return {
    success: false,
    error: {
      code: 'MALFORMED_ASSISTANT_RESPONSE',
      message: 'پاسخ دستیار قابل پردازش نبود. لطفاً دوباره تلاش کنید.',
    },
  }
}

function isSuccessResponse(value: unknown): value is AssistantSuccessResponse {
  return isRecord(value)
    && value.success === true
    && typeof value.answer === 'string'
    && Array.isArray(value.suggestions)
    && value.suggestions.every((item) => typeof item === 'string')
}

function isErrorResponse(value: unknown): value is AssistantErrorResponse {
  return isRecord(value)
    && value.success === false
    && isRecord(value.error)
    && typeof value.error.code === 'string'
    && typeof value.error.message === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
