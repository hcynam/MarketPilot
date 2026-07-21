import type { BaselineDigest } from '../../src/ai/baselineDigest'
import type { CompactBusinessBrief } from '../../src/ai/buildBusinessBrief'
import {
  buildClarifyingQuestionsPrompt,
  buildStrategyPatchPrompt,
  type PromptParts,
} from './_shared/promptBuilders'
import {
  REQUEST_BUDGETS,
  preflightProviderRequest,
  safePreflightLog,
  type ProviderName,
  type ProviderRequestMode,
} from './_shared/requestPreflight'
import {
  safeParseJson,
  validateClarifyingQuestionsResponse,
  validateStrategyPatch,
} from './_shared/validateAIResponse'
import { isStrictGroqModel, strategyPatchJsonSchema } from './_shared/strategyPatchJsonSchema'
import type {
  ProviderAttemptDiagnostic,
  ProviderRequestFormat,
  ProviderResponseDiagnostic,
  RequestPreflightDiagnostic,
} from './_shared/marketingSchemas'

declare const process: { env: Record<string, string | undefined> }
declare const Buffer: { from(value: string, encoding: 'base64'): { toString(encoding: 'utf8'): string } } | undefined

type MarketingAiMode = 'questions' | 'plan'

interface MarketingAiPayload {
  mode?: unknown
  businessBrief?: unknown
  baselineDigest?: unknown
  clarifyingAnswers?: unknown
  contextNotes?: unknown
  baselinePlan?: unknown
  businessInput?: unknown
}

interface FunctionEvent {
  httpMethod?: string
  body?: string | null
  isBase64Encoded?: boolean
}

interface ProviderConfig {
  name: ProviderName
  model: string
  apiKey?: string
}

interface ProviderCallResult {
  json: unknown
  httpStatus: number
  attemptDiagnostic: ProviderAttemptDiagnostic
}

interface ExtractedProviderResponse {
  text: string
  finishReason?: string
  reasoningChars: number
}

interface SafeProviderErrorMetadata {
  httpStatus: number
  providerCode?: string
  providerType?: string
  sanitizedMessage?: string
  requestId?: string
  modelUnavailable: boolean
}

class ProviderRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly retryable: boolean,
    readonly metadata?: SafeProviderErrorMetadata,
    public attemptDiagnostic?: ProviderAttemptDiagnostic,
  ) {
    super(message)
  }
}

const maxRequestBodyChars = 18000

export async function handler(event: FunctionEvent) {
  if (event.httpMethod !== 'POST') return errorResponse(405, 'unknown', 'METHOD_NOT_ALLOWED', 'Only POST requests are supported.')
  if (event.body && event.body.length > maxRequestBodyChars) return errorResponse(413, 'unknown', 'REQUEST_TOO_LARGE', 'Request body exceeded the local safety limit.')

  const parsed = parseRequestBody(event)
  if (!parsed.ok) return errorResponse(400, 'unknown', parsed.errorCode, parsed.errorMessage)
  const payload = parsed.payload
  if (payload.mode !== 'questions' && payload.mode !== 'plan') return errorResponse(400, 'unknown', 'INVALID_MODE', 'Request mode must be questions or plan.')
  if (!isRecord(payload.businessBrief)) return errorResponse(400, payload.mode, 'MISSING_COMPACT_BRIEF', 'A compact business brief is required.')
  if ('baselinePlan' in payload || 'businessInput' in payload) return errorResponse(400, payload.mode, 'NON_COMPACT_PAYLOAD_REJECTED', 'Raw form data and complete plans are not accepted.')
  if (payload.mode === 'plan' && !isRecord(payload.baselineDigest)) return errorResponse(400, payload.mode, 'MISSING_BASELINE_DIGEST', 'A compact baseline digest is required.')

  const config = resolveProviderConfig()
  const mode: ProviderRequestMode = payload.mode === 'questions' ? 'clarification' : 'strategy_patch'
  const businessBrief = compactRecord(payload.businessBrief) as CompactBusinessBrief
  const baselineDigest = compactRecord(payload.baselineDigest) as BaselineDigest
  const clarifyingAnswers = compactRecord(payload.clarifyingAnswers)
  const contextNotes = readOptionalStringArray(payload.contextNotes)

  let prompt = buildPrompt(payload.mode, businessBrief, baselineDigest, clarifyingAnswers, contextNotes)
  let diagnostic = preflightProviderRequest({ mode, provider: config.name, selectedModel: config.model, prompt })
  if (diagnostic.blockedLocally && contextNotes?.length) {
    prompt = buildPrompt(payload.mode, businessBrief, baselineDigest, clarifyingAnswers, undefined)
    diagnostic = preflightProviderRequest({
      mode,
      provider: config.name,
      selectedModel: config.model,
      prompt,
      compressionApplied: true,
      optionalContextRemoved: true,
    })
  }
  safePreflightLog(diagnostic)
  if (diagnostic.blockedLocally) {
    return jsonResponse(413, {
      ok: false,
      mode: payload.mode,
      errorCode: 'LOCAL_REQUEST_BUDGET_EXCEEDED',
      errorMessage: 'The request was blocked locally before contacting the AI provider.',
      diagnostic,
    })
  }
  if (!config.apiKey) return errorResponse(503, payload.mode, 'AI_AUTH_NOT_CONFIGURED', 'AI service is not configured on the server.', diagnostic)

  try {
    const providerResult = await callProviderWithAttemptPolicy(config, mode, prompt)
    const attemptDiagnostic: RequestPreflightDiagnostic = { ...diagnostic, ...providerResult.attemptDiagnostic }
    const extracted = extractProviderResponse(config.name, providerResult.json)
    const baseResponseDiagnostic: ProviderResponseDiagnostic = {
      providerHttpStatus: providerResult.httpStatus,
      providerFinishReason: extracted.finishReason,
      providerContentChars: extracted.text.length,
      providerReasoningChars: extracted.reasoningChars,
      parsedJson: false,
      rawTopLevelKeys: [],
      normalizedTopLevelKeys: [],
      recognizedPatchAreas: [],
      unknownTopLevelKeys: [],
      acceptedPatchAreas: [],
      rejectedPatchAreas: [],
    }
    if (!extracted.text) {
      safeProviderResponseLog(baseResponseDiagnostic)
      return errorResponse(502, payload.mode, 'AI_EMPTY_RESPONSE', 'AI service returned an empty response.', attemptDiagnostic, undefined, baseResponseDiagnostic)
    }
    const json = safeParseJson(extracted.text)
    if (!json.ok) {
      safeProviderResponseLog(baseResponseDiagnostic)
      return errorResponse(200, payload.mode, 'AI_MALFORMED_JSON', 'AI response was not valid JSON.', attemptDiagnostic, json.errors, baseResponseDiagnostic)
    }

    if (payload.mode === 'questions') {
      const validation = validateClarifyingQuestionsResponse(json.data)
      const questionDiagnostic = {
        ...baseResponseDiagnostic,
        parsedJson: true,
        rawTopLevelKeys: isRecord(json.data) ? Object.keys(json.data).sort() : [],
        normalizedTopLevelKeys: isRecord(json.data) ? Object.keys(json.data).sort() : [],
      }
      safeProviderResponseLog(questionDiagnostic)
      if (!validation.ok) return errorResponse(200, payload.mode, 'AI_SCHEMA_MISMATCH', 'Clarification response did not match the required contract.', attemptDiagnostic, validation.errors, questionDiagnostic)
      return jsonResponse(200, { ok: true, mode: payload.mode, data: json.data, diagnostic: attemptDiagnostic, providerDiagnostic: questionDiagnostic })
    }

    const validation = validateStrategyPatch(json.data)
    const providerDiagnostic: ProviderResponseDiagnostic = {
      ...baseResponseDiagnostic,
      parsedJson: true,
      rawTopLevelKeys: validation.normalization.rawTopLevelKeys,
      unwrappedFrom: validation.normalization.unwrappedFrom,
      normalizedTopLevelKeys: validation.normalization.normalizedTopLevelKeys,
      recognizedPatchAreas: validation.normalization.recognizedPatchAreas,
      unknownTopLevelKeys: validation.normalization.unknownTopLevelKeys,
      acceptedPatchAreas: validation.acceptedPatchAreas,
      rejectedPatchAreas: validation.rejectedPatchAreas,
    }
    safeProviderResponseLog(providerDiagnostic)
    if (!validation.usablePatch) {
      return errorResponse(200, payload.mode, 'AI_PATCH_REJECTED', 'No usable strategy patch area was returned.', attemptDiagnostic, validation.rejectedPatchAreas.map((item) => `${item.area}: ${item.reason}`), providerDiagnostic)
    }
    const successfulDiagnostic = markStructuredFallbackSucceeded(attemptDiagnostic)
    return jsonResponse(200, {
      ok: true,
      mode: payload.mode,
      data: {
        patch: validation.patch,
        diagnostic: {
          acceptedPatchAreas: validation.acceptedPatchAreas,
          rejectedPatchAreas: validation.rejectedPatchAreas,
          usablePatch: true,
        },
      },
      diagnostic: successfulDiagnostic,
      providerDiagnostic,
    })
  } catch (error) {
    const classified = classifyProviderError(error)
    const attemptDiagnostic = error instanceof ProviderRequestError && error.attemptDiagnostic
      ? { ...diagnostic, ...error.attemptDiagnostic }
      : diagnostic
    return errorResponse(classified.httpStatus, payload.mode, classified.code, classified.message, attemptDiagnostic)
  }
}

function buildPrompt(
  mode: MarketingAiMode,
  businessBrief: CompactBusinessBrief,
  baselineDigest: BaselineDigest,
  clarifyingAnswers: Record<string, unknown>,
  contextNotes: string[] | undefined,
): PromptParts {
  return mode === 'questions'
    ? buildClarifyingQuestionsPrompt({ businessBrief, contextNotes })
    : buildStrategyPatchPrompt({ businessBrief, baselineDigest, clarifyingAnswers, contextNotes })
}

async function callProviderWithAttemptPolicy(
  config: ProviderConfig,
  mode: ProviderRequestMode,
  prompt: PromptParts,
): Promise<ProviderCallResult> {
  const primaryFormat = requestFormatFor(config, mode)
  try {
    const result = await callProviderOnce(config, mode, prompt, primaryFormat)
    return {
      ...result,
      attemptDiagnostic: successfulAttemptDiagnostic(primaryFormat, result.httpStatus),
    }
  } catch (error) {
    if (!(error instanceof ProviderRequestError)) throw error
    safeProviderRequestErrorLog(error)

    if (shouldUseStructuredFallback(config, mode, primaryFormat, error)) {
      const fallbackFormat: ProviderRequestFormat = 'json_object_fallback'
      try {
        const result = await callProviderOnce(config, mode, prompt, fallbackFormat)
        return {
          ...result,
          attemptDiagnostic: {
            ...providerErrorAttemptDiagnostic(error, fallbackFormat),
            structuredFallbackAttempted: true,
            structuredFallbackSucceeded: false,
          },
        }
      } catch (fallbackError) {
        if (!(fallbackError instanceof ProviderRequestError)) throw fallbackError
        safeProviderRequestErrorLog(fallbackError)
        fallbackError.attemptDiagnostic = {
          ...providerErrorAttemptDiagnostic(fallbackError, fallbackFormat),
          structuredFallbackAttempted: true,
          structuredFallbackSucceeded: false,
        }
        throw fallbackError
      }
    }

    if (!error.retryable) {
      error.attemptDiagnostic = providerErrorAttemptDiagnostic(error, primaryFormat)
      throw error
    }

    await delay(300)
    try {
      const result = await callProviderOnce(config, mode, prompt, primaryFormat)
      return {
        ...result,
        attemptDiagnostic: successfulAttemptDiagnostic(primaryFormat, result.httpStatus),
      }
    } catch (retryError) {
      if (!(retryError instanceof ProviderRequestError)) throw retryError
      safeProviderRequestErrorLog(retryError)
      retryError.attemptDiagnostic = providerErrorAttemptDiagnostic(retryError, primaryFormat)
      throw retryError
    }
  }
}

async function callProviderOnce(
  config: ProviderConfig,
  mode: ProviderRequestMode,
  prompt: PromptParts,
  requestFormat: ProviderRequestFormat,
): Promise<Omit<ProviderCallResult, 'attemptDiagnostic'>> {
  const controller = new AbortController()
  const timeoutMs = resolveProviderTimeoutMs()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = config.name === 'groq'
      ? await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(buildGroqRequestBody(config.model, mode, prompt, requestFormat)),
      })
      : await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey ?? '' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.systemPrompt }] },
          contents: [{ parts: [{ text: prompt.userPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: REQUEST_BUDGETS[mode].outputTokens,
          },
        }),
      })

    if (!response.ok) {
      const metadata = await readSafeProviderError(response)
      throw providerHttpError(response.status, metadata)
    }
    return { json: await response.json(), httpStatus: response.status }
  } catch (error) {
    if (error instanceof ProviderRequestError) throw error
    if (error instanceof Error && error.name === 'AbortError') throw new ProviderRequestError('AI_TIMEOUT', 504, 'AI service timed out.', true)
    throw new ProviderRequestError('AI_NETWORK_FAILURE', 502, 'AI service could not be reached.', true)
  } finally {
    clearTimeout(timeout)
  }
}

function providerHttpError(status: number, metadata: SafeProviderErrorMetadata): ProviderRequestError {
  if (status === 413) return new ProviderRequestError('AI_REQUEST_TOO_LARGE', status, 'AI provider rejected the request size.', false, metadata)
  if (status === 429) return new ProviderRequestError('AI_RATE_LIMITED', status, 'AI provider is temporarily rate-limited.', false, metadata)
  if (status === 401 || status === 403) return new ProviderRequestError('AI_AUTHENTICATION_FAILED', status, 'AI provider authentication failed.', false, metadata)
  if (status >= 500) return new ProviderRequestError('AI_PROVIDER_5XX', status, 'AI provider is temporarily unavailable.', true, metadata)
  const code = metadata.modelUnavailable ? 'AI_MODEL_UNAVAILABLE' : metadata.providerCode || 'AI_PROVIDER_REJECTED'
  return new ProviderRequestError(code, status, 'AI provider rejected the request.', false, metadata)
}

function classifyProviderError(error: unknown): { code: string; httpStatus: number; message: string } {
  if (error instanceof ProviderRequestError) {
    const userMessages: Record<string, string> = {
      AI_REQUEST_TOO_LARGE: 'درخواست پیش از دریافت پاسخ توسط سرویس رد شد؛ برنامه کامل داخلی حفظ شد.',
      AI_RATE_LIMITED: 'سرویس هوش مصنوعی موقتاً به سقف استفاده رسیده است؛ برنامه داخلی قابل استفاده است.',
      AI_AUTHENTICATION_FAILED: 'تنظیمات سرویس هوش مصنوعی نیازمند بررسی مدیر سامانه است.',
      AI_TIMEOUT: 'سرویس هوش مصنوعی در زمان مقرر پاسخ نداد؛ برنامه داخلی حفظ شد.',
      AI_NETWORK_FAILURE: 'ارتباط با سرویس هوش مصنوعی برقرار نشد؛ برنامه داخلی حفظ شد.',
      AI_PROVIDER_5XX: 'سرویس هوش مصنوعی موقتاً در دسترس نیست؛ برنامه داخلی حفظ شد.',
      AI_MODEL_UNAVAILABLE: 'مدل تنظیم‌شده در سرویس هوش مصنوعی در دسترس نیست؛ مدل یا مجوزهای پروژه را بررسی کنید.',
    }
    return {
      code: error.code,
      httpStatus: error.status >= 400 && error.status < 600 ? error.status : 502,
      message: userMessages[error.code] || 'سرویس هوش مصنوعی پاسخ قابل استفاده‌ای برنگرداند؛ برنامه کامل داخلی حفظ شد.',
    }
  }
  return { code: 'AI_PROVIDER_UNKNOWN_FAILURE', httpStatus: 502, message: 'سرویس هوش مصنوعی پاسخ قابل استفاده‌ای برنگرداند.' }
}

function resolveProviderConfig(): ProviderConfig {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase()
  const name: ProviderName = requested === 'groq' || (!requested && process.env.GROQ_API_KEY) ? 'groq' : 'gemini'
  if (name === 'groq') {
    return {
      name,
      model: normalizeModel(process.env.GROQ_MODEL || process.env.AI_MODEL || 'openai/gpt-oss-120b'),
      apiKey: process.env.GROQ_API_KEY,
    }
  }
  return {
    name,
    model: normalizeModel(process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.5-flash'),
    apiKey: process.env.GEMINI_API_KEY,
  }
}

export function buildGroqRequestBody(
  model: string,
  mode: ProviderRequestMode,
  prompt: PromptParts,
  requestFormat: ProviderRequestFormat = mode === 'strategy_patch' && isStrictGroqModel(model)
    ? 'strict_json_schema'
    : 'json_object',
): Record<string, unknown> {
  const strictPatch = requestFormat === 'strict_json_schema'
  return {
    model,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userPrompt },
    ],
    temperature: 0.2,
    max_completion_tokens: REQUEST_BUDGETS[mode].outputTokens,
    response_format: strictPatch
      ? {
        type: 'json_schema',
        json_schema: {
          name: 'marketpilot_strategy_patch',
          strict: true,
          schema: strategyPatchJsonSchema,
        },
      }
      : { type: 'json_object' },
    ...(isStrictGroqModel(model) ? { reasoning_effort: 'low' } : {}),
    ...(model.includes('qwen3') ? { reasoning_effort: 'none', reasoning_format: 'hidden' } : {}),
  }
}

function requestFormatFor(config: ProviderConfig, mode: ProviderRequestMode): ProviderRequestFormat {
  return config.name === 'groq' && mode === 'strategy_patch' && isStrictGroqModel(config.model)
    ? 'strict_json_schema'
    : 'json_object'
}

function shouldUseStructuredFallback(
  config: ProviderConfig,
  mode: ProviderRequestMode,
  requestFormat: ProviderRequestFormat,
  error: ProviderRequestError,
): boolean {
  return config.name === 'groq'
    && mode === 'strategy_patch'
    && requestFormat === 'strict_json_schema'
    && error.metadata?.providerCode === 'json_validate_failed'
}

function successfulAttemptDiagnostic(
  providerRequestFormat: ProviderRequestFormat,
  providerHttpStatus: number,
): ProviderAttemptDiagnostic {
  return {
    providerRequestFormat,
    structuredFallbackAttempted: false,
    structuredFallbackSucceeded: false,
    providerHttpStatus,
  }
}

function providerErrorAttemptDiagnostic(
  error: ProviderRequestError,
  providerRequestFormat: ProviderRequestFormat,
): ProviderAttemptDiagnostic {
  return {
    providerRequestFormat,
    structuredFallbackAttempted: false,
    structuredFallbackSucceeded: false,
    ...(error.metadata?.httpStatus ? { providerHttpStatus: error.metadata.httpStatus } : {}),
    ...(error.metadata?.providerCode ? { providerErrorCode: error.metadata.providerCode } : {}),
    ...(error.metadata?.providerType ? { providerErrorType: error.metadata.providerType } : {}),
    ...(error.metadata?.requestId ? { providerRequestId: error.metadata.requestId } : {}),
  }
}

function markStructuredFallbackSucceeded(
  diagnostic: RequestPreflightDiagnostic,
): RequestPreflightDiagnostic {
  return diagnostic.structuredFallbackAttempted
    ? { ...diagnostic, structuredFallbackSucceeded: true }
    : diagnostic
}

function extractProviderResponse(provider: ProviderName, response: unknown): ExtractedProviderResponse {
  if (!isRecord(response)) return { text: '', reasoningChars: 0 }
  if (provider === 'groq') {
    const choices = Array.isArray(response.choices) ? response.choices : []
    const first = choices[0]
    if (!isRecord(first) || !isRecord(first.message)) return { text: '', reasoningChars: 0 }
    return {
      text: typeof first.message.content === 'string' ? first.message.content.trim() : '',
      finishReason: typeof first.finish_reason === 'string' ? first.finish_reason : undefined,
      reasoningChars: safeValueLength(first.message.reasoning),
    }
  }
  const candidates = Array.isArray(response.candidates) ? response.candidates : []
  const first = candidates[0]
  if (!isRecord(first) || !isRecord(first.content) || !Array.isArray(first.content.parts)) return { text: '', reasoningChars: 0 }
  return {
    text: first.content.parts.map((part) => isRecord(part) && typeof part.text === 'string' ? part.text : '').join('').trim(),
    finishReason: typeof first.finishReason === 'string' ? first.finishReason : undefined,
    reasoningChars: 0,
  }
}

async function readSafeProviderError(response: Response): Promise<SafeProviderErrorMetadata> {
  const requestId = readSafeRequestId(response.headers)
  try {
    const body = await response.json()
    if (!isRecord(body) || !isRecord(body.error)) {
      return { httpStatus: response.status, requestId, modelUnavailable: false }
    }
    const rawMessage = typeof body.error.message === 'string' ? body.error.message : ''
    const providerCode = safeProviderIdentifier(body.error.code)
    return {
      httpStatus: response.status,
      providerCode,
      providerType: safeProviderIdentifier(body.error.type),
      sanitizedMessage: sanitizeProviderMessage(rawMessage, providerCode),
      requestId,
      modelUnavailable: /model/i.test(rawMessage) && /unavailable|not found|does not exist|deprecat|decommission|blocked/i.test(rawMessage),
    }
  } catch {
    return { httpStatus: response.status, requestId, modelUnavailable: false }
  }
}

function safeProviderIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const normalized = String(value).trim()
  return /^[a-z0-9_.-]{1,80}$/i.test(normalized) ? normalized : undefined
}

function sanitizeProviderMessage(value: string, providerCode: string | undefined): string | undefined {
  const normalized = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  if (providerCode === 'json_validate_failed') return 'Provider could not satisfy the requested JSON schema.'
  if (/rate.?limit|too many requests/i.test(normalized)) return 'Provider rate limit was reached.'
  if (/model/i.test(normalized) && /unavailable|not found|does not exist|deprecat|decommission|blocked/i.test(normalized)) {
    return 'Configured provider model is unavailable.'
  }
  if (/authentication|unauthorized|forbidden|invalid api key/i.test(normalized)) return 'Provider authentication was rejected.'
  return 'Provider returned an error; unstructured detail was omitted.'
}

function readSafeRequestId(headers: Headers): string | undefined {
  for (const name of ['x-request-id', 'request-id', 'cf-ray']) {
    const value = headers.get(name)?.trim()
    if (value && /^[a-z0-9_.:-]{1,120}$/i.test(value)) return value
  }
  return undefined
}

function compactRecord(value: unknown, depth = 0): Record<string, unknown> {
  if (!isRecord(value) || depth > 3) return {}
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (['rawInput', 'baselinePlan', 'businessInput'].includes(key) || item === undefined || item === null || item === '') continue
    if (typeof item === 'string') result[key] = compactString(item, depth === 0 ? 900 : 600)
    else if (typeof item === 'number' || typeof item === 'boolean') result[key] = item
    else if (Array.isArray(item)) {
      const compacted = item.slice(0, 12).map((entry) => typeof entry === 'string' ? compactString(entry, 400) : isRecord(entry) ? compactRecord(entry, depth + 1) : entry).filter((entry) => entry !== '')
      if (compacted.length) result[key] = [...new Map(compacted.map((entry) => [JSON.stringify(entry), entry])).values()]
    } else if (isRecord(item)) {
      const nested = compactRecord(item, depth + 1)
      if (Object.keys(nested).length) result[key] = nested
    }
  }
  return result
}

function compactString(value: string, maxChars: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars - 1).trimEnd()}…`
}

function parseRequestBody(event: FunctionEvent): { ok: true; payload: MarketingAiPayload } | { ok: false; errorCode: string; errorMessage: string } {
  if (!event.body) return { ok: false, errorCode: 'MISSING_BODY', errorMessage: 'Request body is required.' }
  try {
    const text = event.isBase64Encoded ? decodeBase64(event.body) : event.body
    const value = JSON.parse(text)
    return isRecord(value) ? { ok: true, payload: value } : { ok: false, errorCode: 'INVALID_JSON_BODY', errorMessage: 'Request body must be an object.' }
  } catch {
    return { ok: false, errorCode: 'INVALID_JSON_BODY', errorMessage: 'Request body must be valid JSON.' }
  }
}

function errorResponse(statusCode: number, mode: MarketingAiMode | 'unknown', errorCode: string, errorMessage: string, diagnostic?: unknown, validationErrors?: string[], providerDiagnostic?: ProviderResponseDiagnostic) {
  return jsonResponse(statusCode, { ok: false, mode, errorCode, errorMessage, ...(diagnostic ? { diagnostic } : {}), ...(validationErrors?.length ? { validationErrors } : {}), ...(providerDiagnostic ? { providerDiagnostic } : {}) })
}

function jsonResponse(statusCode: number, payload: unknown) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(payload) }
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => compactString(item, 300)).slice(0, 4)
  return strings.length ? strings : undefined
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function resolveProviderTimeoutMs(
  env: Record<string, string | undefined> = process.env,
): number {
  const legacyTimeout = readPositiveNumber(
    env.AI_TIMEOUT_MS,
    readPositiveNumber(env.GEMINI_TIMEOUT_MS, 25000),
  )
  return readPositiveNumber(env.AI_PROVIDER_TIMEOUT_MS, legacyTimeout)
}

function normalizeModel(value: string): string {
  return value.replace(/^models\//, '').trim()
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function decodeBase64(value: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(value, 'base64').toString('utf8')
  return atob(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeProviderResponseLog(diagnostic: ProviderResponseDiagnostic): void {
  console.info('MarketPilot AI provider response diagnostic', diagnostic)
}

function safeProviderRequestErrorLog(error: ProviderRequestError): void {
  console.warn('MarketPilot AI provider request diagnostic', {
    providerHttpStatus: error.metadata?.httpStatus,
    providerErrorCode: error.metadata?.providerCode,
    providerErrorType: error.metadata?.providerType,
    providerRequestId: error.metadata?.requestId,
    providerMessage: error.metadata?.sanitizedMessage,
  })
}

function safeValueLength(value: unknown): number {
  if (typeof value === 'string') return value.length
  if (Array.isArray(value)) return value.reduce((total, item) => total + safeValueLength(item), 0)
  return 0
}
