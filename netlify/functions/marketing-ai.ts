import {
  buildClarifyingQuestionsPrompt,
  buildFinalMarketingPlanPrompt,
} from './_shared/promptBuilders'
import {
  safeParseJson,
  validateClarifyingQuestionsResponse,
  validateFinalMarketingPlanResponse,
} from './_shared/validateAIResponse'
import { normalizeQuestionsResponse } from './_shared/normalizeAIResponse'
import {
  baselineToFinalResponse,
  assessEnhancementPatch,
  buildBaselineDigest,
  evaluateHybridQuality,
  mergeBaselineWithAIPatch,
  prepareEnhancementPatch,
  type AIEnhancementPatch,
  type BaselineMarketingPlan,
  type PatchParseStage,
} from './_shared/hybridPlan'

declare const process: {
  env: Record<string, string | undefined>
}
declare const Buffer: {
  from(value: string, encoding: 'base64'): { toString(encoding: 'utf8'): string }
} | undefined

type MarketingAiMode = 'questions' | 'plan'
type GroqAttempt = 'json_mode' | 'raw_json_retry'

interface MarketingAiPayload {
  mode?: unknown
  businessInput?: unknown
  clarifyingAnswers?: unknown
  assumptions?: unknown
  baselinePlan?: unknown
  contextNotes?: unknown
}

interface FunctionEvent {
  httpMethod?: string
  body?: string | null
  isBase64Encoded?: boolean
}

const groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions'
const defaultModel = 'qwen/qwen3-32b'
const defaultProviderTimeoutMs = 18000
const maxRequestBodyChars = 40000
const maxPromptChars = 30000
const maxProviderErrorMessageChars = 300

interface GroqProviderDiagnostic {
  provider: 'groq'
  providerStatus: number
  providerStatusText: string
  providerErrorCode?: string
  providerErrorMessage?: string
  modelUsed: string
  mode: MarketingAiMode
  attempt: GroqAttempt
}

class GroqProviderError extends Error {
  diagnostic: GroqProviderDiagnostic
  errorCode?: string

  constructor(diagnostic: GroqProviderDiagnostic, errorCode?: string) {
    super('GROQ_PROVIDER_ERROR')
    this.diagnostic = diagnostic
    this.errorCode = errorCode
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

  if (!process.env.GROQ_API_KEY) {
    return jsonResponse(500, {
      ok: false,
      mode: payload.mode,
      errorCode: 'MISSING_GROQ_API_KEY',
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
    businessInput: payload.businessInput as Record<string, unknown>,
    validate: validateClarifyingQuestionsResponse,
  })

  return jsonResponse(result.statusCode, result.payload)
}

async function handlePlanMode(payload: MarketingAiPayload) {
  if (!isBaselineMarketingPlan(payload.baselinePlan)) {
    return jsonResponse(400, {
      ok: false, mode: 'plan', errorCode: 'MISSING_BASELINE_PLAN',
      errorMessage: 'A valid deterministic baselinePlan is required for plan mode.',
    })
  }

  const businessInput = payload.businessInput as Record<string, unknown>
  const clarifyingAnswers = isRecord(payload.clarifyingAnswers) ? payload.clarifyingAnswers : {}
  const baselinePlan = payload.baselinePlan
  const baselineDigest = buildBaselineDigest(businessInput, baselinePlan, clarifyingAnswers)
  const hasClarifyingAnswers = Object.keys(clarifyingAnswers).length > 0
  let validationIssues: string[] = []
  let qualityIssues: string[] = []
  let invalidPatch: unknown
  let acceptedPatchAreas: string[] = []
  let patchQualityScore = 0
  let parseStage: PatchParseStage = 'provider_response'
  let rawTopLevelKeys: string[] = []
  let patchTopLevelKeys: string[] = []
  let patchType = 'unknown'
  let rawPreview: string | undefined
  let modelUsed = normalizeGroqModel(process.env.GROQ_MODEL)

  for (let qualityAttempt = 0; qualityAttempt < 2; qualityAttempt += 1) {
    const attemptedRepair = qualityAttempt === 1
    const prompt = buildFinalMarketingPlanPrompt({
      businessInput,
      clarifyingAnswers,
      baselineDigest,
      repairIssues: attemptedRepair ? [...validationIssues, ...qualityIssues].slice(0, 20) : undefined,
      invalidPatch: attemptedRepair ? invalidPatch : undefined,
      contextNotes: readOptionalStringArray(payload.contextNotes),
    })
    const result = await generateAndValidate({
      mode: 'plan', prompt, businessInput,
      normalize: (value) => value,
      validate: () => ({ ok: true, errors: [] }),
    })
    const success = readSuccessfulData(result.payload)
    if (!success) {
      modelUsed = readModelUsed(result.payload) || modelUsed
      validationIssues = ensureIssues(readDiagnosticIssues(result.payload), 'Groq patch response could not be parsed or validated.')
      parseStage = readPayloadParseStage(result.payload)
      return hybridFallbackResponse(baselinePlan, businessInput, {
        errorCode: normalizeProviderFailureCode(readErrorCode(result.payload)),
        validationIssues, qualityIssues, parseStage, rawTopLevelKeys, patchTopLevelKeys,
        patchType, hasClarifyingAnswers, attemptedRepair, acceptedPatchAreas, patchQualityScore,
        modelUsed, rawPreview, hasBaselineDigest: true, ...readProviderDetails(result.payload),
      })
    }

    modelUsed = success.modelUsed || modelUsed
    const prepared = prepareEnhancementPatch(success.data)
    parseStage = prepared.parseStage
    rawTopLevelKeys = prepared.rawTopLevelKeys
    patchTopLevelKeys = prepared.patchTopLevelKeys
    patchType = prepared.patchType
    rawPreview = prepared.rawPreview
    invalidPatch = prepared.patch ?? success.data
    if (!prepared.patch) {
      validationIssues = ensureIssues(prepared.validationIssues, 'AI patch object is empty after parsing/unwrapping')
      qualityIssues = []
      if (!attemptedRepair) continue
      return hybridFallbackResponse(baselinePlan, businessInput, {
        errorCode: validationIssues.some((issue) => issue.includes('empty after parsing')) ? 'AI_PATCH_EMPTY' : 'AI_PATCH_VALIDATION_FAILED',
        validationIssues, qualityIssues, parseStage, rawTopLevelKeys, patchTopLevelKeys,
        patchType, hasClarifyingAnswers, attemptedRepair, acceptedPatchAreas, patchQualityScore,
        modelUsed, rawPreview, hasBaselineDigest: true,
      })
    }

    const patch = prepared.patch
    const assessment = assessEnhancementPatch(patch)
    acceptedPatchAreas = assessment.acceptedPatchAreas
    patchQualityScore = assessment.patchQualityScore
    validationIssues = [...new Set([...prepared.validationIssues, ...assessment.validationIssues])].slice(0, 20)
    if (!assessment.usable) {
      qualityIssues = ensureIssues([
        `Patch has ${acceptedPatchAreas.length} usable strategic areas; at least 3 are required.`,
      ], 'Patch did not meet partial enhancement quality.')
      parseStage = 'patch_validation'
      if (!attemptedRepair) continue
      return hybridFallbackResponse(baselinePlan, businessInput, {
        errorCode: 'AI_PATCH_REJECTED',
        validationIssues, qualityIssues, parseStage, rawTopLevelKeys, patchTopLevelKeys,
        patchType, hasClarifyingAnswers, attemptedRepair, acceptedPatchAreas, patchQualityScore,
        modelUsed, rawPreview, hasBaselineDigest: true,
      })
    }

    const finalPlan = mergeBaselineWithAIPatch(baselinePlan, patch, businessInput, clarifyingAnswers, acceptedPatchAreas)
    qualityIssues = evaluateHybridQuality(finalPlan, patch, businessInput, acceptedPatchAreas, clarifyingAnswers)
    const finalValidation = validateFinalMarketingPlanResponse(finalPlan)
    qualityIssues.push(...finalValidation.errors.map((issue) => `Final contract: ${issue}`))
    qualityIssues = [...new Set(qualityIssues)].slice(0, 20)
    if (qualityIssues.length === 0) {
      const planSource = acceptedPatchAreas.length >= 5 ? 'ai-enhanced' : 'ai-partially-enhanced'
      return jsonResponse(200, {
        ok: true, mode: 'plan', data: finalPlan, planSource,
        provider: 'groq', modelUsed, qualityIssues: [], validationIssues,
        acceptedPatchAreas, patchQualityScore, parseStage: 'merge_quality',
        rawTopLevelKeys, patchTopLevelKeys, patchType, hasBaselinePlan: true,
        hasBaselineDigest: true, hasClarifyingAnswers, attemptedRepair,
      })
    }

    parseStage = 'merge_quality'
    console.error('AI patch quality diagnostic', {
      errorCode: 'AI_PATCH_QUALITY_FAILED', provider: 'groq', modelUsed,
      mode: 'plan', validationIssues: validationIssues.slice(0, 10), qualityIssues: qualityIssues.slice(0, 10),
      rawTopLevelKeys, patchTopLevelKeys, patchType, acceptedPatchAreas,
      hasBaselinePlan: true, hasClarifyingAnswers, attemptedRepair,
      planSource: 'internal-fallback',
    })
    if (!attemptedRepair) continue
  }

  return hybridFallbackResponse(baselinePlan, businessInput, {
    errorCode: 'AI_PATCH_QUALITY_FAILED',
    validationIssues, qualityIssues, parseStage, rawTopLevelKeys, patchTopLevelKeys,
    patchType, hasClarifyingAnswers, attemptedRepair: true, acceptedPatchAreas,
    patchQualityScore, modelUsed, rawPreview, hasBaselineDigest: true,
  })
}

async function generateAndValidate(args: {
  mode: MarketingAiMode
  prompt: string
  businessInput: Record<string, unknown>
  validate: (data: unknown) => { ok: boolean; errors: string[] }
  normalize?: (data: unknown) => unknown
  validationStage?: string
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

  let groqResult: GroqCallResult

  try {
    groqResult = await callGroq(args.prompt, args.mode)
  } catch (error) {
    if (isGroqTimeoutError(error)) {
      const diagnosticPayload = {
        ok: false,
        mode: args.mode,
        errorCode: 'GROQ_TIMEOUT',
        errorMessage: 'AI service timed out. Please try again later.',
        ...buildLocalProviderDiagnostic(args.mode, 'Timeout'),
      }

      console.error('Groq provider diagnostic', diagnosticPayload)

      return {
        statusCode: 504,
        payload: diagnosticPayload,
      }
    }

    if (isGroqProviderError(error)) {
      const errorCode = error.errorCode || providerErrorCodeForStatus(error.diagnostic.providerStatus)
      const diagnosticPayload = {
        ok: false,
        mode: args.mode,
        errorCode,
        errorMessage: 'AI service did not return a usable response. Please try again later.',
        ...error.diagnostic,
      }

      console.error('Groq provider diagnostic', diagnosticPayload)

      return {
        statusCode: error.diagnostic.providerStatus === 429 ? 429 : 502,
        payload: diagnosticPayload,
      }
    }

    const diagnosticPayload = {
      ok: false,
      mode: args.mode,
      errorCode: 'GROQ_REQUEST_FAILED',
      errorMessage: 'AI service did not return a usable response. Please try again later.',
      ...buildLocalProviderDiagnostic(args.mode, 'Network or runtime error'),
    }

    console.error('Groq provider diagnostic', diagnosticPayload)

    return {
      statusCode: 502,
      payload: diagnosticPayload,
    }
  }

  let text: string
  try {
    text = extractGroqText(groqResult.responseJson)
  } catch {
    const diagnosticPayload = {
      ok: false,
      mode: args.mode,
      errorCode: 'GROQ_EMPTY_RESPONSE',
      errorMessage: 'Groq returned no usable message content.',
      parseStage: 'provider_response',
      ...groqResult.diagnostic,
    }
    console.error('Groq provider diagnostic', diagnosticPayload)
    return {
      statusCode: 502,
      payload: diagnosticPayload,
    }
  }

  const parsed = safeParseJson(text)
  if (!parsed.ok) {
    if (groqResult.attempt === 'raw_json_retry') {
      const diagnosticPayload = {
        ok: false,
        mode: args.mode,
        errorCode: 'GROQ_JSON_GENERATION_FAILED',
        errorMessage: 'Groq could not generate valid JSON after retrying.',
        ...groqResult.diagnostic,
        providerErrorCode: 'json_parse_failed',
        providerErrorMessage: 'Raw JSON retry did not contain a valid JSON object.',
      }
      console.error('Groq provider diagnostic', diagnosticPayload)
      return { statusCode: 502, payload: diagnosticPayload }
    }

    return {
      statusCode: 200,
      payload: {
        ok: false,
        mode: args.mode,
        errorCode: 'GROQ_JSON_PARSE_FAILED',
        errorMessage: 'AI response was not valid JSON.',
        validationErrors: parsed.errors,
        parseStage: 'json_parse',
        ...groqResult.diagnostic,
      },
    }
  }

  const normalized = args.normalize
    ? args.normalize(parsed.data)
    : normalizeQuestionsResponse(parsed.data)
  const validation = args.validate(normalized)
  if (!validation.ok) {
    const validationStage = args.validationStage || (args.mode === 'questions' ? 'questions' : 'plan')
    const validationIssues = validation.errors.slice(0, 10)
    const receivedTopLevelKeys = isRecord(normalized) ? Object.keys(normalized).slice(0, 20) : []
    const diagnosticPayload = {
      ok: false,
      mode: args.mode,
      errorCode: 'AI_VALIDATION_FAILED',
      errorMessage: 'AI response did not match the required planning contract after normalization.',
      validationStage,
      validationIssues,
      receivedTopLevelKeys,
      patchTopLevelKeys: args.validationStage === 'plan-patch' ? receivedTopLevelKeys : undefined,
      qualityIssues: [],
      planSource: args.validationStage === 'plan-patch' ? 'internal-fallback' : undefined,
      modelUsed: groqResult.diagnostic.modelUsed,
      provider: 'groq',
    }
    console.error('AI validation diagnostic', diagnosticPayload)
    return {
      statusCode: 200,
      payload: diagnosticPayload,
    }
  }

  return {
    statusCode: 200,
    payload: {
      ok: true,
      mode: args.mode,
      data: normalized,
      modelUsed: groqResult.diagnostic.modelUsed,
    },
  }
}

interface GroqCallResult {
  responseJson: unknown
  attempt: GroqAttempt
  diagnostic: GroqProviderDiagnostic
}

async function callGroq(prompt: string, mode: MarketingAiMode): Promise<GroqCallResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Missing Groq API key')
  }

  const model = normalizeGroqModel(process.env.GROQ_MODEL)
  const configuredTimeoutMs = Number(process.env.AI_PROVIDER_TIMEOUT_MS || defaultProviderTimeoutMs)
  const providerTimeoutMs = Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : defaultProviderTimeoutMs
  const jsonModeResponse = await sendGroqRequest({
    apiKey,
    model,
    mode,
    prompt,
    providerTimeoutMs,
    attempt: 'json_mode',
    useResponseFormat: true,
  })

  if (jsonModeResponse.ok) {
    return buildSuccessfulGroqResult(jsonModeResponse, model, mode, 'json_mode')
  }

  const jsonModeDiagnostic = await buildProviderDiagnostic(jsonModeResponse, model, mode, 'json_mode')
  if (jsonModeDiagnostic.providerStatus !== 400 || jsonModeDiagnostic.providerErrorCode !== 'json_validate_failed') {
    throw new GroqProviderError(jsonModeDiagnostic)
  }

  console.error('Groq provider diagnostic', {
    errorCode: 'GROQ_JSON_GENERATION_RETRY',
    ...jsonModeDiagnostic,
  })

  const rawJsonResponse = await sendGroqRequest({
    apiKey,
    model,
    mode,
    prompt,
    providerTimeoutMs,
    attempt: 'raw_json_retry',
    useResponseFormat: false,
  })

  if (!rawJsonResponse.ok) {
    const diagnostic = await buildProviderDiagnostic(rawJsonResponse, model, mode, 'raw_json_retry')
    throw new GroqProviderError(diagnostic, 'GROQ_JSON_GENERATION_FAILED')
  }

  return buildSuccessfulGroqResult(rawJsonResponse, model, mode, 'raw_json_retry')
}

async function sendGroqRequest(args: {
  apiKey: string
  model: string
  mode: MarketingAiMode
  prompt: string
  providerTimeoutMs: number
  attempt: GroqAttempt
  useResponseFormat: boolean
}): Promise<Response> {
  const responseWithReasoningEffort = await executeGroqFetch(args, true)
  if (responseWithReasoningEffort.ok) return responseWithReasoningEffort

  const diagnostic = await buildProviderDiagnostic(
    responseWithReasoningEffort.clone(),
    args.model,
    args.mode,
    args.attempt,
  )
  if (!isReasoningEffortRejected(diagnostic)) return responseWithReasoningEffort

  return executeGroqFetch(args, false)
}

async function executeGroqFetch(
  args: {
    apiKey: string
    model: string
    mode: MarketingAiMode
    prompt: string
    providerTimeoutMs: number
    attempt: GroqAttempt
    useResponseFormat: boolean
  },
  includeReasoningEffort: boolean,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), args.providerTimeoutMs)
  const strictSystemMessage = args.attempt === 'raw_json_retry'
    ? 'Return ONLY one valid JSON object. No markdown. No explanation. No code fences. The first character must be { and the last character must be }.'
    : 'You are MarketPilot AI, a Persian-first expert marketing planning assistant. Return valid JSON only. Do not use markdown.'

  const requestBody: Record<string, unknown> = {
    model: args.model,
    messages: [
      { role: 'system', content: strictSystemMessage },
      { role: 'user', content: args.prompt },
    ],
    temperature: args.mode === 'questions' ? 0.15 : 0.2,
    max_completion_tokens: args.mode === 'questions' ? 900 : 3000,
    reasoning_format: 'hidden',
  }
  if (includeReasoningEffort) requestBody.reasoning_effort = 'none'
  if (args.useResponseFormat) requestBody.response_format = { type: 'json_object' }

  try {
    return await fetch(groqEndpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('GROQ_TIMEOUT')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function buildSuccessfulGroqResult(
  response: Response,
  model: string,
  mode: MarketingAiMode,
  attempt: GroqAttempt,
): Promise<GroqCallResult> {
  return {
    responseJson: await response.json(),
    attempt,
    diagnostic: {
      provider: 'groq',
      providerStatus: response.status,
      providerStatusText: response.statusText,
      modelUsed: model,
      mode,
      attempt,
    },
  }
}

function extractGroqText(responseJson: unknown): string {
  if (!isRecord(responseJson)) {
    throw new Error('Groq response must be an object')
  }

  const choices = responseJson.choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('Groq response has no choices')
  }

  const firstChoice = choices[0]
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error('Groq choice has no message')
  }

  const text = typeof firstChoice.message.content === 'string'
    ? firstChoice.message.content.trim()
    : ''

  if (!text) {
    throw new Error('Groq response text is empty')
  }

  return text
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return strings.length > 0 ? strings : undefined
}

function normalizeGroqModel(model: string | undefined): string {
  const trimmed = (model || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim()
  return trimmed || defaultModel
}

function buildLocalProviderDiagnostic(
  mode: MarketingAiMode,
  providerStatusText: string,
): GroqProviderDiagnostic {
  return {
    provider: 'groq',
    providerStatus: 0,
    providerStatusText,
    modelUsed: normalizeGroqModel(process.env.GROQ_MODEL),
    mode,
    attempt: 'json_mode',
  }
}

async function buildProviderDiagnostic(
  response: Response,
  modelUsed: string,
  mode: MarketingAiMode,
  attempt: GroqAttempt,
): Promise<GroqProviderDiagnostic> {
  const providerError = parseProviderError(await readProviderErrorBody(response))

  return {
    provider: 'groq',
    providerStatus: response.status,
    providerStatusText: response.statusText,
    providerErrorCode: providerError.code,
    providerErrorMessage: truncateProviderErrorMessage(providerError.message),
    modelUsed,
    mode,
    attempt,
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

interface HybridFallbackDiagnostics {
  errorCode: string
  validationIssues: string[]
  qualityIssues: string[]
  parseStage: PatchParseStage
  rawTopLevelKeys: string[]
  patchTopLevelKeys: string[]
  patchType: string
  hasClarifyingAnswers: boolean
  attemptedRepair: boolean
  acceptedPatchAreas: string[]
  patchQualityScore: number
  modelUsed: string
  hasBaselineDigest: boolean
  providerStatus?: number
  providerStatusText?: string
  providerErrorCode?: string
  providerErrorMessage?: string
  rawPreview?: string
}

function hybridFallbackResponse(
  baselinePlan: BaselineMarketingPlan,
  businessInput: Record<string, unknown>,
  details: HybridFallbackDiagnostics,
) {
  const validationIssues = details.validationIssues.slice(0, 10)
  const qualityIssues = details.qualityIssues.slice(0, 10)
  if (validationIssues.length === 0 && qualityIssues.length === 0) {
    validationIssues.push('AI patch was rejected without a usable enhancement object.')
  }
  const diagnostic = {
    errorCode: details.errorCode, provider: 'groq', modelUsed: details.modelUsed, mode: 'plan',
    providerStatus: details.providerStatus,
    providerStatusText: details.providerStatusText,
    providerErrorCode: details.providerErrorCode,
    providerErrorMessage: details.providerErrorMessage,
    parseStage: details.parseStage,
    rawTopLevelKeys: details.rawTopLevelKeys.slice(0, 20),
    patchTopLevelKeys: details.patchTopLevelKeys.slice(0, 20),
    patchType: details.patchType,
    validationIssues,
    qualityIssues,
    acceptedPatchAreas: details.acceptedPatchAreas,
    patchQualityScore: details.patchQualityScore,
    hasBaselinePlan: true,
    hasBaselineDigest: details.hasBaselineDigest,
    hasClarifyingAnswers: details.hasClarifyingAnswers,
    attemptedRepair: details.attemptedRepair,
    rawPreview: details.rawPreview,
    planSource: 'internal-fallback',
  }
  console.error('AI patch quality diagnostic', diagnostic)
  return jsonResponse(200, {
    ok: true,
    mode: 'plan',
    errorCode: details.errorCode,
    data: baselineToFinalResponse(baselinePlan, businessInput),
    planSource: 'internal-fallback',
    provider: 'groq',
    modelUsed: details.modelUsed,
    parseStage: diagnostic.parseStage,
    rawTopLevelKeys: diagnostic.rawTopLevelKeys,
    patchTopLevelKeys: diagnostic.patchTopLevelKeys,
    patchType: diagnostic.patchType,
    validationIssues: diagnostic.validationIssues,
    qualityIssues: diagnostic.qualityIssues,
    acceptedPatchAreas: diagnostic.acceptedPatchAreas,
    patchQualityScore: diagnostic.patchQualityScore,
    hasBaselinePlan: true,
    hasBaselineDigest: details.hasBaselineDigest,
    hasClarifyingAnswers: diagnostic.hasClarifyingAnswers,
    attemptedRepair: diagnostic.attemptedRepair,
    rawPreview: diagnostic.rawPreview,
    providerStatus: diagnostic.providerStatus,
    providerStatusText: diagnostic.providerStatusText,
    providerErrorCode: diagnostic.providerErrorCode,
    providerErrorMessage: diagnostic.providerErrorMessage,
  })
}

function readSuccessfulData(value: unknown): { data: unknown; modelUsed?: string } | null {
  if (!isRecord(value) || value.ok !== true || !('data' in value)) return null
  return { data: value.data, modelUsed: typeof value.modelUsed === 'string' ? value.modelUsed : undefined }
}

function readDiagnosticIssues(value: unknown): string[] {
  if (!isRecord(value)) return ['Groq patch generation failed.']
  return ensureIssues([
    ...readStringArray(value.validationIssues),
    ...readStringArray(value.qualityIssues),
    ...readStringArray(value.validationErrors),
    typeof value.errorMessage === 'string' ? value.errorMessage : '',
    typeof value.errorCode === 'string' ? `Error code: ${value.errorCode}` : '',
  ].filter(Boolean).slice(0, 10), 'Groq patch generation failed without detailed issues.')
}

function readErrorCode(value: unknown): string | undefined {
  return isRecord(value) && typeof value.errorCode === 'string' ? value.errorCode : undefined
}

function readModelUsed(value: unknown): string | undefined {
  return isRecord(value) && typeof value.modelUsed === 'string' ? value.modelUsed : undefined
}

function readPayloadParseStage(value: unknown): PatchParseStage {
  if (isRecord(value) && value.parseStage === 'json_parse') return 'json_parse'
  const code = readErrorCode(value)
  return code === 'GROQ_JSON_PARSE_FAILED' || code === 'GROQ_JSON_GENERATION_FAILED'
    ? 'json_parse'
    : 'provider_response'
}

function normalizeProviderFailureCode(code: string | undefined): string {
  if (!code) return 'GROQ_REQUEST_FAILED'
  if (code === 'AI_JSON_PARSE_FAILED') return 'GROQ_JSON_PARSE_FAILED'
  return code
}

function readProviderDetails(value: unknown): Pick<HybridFallbackDiagnostics,
  'providerStatus' | 'providerStatusText' | 'providerErrorCode' | 'providerErrorMessage'> {
  if (!isRecord(value)) return {}
  return {
    providerStatus: typeof value.providerStatus === 'number' ? value.providerStatus : undefined,
    providerStatusText: typeof value.providerStatusText === 'string' ? value.providerStatusText : undefined,
    providerErrorCode: typeof value.providerErrorCode === 'string' ? value.providerErrorCode : undefined,
    providerErrorMessage: typeof value.providerErrorMessage === 'string'
      ? truncateProviderErrorMessage(value.providerErrorMessage)
      : undefined,
  }
}

function ensureIssues(issues: string[], fallback: string): string[] {
  const usable = [...new Set(issues.map((issue) => issue.trim()).filter(Boolean))]
  return usable.length ? usable.slice(0, 20) : [fallback]
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function isBaselineMarketingPlan(value: unknown): value is BaselineMarketingPlan {
  if (!isRecord(value)) return false
  const stringKeys = [
    'businessSummary', 'customerDevelopmentStage', 'targetMarket', 'positioningStatement',
    'valueProposition', 'usp', 'pricingRecommendation',
  ]
  const arrayKeys = [
    'marketSegments', 'customerPersonas', 'competitorAnalysis', 'funnelJourney',
    'channelStrategy', 'kpiDashboard', 'actionPlan', 'risksAssumptions',
  ]
  return stringKeys.every((key) => typeof value[key] === 'string')
    && arrayKeys.every((key) => Array.isArray(value[key]))
    && isRecord(value.marketingMix7p)
    && isRecord(value.qualityScore)
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
  if (status === 401 || status === 403) return 'GROQ_AUTH_FAILED'
  if (status === 429) return 'GROQ_RATE_LIMITED'
  return 'GROQ_REQUEST_FAILED'
}

function isReasoningEffortRejected(diagnostic: GroqProviderDiagnostic): boolean {
  const details = `${diagnostic.providerErrorCode || ''} ${diagnostic.providerErrorMessage || ''}`.toLowerCase()
  return diagnostic.providerStatus === 400 && /reasoning[_\s-]?effort/.test(details)
}

function isGroqTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === 'GROQ_TIMEOUT'
}

function isGroqProviderError(error: unknown): error is GroqProviderError {
  return error instanceof GroqProviderError
}
