import {
  buildClarifyingQuestionsPrompt,
  buildFinalMarketingPlanPrompt,
} from './_shared/promptBuilders'
import {
  safeParseJson,
  validateClarifyingQuestionsResponse,
  validateFinalMarketingPlanResponse,
} from './_shared/validateAIResponse'

declare const process: {
  env: Record<string, string | undefined>
}
declare const Buffer: {
  from(value: string, encoding: 'base64'): { toString(encoding: 'utf8'): string }
} | undefined

type MarketingAiMode = 'questions' | 'plan'

interface MarketingAiPayload {
  mode?: unknown
  businessInput?: unknown
  clarifyingAnswers?: unknown
  assumptions?: unknown
  contextNotes?: unknown
}

interface FunctionEvent {
  httpMethod?: string
  body?: string | null
  isBase64Encoded?: boolean
}

const defaultModel = 'gemini-2.5-flash'
const maxRequestBodyChars = 40000
const maxPromptChars = 30000
const maxProviderErrorMessageChars = 300

interface GeminiProviderDiagnostic {
  providerStatus: number
  providerStatusText: string
  providerErrorStatus?: string
  providerErrorMessage?: string
  modelUsed: string
}

class GeminiProviderError extends Error {
  diagnostic: GeminiProviderDiagnostic

  constructor(diagnostic: GeminiProviderDiagnostic) {
    super('GEMINI_PROVIDER_ERROR')
    this.diagnostic = diagnostic
  }
}

export async function handler(event: FunctionEvent) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      mode: 'unknown',
      errorCode: 'METHOD_NOT_ALLOWED',
      errorMessage: 'Only POST requests are supported.',
    })
  }

  if (event.body && event.body.length > maxRequestBodyChars) {
    return jsonResponse(413, {
      ok: false,
      mode: 'unknown',
      errorCode: 'REQUEST_TOO_LARGE',
      errorMessage: 'Input is too large for one AI request.',
    })
  }

  const parsed = parseRequestBody(event)
  if (!parsed.ok) {
    return jsonResponse(400, {
      ok: false,
      mode: 'unknown',
      errorCode: parsed.errorCode,
      errorMessage: parsed.errorMessage,
    })
  }

  const payload = parsed.payload
  if (payload.mode !== 'questions' && payload.mode !== 'plan') {
    return jsonResponse(400, {
      ok: false,
      mode: 'unknown',
      errorCode: 'INVALID_MODE',
      errorMessage: 'Request mode must be "questions" or "plan".',
    })
  }

  if (!isRecord(payload.businessInput)) {
    return jsonResponse(400, {
      ok: false,
      mode: payload.mode,
      errorCode: 'MISSING_BUSINESS_INPUT',
      errorMessage: 'businessInput must be provided as an object.',
    })
  }

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(500, {
      ok: false,
      mode: payload.mode,
      errorCode: 'MISSING_GEMINI_API_KEY',
      errorMessage: 'AI service is not configured on the server.',
    })
  }

  if (payload.mode === 'questions') {
    return handleQuestionsMode(payload)
  }

  return handlePlanMode(payload)
}

function jsonResponse(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  }
}

function parseRequestBody(event: FunctionEvent):
  | { ok: true; payload: MarketingAiPayload }
  | { ok: false; errorCode: string; errorMessage: string } {
  if (!event.body) {
    return {
      ok: false,
      errorCode: 'MISSING_BODY',
      errorMessage: 'Request body is required.',
    }
  }

  try {
    const bodyText = event.isBase64Encoded
      ? decodeBase64(event.body)
      : event.body
    const payload = JSON.parse(bodyText)

    if (!isRecord(payload)) {
      return {
        ok: false,
        errorCode: 'INVALID_JSON_BODY',
        errorMessage: 'Request body must be a JSON object.',
      }
    }

    return { ok: true, payload }
  } catch {
    return {
      ok: false,
      errorCode: 'INVALID_JSON_BODY',
      errorMessage: 'Request body must be valid JSON.',
    }
  }
}

async function handleQuestionsMode(payload: MarketingAiPayload) {
  const prompt = buildClarifyingQuestionsPrompt({
    businessInput: payload.businessInput as Record<string, unknown>,
    contextNotes: readOptionalStringArray(payload.contextNotes),
  })

  const result = await generateAndValidate({
    mode: 'questions',
    prompt,
    validate: validateClarifyingQuestionsResponse,
  })

  return jsonResponse(result.statusCode, result.payload)
}

async function handlePlanMode(payload: MarketingAiPayload) {
  const prompt = buildFinalMarketingPlanPrompt({
    businessInput: payload.businessInput as Record<string, unknown>,
    clarifyingAnswers: isRecord(payload.clarifyingAnswers) ? payload.clarifyingAnswers : {},
    assumptions: readOptionalStringArray(payload.assumptions),
    contextNotes: readOptionalStringArray(payload.contextNotes),
  })

  const result = await generateAndValidate({
    mode: 'plan',
    prompt,
    validate: validateFinalMarketingPlanResponse,
  })

  return jsonResponse(result.statusCode, result.payload)
}

async function generateAndValidate(args: {
  mode: MarketingAiMode
  prompt: string
  validate: (data: unknown) => { ok: boolean; errors: string[] }
}): Promise<{ statusCode: number; payload: unknown }> {
  if (args.prompt.length > maxPromptChars) {
    return {
      statusCode: 413,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'PROMPT_TOO_LARGE',
        errorMessage: 'The prepared AI prompt is too large. Please shorten the business input.',
      },
    }
  }

  let responseJson: unknown

  try {
    responseJson = await callGemini(args.prompt)
  } catch (error) {
    if (isGeminiTimeoutError(error)) {
      return {
        statusCode: 504,
        payload: {
          ok: false,
          mode: args.mode,
          errorCode: 'GEMINI_TIMEOUT',
          errorMessage: 'AI service timed out. Please try again later.',
        },
      }
    }

    if (isGeminiProviderError(error)) {
      const diagnosticPayload = {
        ok: false,
        mode: args.mode,
        errorCode: 'GEMINI_REQUEST_FAILED',
        errorMessage: 'AI service did not return a usable response. Please try again later.',
        ...error.diagnostic,
      }

      console.error('Gemini provider diagnostic', diagnosticPayload)

      return {
        statusCode: 502,
        payload: diagnosticPayload,
      }
    }

    return {
      statusCode: 502,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'GEMINI_REQUEST_FAILED',
        errorMessage: 'AI service did not return a usable response. Please try again later.',
      },
    }
  }

  let text: string
  try {
    text = extractGeminiText(responseJson)
  } catch {
    return {
      statusCode: 502,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'GEMINI_EMPTY_RESPONSE',
        errorMessage: 'AI service returned an empty response.',
      },
    }
  }

  const parsed = safeParseJson(text)
  if (!parsed.ok) {
    return {
      statusCode: 200,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'AI_JSON_PARSE_FAILED',
        errorMessage: 'AI response was not valid JSON.',
        validationErrors: parsed.errors,
      },
    }
  }

  const validation = args.validate(parsed.data)
  if (!validation.ok) {
    return {
      statusCode: 200,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'AI_VALIDATION_FAILED',
        errorMessage: 'AI response did not match the required planning contract.',
        validationErrors: validation.errors,
      },
    }
  }

  return {
    statusCode: 200,
    payload: {
      ok: true,
      mode: args.mode,
      data: parsed.data,
    },
  }
}

async function callGemini(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing Gemini API key')
  }

  const model = normalizeGeminiModel(process.env.GEMINI_MODEL || defaultModel)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const geminiTimeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 25000)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), geminiTimeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      throw new GeminiProviderError(await buildProviderDiagnostic(response, model))
    }

    return response.json()
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('GEMINI_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function extractGeminiText(responseJson: unknown): string {
  if (!isRecord(responseJson)) {
    throw new Error('Gemini response must be an object')
  }

  const candidates = responseJson.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('Gemini response has no candidates')
  }

  const firstCandidate = candidates[0]
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) {
    throw new Error('Gemini candidate has no content')
  }

  const parts = firstCandidate.content.parts
  if (!Array.isArray(parts)) {
    throw new Error('Gemini content has no parts')
  }

  const text = parts
    .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()

  if (!text) {
    throw new Error('Gemini response text is empty')
  }

  return text
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return strings.length > 0 ? strings : undefined
}

function normalizeGeminiModel(model: string): string {
  return encodeURIComponent(model.replace(/^models\//, '').trim() || defaultModel)
}

async function buildProviderDiagnostic(
  response: Response,
  modelUsed: string,
): Promise<GeminiProviderDiagnostic> {
  const providerError = parseProviderError(await readProviderErrorBody(response))

  return {
    providerStatus: response.status,
    providerStatusText: response.statusText,
    providerErrorStatus: providerError.status,
    providerErrorMessage: truncateProviderErrorMessage(providerError.message),
    modelUsed,
  }
}

async function readProviderErrorBody(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function parseProviderError(bodyText: string): { status?: string; message?: string } {
  if (!bodyText.trim()) {
    return {}
  }

  try {
    const body = JSON.parse(bodyText) as unknown
    if (!isRecord(body) || !isRecord(body.error)) {
      return {}
    }

    const { error } = body
    return {
      status: typeof error.status === 'string' ? error.status : undefined,
      message: typeof error.message === 'string' ? error.message : undefined,
    }
  } catch {
    return {
      message: bodyText,
    }
  }
}

function truncateProviderErrorMessage(message: string | undefined): string | undefined {
  if (!message) return undefined
  return message.length > maxProviderErrorMessageChars
    ? `${message.slice(0, maxProviderErrorMessageChars)}...`
    : message
}

function decodeBase64(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf8')
  }

  return atob(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function isGeminiTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === 'GEMINI_TIMEOUT'
}

function isGeminiProviderError(error: unknown): error is GeminiProviderError {
  return error instanceof GeminiProviderError
}
