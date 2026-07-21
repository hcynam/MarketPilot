import test from 'node:test'
import assert from 'node:assert/strict'
import { handler, resolveProviderTimeoutMs } from '../netlify/functions/marketing-ai'
import { buildBusinessBrief } from '../src/ai/buildBusinessBrief'
import { buildBaselineDigest } from '../src/ai/baselineDigest'
import { generateMarketingPlan } from '../src/engine/orchestrator'
import { buildClarifyingQuestionsPrompt } from '../netlify/functions/_shared/promptBuilders'
import { estimateTokens, preflightProviderRequest } from '../netlify/functions/_shared/requestPreflight'
import { safeParseJson } from '../netlify/functions/_shared/validateAIResponse'
import { makeBusiness } from './fixtures'

test('token estimate is conservative and mode-specific preflight reports every required budget field', () => {
  const brief = buildBusinessBrief(makeBusiness())
  const prompt = buildClarifyingQuestionsPrompt({ businessBrief: brief })
  const diagnostic = preflightProviderRequest({
    mode: 'clarification', provider: 'groq', selectedModel: 'qwen/qwen3-32b', prompt,
  })

  assert.ok(estimateTokens('متن فارسی برای تخمین') > 'متن فارسی برای تخمین'.length / 4)
  assert.equal(diagnostic.mode, 'clarification')
  assert.equal(diagnostic.provider, 'groq')
  assert.ok(diagnostic.systemPromptChars > 0)
  assert.ok(diagnostic.userPromptChars > 0)
  assert.ok(diagnostic.compactBusinessBriefChars > 0)
  assert.equal(diagnostic.baselineDigestChars, 0)
  assert.equal(diagnostic.clarificationAnswerChars, 0)
  assert.equal(diagnostic.requestedOutputTokens, 600)
  assert.equal(diagnostic.totalEstimatedTokens, diagnostic.estimatedInputTokens + 600)
  assert.equal(diagnostic.blockedLocally, false)
})

test('strategy preflight uses the bounded 2300-token output budget', () => {
  const input = makeBusiness()
  const brief = buildBusinessBrief(input)
  const baseline = generateMarketingPlan(input)
  const response = preflightProviderRequest({
    mode: 'strategy_patch',
    provider: 'groq',
    selectedModel: 'openai/gpt-oss-120b',
    prompt: {
      systemPrompt: 'Return one JSON object.',
      userPrompt: JSON.stringify({ brief, digest: buildBaselineDigest(baseline, brief) }),
      compactBusinessBriefChars: JSON.stringify(brief).length,
      baselineDigestChars: JSON.stringify(buildBaselineDigest(baseline, brief)).length,
      clarificationAnswerChars: 0,
    },
  })

  assert.equal(response.requestedOutputTokens, 2300)
  assert.equal(response.totalEstimatedTokens, response.estimatedInputTokens + 2300)
})

test('oversized payload is blocked locally without a provider call', async () => {
  await withGroqMock(async (calls) => {
    const huge = 'ا'.repeat(900)
    const response = await invoke({
      mode: 'plan',
      businessBrief: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`field${index}`, huge])),
      baselineDigest: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`digest${index}`, huge])),
    })
    assert.equal(response.statusCode, 413)
    assert.equal(body(response).errorCode, 'LOCAL_REQUEST_BUDGET_EXCEEDED')
    assert.equal(body(response).diagnostic.blockedLocally, true)
    assert.equal(calls.count, 0)
  })
})

test('optional context is removed and budget recalculated before a local rejection', async () => {
  await withGroqMock(async (calls) => {
    calls.reply = groqJson(readyClarification())
    const medium = 'اطلاعات راهبردی '.repeat(40)
    const response = await invoke({
      mode: 'questions',
      businessBrief: {
        coreOffer: medium,
        targetCustomer: medium,
        customerProblem: medium,
        differentiation: medium,
        competitors: medium,
      },
      contextNotes: Array.from({ length: 4 }, () => 'یادداشت اختیاری '.repeat(30)),
    })
    const result = body(response)
    assert.equal(response.statusCode, 200)
    assert.equal(result.ok, true)
    assert.equal(result.diagnostic.optionalContextRemoved, true)
    assert.equal(result.diagnostic.compressionApplied, true)
    assert.equal(result.diagnostic.blockedLocally, false)
    assert.equal(calls.count, 1)
  })
})

test('HTTP 401, 403, 413, and 429 are classified and never retried', async () => {
  for (const [status, code] of [
    [401, 'AI_AUTHENTICATION_FAILED'],
    [403, 'AI_AUTHENTICATION_FAILED'],
    [413, 'AI_REQUEST_TOO_LARGE'],
    [429, 'AI_RATE_LIMITED'],
  ] as const) {
    await withGroqMock(async (calls) => {
      calls.reply = new Response(JSON.stringify({ error: { code: 'provider_limit' } }), { status })
      const response = await validPlanRequest()
      assert.equal(body(response).errorCode, code)
      assert.equal(calls.count, 1)
    })
  }
})

test('strict GPT-OSS strategy success makes one provider call', async () => {
  await withGroqMock(async (calls) => {
    calls.reply = groqJson({
      positioning: {
        positioningStatement: 'جایگاه روشن برای تیم‌های کوچک با نیاز به تصمیم بازاریابی قابل سنجش.',
      },
    })
    const response = await validPlanRequest()
    const result = body(response)

    assert.equal(result.ok, true)
    assert.equal(calls.count, 1)
    assert.equal(calls.bodies[0].response_format.type, 'json_schema')
    assert.equal(result.diagnostic.providerRequestFormat, 'strict_json_schema')
    assert.equal(result.diagnostic.structuredFallbackAttempted, false)
  })
})

test('json_validate_failed gets one JSON Object fallback and applies a valid patch', async () => {
  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(400, 'json_validate_failed', 'invalid_request_error'),
      groqJson({
        positioning: {
          positioningStatement: 'راهکار تصمیم‌گیری بازاریابی برای تیم‌های کوچک با منابع محدود.',
          valueProposition: 'تبدیل داده کسب‌وکار به اولویت‌های روشن و قابل سنجش.',
        },
      }),
    ]
    const response = await validPlanRequest()
    const result = body(response)

    assert.equal(result.ok, true)
    assert.equal(calls.count, 2)
    assert.equal(calls.bodies[0].response_format.type, 'json_schema')
    assert.deepEqual(calls.bodies[1].response_format, { type: 'json_object' })
    assert.equal('json_schema' in calls.bodies[1].response_format, false)
    assert.equal(result.diagnostic.providerRequestFormat, 'json_object_fallback')
    assert.equal(result.diagnostic.structuredFallbackAttempted, true)
    assert.equal(result.diagnostic.structuredFallbackSucceeded, true)
    assert.equal(result.diagnostic.providerErrorCode, 'json_validate_failed')
  })
})

test('malformed JSON Object fallback returns a typed failure and leaves the internal plan intact', async () => {
  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(400, 'json_validate_failed', 'invalid_request_error'),
      groqText('{"positioning":'),
    ]
    const input = makeBusiness()
    const baseline = generateMarketingPlan(input)
    const baselineSnapshot = structuredClone(baseline)
    const response = await validPlanRequest(input)
    const result = body(response)

    assert.equal(result.errorCode, 'AI_MALFORMED_JSON')
    assert.equal(calls.count, 2)
    assert.equal(result.diagnostic.structuredFallbackAttempted, true)
    assert.equal(result.diagnostic.structuredFallbackSucceeded, false)
    assert.deepEqual(baseline, baselineSnapshot)
    assert.ok(baseline.businessSummary)
    assert.ok(baseline.kpiDashboard.length >= 3)
    assert.ok(baseline.actionPlan.length >= 4)
  })
})

test('JSON Object fallback preserves valid partial areas and rejects invalid areas', async () => {
  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(400, 'json_validate_failed', 'invalid_request_error'),
      groqJson({
        positioning: {
          positioningStatement: 'جایگاه تخصصی برای کسب‌وکارهای کوچک نیازمند برنامه اجرایی روشن.',
        },
        pricingDirection: 'invalid',
      }),
    ]
    const result = body(await validPlanRequest())

    assert.equal(result.ok, true)
    assert.equal(result.diagnostic.structuredFallbackSucceeded, true)
    assert.deepEqual(result.data.diagnostic.acceptedPatchAreas, ['positioning'])
    assert.ok(result.data.diagnostic.rejectedPatchAreas.some((item: { area: string }) => item.area === 'pricingDirection'))
  })
})

test('a different Groq 400 code is not retried or sent to structured fallback', async () => {
  await withGroqMock(async (calls) => {
    calls.reply = providerError(400, 'invalid_request_error', 'invalid_request_error')
    const result = body(await validPlanRequest())

    assert.equal(result.errorCode, 'invalid_request_error')
    assert.match(result.errorMessage, /برنامه کامل داخلی حفظ شد/)
    assert.equal(calls.count, 1)
    assert.equal(result.diagnostic.structuredFallbackAttempted, false)
  })
})

test('non-strict Groq models keep JSON Object Mode and never enter strict fallback', async () => {
  await withGroqMock(async (calls) => {
    process.env.GROQ_MODEL = 'qwen/qwen3-32b'
    calls.reply = providerError(400, 'json_validate_failed', 'invalid_request_error')
    const result = body(await validPlanRequest())

    assert.equal(result.errorCode, 'json_validate_failed')
    assert.equal(calls.count, 1)
    assert.deepEqual(calls.bodies[0].response_format, { type: 'json_object' })
    assert.equal(result.diagnostic.structuredFallbackAttempted, false)
  })
})

test('timeout gets only one controlled retry and then returns a typed failure', async () => {
  await withGroqMock(async (calls) => {
    calls.throwAbort = true
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'AI_TIMEOUT')
    assert.equal(calls.count, 2)
  })
})

test('network and provider 5xx failures make no more than one retry', async () => {
  await withGroqMock(async (calls) => {
    calls.errors = [new Error('network unavailable'), new Error('network unavailable')]
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'AI_NETWORK_FAILURE')
    assert.equal(calls.count, 2)
  })

  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(503, 'provider_overloaded', 'server_error'),
      providerError(503, 'provider_overloaded', 'server_error'),
    ]
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'AI_PROVIDER_5XX')
    assert.equal(calls.count, 2)
  })
})

test('retry and structured fallback branches can never combine into a third call', async () => {
  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(503, 'provider_overloaded', 'server_error'),
      providerError(400, 'json_validate_failed', 'invalid_request_error'),
    ]
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'json_validate_failed')
    assert.equal(calls.count, 2)
  })

  await withGroqMock(async (calls) => {
    calls.replies = [
      providerError(400, 'json_validate_failed', 'invalid_request_error'),
      providerError(503, 'provider_overloaded', 'server_error'),
    ]
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'AI_PROVIDER_5XX')
    assert.equal(calls.count, 2)
  })
})

test('questions mode remains one JSON Object request with the existing contract', async () => {
  await withGroqMock(async (calls) => {
    calls.reply = groqJson(readyClarification())
    const input = makeBusiness()
    const result = body(await invoke({ mode: 'questions', businessBrief: buildBusinessBrief(input) }))

    assert.equal(result.ok, true)
    assert.equal(result.data.mode, 'ready_for_plan')
    assert.equal(calls.count, 1)
    assert.deepEqual(calls.bodies[0].response_format, { type: 'json_object' })
  })
})

test('Gemini request body and response extraction remain unchanged', async () => {
  const originalFetch = globalThis.fetch
  const originalProvider = process.env.AI_PROVIDER
  const originalGroqKey = process.env.GROQ_API_KEY
  const originalGeminiKey = process.env.GEMINI_API_KEY
  const originalGeminiModel = process.env.GEMINI_MODEL
  let requestBody: Record<string, any> | undefined
  let requestUrl = ''
  process.env.AI_PROVIDER = 'gemini'
  delete process.env.GROQ_API_KEY
  process.env.GEMINI_API_KEY = 'test-only-gemini-key'
  process.env.GEMINI_MODEL = 'gemini-2.5-flash'
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestBody = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ positioning: {
        positioningStatement: 'جایگاه معتبر برای یک آزمون سازگاری ارائه‌دهنده جایگزین.',
      } }) }] } }],
    }), { status: 200 })
  }
  try {
    const result = body(await validPlanRequest())
    assert.equal(result.ok, true)
    assert.match(requestUrl, /generativelanguage\.googleapis\.com/)
    assert.equal(requestBody?.generationConfig.responseMimeType, 'application/json')
    assert.equal(requestBody?.generationConfig.maxOutputTokens, 2300)
    assert.equal('response_format' in (requestBody ?? {}), false)
  } finally {
    globalThis.fetch = originalFetch
    restoreEnv('AI_PROVIDER', originalProvider)
    restoreEnv('GROQ_API_KEY', originalGroqKey)
    restoreEnv('GEMINI_API_KEY', originalGeminiKey)
    restoreEnv('GEMINI_MODEL', originalGeminiModel)
  }
})

test('provider timeout uses new precedence and ignores invalid values safely', () => {
  assert.equal(resolveProviderTimeoutMs({
    AI_PROVIDER_TIMEOUT_MS: '18000',
    AI_TIMEOUT_MS: '22000',
    GEMINI_TIMEOUT_MS: '24000',
  }), 18000)
  assert.equal(resolveProviderTimeoutMs({
    AI_PROVIDER_TIMEOUT_MS: 'not-a-number',
    AI_TIMEOUT_MS: '22000',
    GEMINI_TIMEOUT_MS: '24000',
  }), 22000)
  assert.equal(resolveProviderTimeoutMs({
    AI_PROVIDER_TIMEOUT_MS: '-1',
    AI_TIMEOUT_MS: 'NaN',
    GEMINI_TIMEOUT_MS: '0',
  }), 25000)
})

test('safe provider diagnostics keep allowed metadata and omit secrets, prompts, business data, and failed_generation', async () => {
  const originalWarn = console.warn
  const logs: unknown[][] = []
  console.warn = (...args: unknown[]) => { logs.push(args) }
  try {
    await withGroqMock(async (calls) => {
      calls.replies = [
        new Response(JSON.stringify({
          error: {
            code: 'json_validate_failed',
            type: 'invalid_request_error',
            message: 'failed_generation included LeadFlow and api_key=super-secret',
            failed_generation: '{"businessBrief":"private customer data"}',
          },
        }), { status: 400, headers: { 'x-request-id': 'req-safe-123' } }),
        groqJson({ positioning: {
          positioningStatement: 'جایگاه معتبر برای آزمون ثبت امن خطای ارائه‌دهنده.',
        } }),
      ]
      const serialized = JSON.stringify(body(await validPlanRequest()))
      const serializedLogs = JSON.stringify(logs)

      assert.equal(calls.count, 2)
      assert.match(serialized, /json_validate_failed/)
      assert.match(serialized, /invalid_request_error/)
      assert.match(serialized, /req-safe-123/)
      for (const forbidden of ['super-secret', 'private customer data', 'failed_generation', 'LeadFlow', 'businessBrief']) {
        assert.equal(serialized.includes(forbidden), false)
        assert.equal(serializedLogs.includes(forbidden), false)
      }
    })
  } finally {
    console.warn = originalWarn
  }
})

test('harmless JSON wrappers are recovered locally', () => {
  const parsed = safeParseJson('```json\n{"diagnosis":"یک تحلیل معتبر و کاربردی"}\n```')
  assert.equal(parsed.ok, true)
  assert.deepEqual(parsed.data, { diagnosis: 'یک تحلیل معتبر و کاربردی' })
})

test('partial patch accepts valid areas, rejects invalid areas, and unrelated output falls back safely', async () => {
  await withGroqMock(async (calls) => {
    calls.reply = groqJson({
      positioning: {
        positioningStatement: 'برای مدیران فروش کوچک، مسیر قابل سنجش پیگیری سرنخ را فراهم می‌کند.',
        valueProposition: 'کاهش اتلاف سرنخ با یک فرایند روشن و قابل اندازه‌گیری.',
      },
      pricingDirection: 'not-an-object',
    })
    const response = await validPlanRequest()
    const result = body(response)
    assert.equal(result.ok, true)
    assert.deepEqual(result.data.diagnostic.acceptedPatchAreas, ['positioning'])
    assert.ok(result.data.diagnostic.rejectedPatchAreas.some((item: { area: string }) => item.area === 'pricingDirection'))
  })

  await withGroqMock(async (calls) => {
    calls.reply = groqJson({ greeting: 'سلام' })
    const response = await validPlanRequest()
    assert.equal(body(response).errorCode, 'AI_PATCH_REJECTED')
  })
})

test('raw form and complete baseline plan are rejected by the function boundary', async () => {
  await withGroqMock(async (calls) => {
    const response = await invoke({ mode: 'plan', businessBrief: {}, baselineDigest: {}, baselinePlan: { sections: [] } })
    assert.equal(body(response).errorCode, 'NON_COMPACT_PAYLOAD_REJECTED')
    assert.equal(calls.count, 0)
  })
})

async function validPlanRequest(input = makeBusiness()) {
  const brief = buildBusinessBrief(input)
  const baseline = generateMarketingPlan(input)
  return invoke({ mode: 'plan', businessBrief: brief, baselineDigest: buildBaselineDigest(baseline, brief) })
}

async function invoke(payload: Record<string, unknown>) {
  return handler({ httpMethod: 'POST', body: JSON.stringify(payload) })
}

function body(response: { body: string }) {
  return JSON.parse(response.body)
}

function readyClarification() {
  return {
    mode: 'ready_for_plan', inputQualityScore: 90, diagnosis: 'اطلاعات برای برنامه‌ریزی راهبردی کافی است.',
    missingInformation: [], requiredQuestions: [], optionalQuestions: [], assumptionsIfProceeding: [],
  }
}

function groqJson(content: unknown): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status: 200 })
}

function groqText(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
}

function providerError(status: number, code: string, type: string): Response {
  return new Response(JSON.stringify({
    error: { code, type, message: `Provider error: ${code}` },
  }), { status })
}

interface GroqMockCalls {
  count: number
  bodies: Array<Record<string, any>>
  reply?: Response
  replies?: Response[]
  errors?: Error[]
  throwAbort?: boolean
}

async function withGroqMock(run: (calls: GroqMockCalls) => Promise<void>) {
  const originalFetch = globalThis.fetch
  const originalProvider = process.env.AI_PROVIDER
  const originalKey = process.env.GROQ_API_KEY
  const originalModel = process.env.GROQ_MODEL
  const calls: GroqMockCalls = { count: 0, bodies: [] }
  process.env.AI_PROVIDER = 'groq'
  process.env.GROQ_API_KEY = 'test-only-key'
  process.env.GROQ_MODEL = 'openai/gpt-oss-120b'
  globalThis.fetch = async (_input, init) => {
    calls.count += 1
    calls.bodies.push(JSON.parse(String(init?.body)))
    if (calls.throwAbort) {
      const error = new Error('aborted')
      error.name = 'AbortError'
      throw error
    }
    const queuedError = calls.errors?.shift()
    if (queuedError) throw queuedError
    return calls.replies?.shift() ?? calls.reply ?? groqJson({ diagnosis: 'تحلیل پیش‌فرض معتبر برای آزمون معماری' })
  }
  try {
    await run(calls)
  } finally {
    globalThis.fetch = originalFetch
    restoreEnv('AI_PROVIDER', originalProvider)
    restoreEnv('GROQ_API_KEY', originalKey)
    restoreEnv('GROQ_MODEL', originalModel)
  }
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
