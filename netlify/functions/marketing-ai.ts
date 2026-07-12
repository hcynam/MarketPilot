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

const openRouterEndpoint = 'https://openrouter.ai/api/v1/chat/completions'
const defaultModel = 'openrouter/free'
const defaultSiteUrl = 'https://visionary-jalebi-345b75.netlify.app'
const defaultAppName = 'MarketPilot AI'
const providerTimeoutMs = 25000
const maxRequestBodyChars = 40000
const maxPromptChars = 30000
const maxProviderErrorMessageChars = 300

interface OpenRouterProviderDiagnostic {
  provider: 'openrouter'
  providerStatus: number
  providerStatusText: string
  providerErrorCode?: string
  providerErrorMessage?: string
  modelUsed: string
  mode: MarketingAiMode
}

class OpenRouterProviderError extends Error {
  diagnostic: OpenRouterProviderDiagnostic

  constructor(diagnostic: OpenRouterProviderDiagnostic) {
    super('OPENROUTER_PROVIDER_ERROR')
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

  if (!process.env.OPENROUTER_API_KEY) {
    return jsonResponse(500, {
      ok: false,
      mode: payload.mode,
      errorCode: 'MISSING_OPENROUTER_API_KEY',
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
    responseJson = await callOpenRouter(args.prompt, args.mode)
  } catch (error) {
    if (isOpenRouterTimeoutError(error)) {
      return {
        statusCode: 504,
        payload: {
          ok: false,
          mode: args.mode,
          errorCode: 'OPENROUTER_REQUEST_FAILED',
          errorMessage: 'AI service timed out. Please try again later.',
        },
      }
    }

    if (isOpenRouterProviderError(error)) {
      const errorCode = providerErrorCodeForStatus(error.diagnostic.providerStatus)
      const diagnosticPayload = {
        ok: false,
        mode: args.mode,
        errorCode,
        errorMessage: 'AI service did not return a usable response. Please try again later.',
        ...error.diagnostic,
      }

      console.error('OpenRouter provider diagnostic', diagnosticPayload)

      return {
        statusCode: error.diagnostic.providerStatus === 429 ? 429 : 502,
        payload: diagnosticPayload,
      }
    }

    return {
      statusCode: 502,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'OPENROUTER_REQUEST_FAILED',
        errorMessage: 'AI service did not return a usable response. Please try again later.',
      },
    }
  }

  let text: string
  try {
    text = extractOpenRouterText(responseJson)
  } catch {
    return {
      statusCode: 502,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'OPENROUTER_REQUEST_FAILED',
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

async function callOpenRouter(prompt: string, mode: MarketingAiMode): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('Missing OpenRouter API key')
  }

  const model = normalizeOpenRouterModel(process.env.OPENROUTER_MODEL)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs)

  try {
    const response = await fetch(openRouterEndpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || defaultSiteUrl,
        'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME || defaultAppName,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are MarketPilot AI, a Persian-first expert marketing planning assistant. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: mode === 'questions' ? 0.2 : 0.35,
        max_tokens: mode === 'questions' ? 1200 : 3500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new OpenRouterProviderError(await buildProviderDiagnostic(response, model, mode))
    }

    return response.json()
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('OPENROUTER_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function extractOpenRouterText(responseJson: unknown): string {
  if (!isRecord(responseJson)) {
    throw new Error('OpenRouter response must be an object')
  }

  const choices = responseJson.choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('OpenRouter response has no choices')
  }

  const firstChoice = choices[0]
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error('OpenRouter choice has no message')
  }

  const text = typeof firstChoice.message.content === 'string'
    ? firstChoice.message.content.trim()
    : ''

  if (!text) {
    throw new Error('OpenRouter response text is empty')
  }

  return text
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return strings.length > 0 ? strings : undefined
}

function normalizeOpenRouterModel(model: string | undefined): string {
  const trimmed = (model || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim()
  return trimmed || defaultModel
}

async function buildProviderDiagnostic(
  response: Response,
  modelUsed: string,
  mode: MarketingAiMode,
): Promise<OpenRouterProviderDiagnostic> {
  const providerError = parseProviderError(await readProviderErrorBody(response))

  return {
    provider: 'openrouter',
    providerStatus: response.status,
    providerStatusText: response.statusText,
    providerErrorCode: providerError.code,
    providerErrorMessage: truncateProviderErrorMessage(providerError.message),
    modelUsed,
    mode,
  }
}

async function readProviderErrorBody(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function parseProviderError(bodyText: string): { code?: string; message?: string } {
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
      code: typeof error.code === 'string' || typeof error.code === 'number'
        ? String(error.code)
        : undefined,
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

function providerErrorCodeForStatus(status: number): string {
  if (status === 401 || status === 403) return 'OPENROUTER_AUTH_FAILED'
  if (status === 429) return 'OPENROUTER_RATE_LIMITED'
  return 'OPENROUTER_REQUEST_FAILED'
}

function isOpenRouterTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === 'OPENROUTER_TIMEOUT'
}

function isOpenRouterProviderError(error: unknown): error is OpenRouterProviderError {
  return error instanceof OpenRouterProviderError
}
