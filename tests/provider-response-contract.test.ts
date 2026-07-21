import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGroqRequestBody, handler } from '../netlify/functions/marketing-ai'
import { buildStrategyPatchPrompt } from '../netlify/functions/_shared/promptBuilders'
import { strategyPatchJsonSchema } from '../netlify/functions/_shared/strategyPatchJsonSchema'
import { validateStrategyPatch } from '../netlify/functions/_shared/validateAIResponse'
import { buildBaselineDigest } from '../src/ai/baselineDigest'
import { buildBusinessBrief } from '../src/ai/buildBusinessBrief'
import { generateMarketingPlan } from '../src/engine/orchestrator'
import { makeBusiness } from './fixtures'

const positioning = {
  positioningStatement: 'راهکار برنامه‌ریزی قابل سنجش برای تیم‌های کوچک بازاریابی.',
  valueProposition: 'تبدیل داده‌های پراکنده کسب‌وکار به تصمیم‌های روشن و قابل اجرا.',
}

for (const wrapper of ['patch', 'strategyPatch', 'data', 'result'] as const) {
  test(`${wrapper} wrapper is unwrapped exactly once`, () => {
    const validation = validateStrategyPatch({ [wrapper]: { positioning } })
    assert.equal(validation.usablePatch, true)
    assert.equal(validation.normalization.unwrappedFrom, wrapper)
    assert.deepEqual(validation.normalization.rawTopLevelKeys, [wrapper])
    assert.deepEqual(validation.acceptedPatchAreas, ['positioning'])
  })
}

test('root-level patch is accepted without wrapper inference', () => {
  const validation = validateStrategyPatch({ positioning })
  assert.equal(validation.usablePatch, true)
  assert.equal(validation.normalization.unwrappedFrom, 'root')
  assert.deepEqual(validation.normalization.recognizedPatchAreas, ['positioning'])
})

test('explicit snake_case aliases normalize at top and nested levels', () => {
  const validation = validateStrategyPatch({
    target_market: {
      primary_segment: 'مدیران بازاریابی شرکت‌های کوچک',
      selection_reason: 'نیاز فوری به ساختار تصمیم‌گیری و گزارش قابل سنجش',
    },
    positioning: {
      positioning_statement: 'دستیار تصمیم‌گیری بازاریابی برای تیم‌های کم‌منبع',
      value_proposition: 'برنامه منسجم و قابل اجرا بدون فرایند مشاوره طولانی',
      proof_needed: ['نمونه خروجی واقعی'],
    },
    kpis: [{ name: 'نرخ تبدیل', initial_target: 'هدف آزمایشی ۵ درصد', review_frequency: 'هفتگی' }],
  })
  assert.equal(validation.usablePatch, true)
  assert.deepEqual(validation.acceptedPatchAreas, ['targetMarket', 'positioning', 'kpis'])
  assert.equal(validation.patch.targetMarket?.primarySegment, 'مدیران بازاریابی شرکت‌های کوچک')
  assert.equal(validation.patch.positioning?.valueProposition, 'برنامه منسجم و قابل اجرا بدون فرایند مشاوره طولانی')
  assert.equal(validation.patch.kpis?.[0].initialTarget, 'هدف آزمایشی ۵ درصد')
})

test('short diagnosis is rejected alone while valid positioning and KPIs survive', () => {
  const validation = validateStrategyPatch({
    diagnosis: 'خوب',
    positioning,
    kpis: [{ name: 'CPL', formula: 'هزینه تبلیغ تقسیم بر تعداد سرنخ' }],
  })
  assert.equal(validation.usablePatch, true)
  assert.deepEqual(validation.acceptedPatchAreas, ['positioning', 'kpis'])
  assert.ok(validation.rejectedPatchAreas.some((item) => item.area === 'diagnosis'))
})

test('one invalid persona does not reject a valid persona', () => {
  const validation = validateStrategyPatch({
    personas: [
      { label: 'مدیر رشد', profile: 'عضو یک تیم کوچک با بودجه محدود', pain: 'نبود اولویت روشن' },
      { label: 'نامعتبر' },
    ],
  })
  assert.equal(validation.usablePatch, true)
  assert.equal(validation.patch.personas?.length, 1)
  assert.ok(validation.rejectedPatchAreas.some((item) => item.area === 'personas[1]'))
})

test('unknown fields are ignored and reported without hiding one valid area', () => {
  const validation = validateStrategyPatch({ positioning, invented_market_size: '100 billion' })
  assert.equal(validation.usablePatch, true)
  assert.deepEqual(validation.normalization.unknownTopLevelKeys, ['invented_market_size'])
  assert.ok(validation.rejectedPatchAreas.some((item) => item.area === 'unknown:invented_market_size'))
})

test('zero valid areas is rejected and one valid area is usable', () => {
  assert.equal(validateStrategyPatch({ diagnosis: 'ok', pricingDirection: null }).usablePatch, false)
  assert.equal(validateStrategyPatch({ positioning: { usp: 'برنامه بازاریابی فشرده و قابل اجرا برای تیم کوچک' } }).usablePatch, true)
})

test('GPT-OSS strategy request uses strict JSON Schema and low reasoning effort', () => {
  const prompt = samplePrompt()
  const body = buildGroqRequestBody('openai/gpt-oss-120b', 'strategy_patch', prompt)
  assert.equal(body.reasoning_effort, 'low')
  assert.equal(body.max_completion_tokens, 2300)
  assert.match(prompt.userPrompt, /at most 2 personas, 3 channel priorities, 4 KPIs/)
  assert.deepEqual(body.response_format, {
    type: 'json_schema',
    json_schema: {
      name: 'marketpilot_strategy_patch',
      strict: true,
      schema: strategyPatchJsonSchema,
    },
  })
  assertStrictObjects(strategyPatchJsonSchema)
})

test('Qwen and other non-strict models use JSON Object Mode', () => {
  const qwen = buildGroqRequestBody('qwen/qwen3-32b', 'strategy_patch', samplePrompt())
  assert.deepEqual(qwen.response_format, { type: 'json_object' })
  assert.equal(qwen.reasoning_effort, 'none')
  assert.equal(qwen.reasoning_format, 'hidden')

  const other = buildGroqRequestBody('llama-3.3-70b-versatile', 'strategy_patch', samplePrompt())
  assert.deepEqual(other.response_format, { type: 'json_object' })
  assert.equal('reasoning_effort' in other, false)
})

test('reasoning is counted but never parsed as final strategy content', async () => {
  await withMockGroq({ content: '{}', reasoning: JSON.stringify({ positioning }) }, async () => {
    const response = await invokeValidPlan()
    const result = JSON.parse(response.body)
    assert.equal(result.errorCode, 'AI_PATCH_REJECTED')
    assert.equal(result.providerDiagnostic.providerContentChars, 2)
    assert.ok(result.providerDiagnostic.providerReasoningChars > 2)
    assert.deepEqual(result.providerDiagnostic.acceptedPatchAreas, [])
  })
})

test('provider diagnostic reports wrapper, keys, accepted areas, and finish reason safely', async () => {
  await withMockGroq({ content: JSON.stringify({ strategyPatch: { diagnosis: 'کوتاه', positioning } }), reasoning: 'hidden reasoning' }, async () => {
    const response = await invokeValidPlan()
    const result = JSON.parse(response.body)
    assert.equal(result.ok, true)
    assert.equal(result.providerDiagnostic.providerFinishReason, 'stop')
    assert.deepEqual(result.providerDiagnostic.rawTopLevelKeys, ['strategyPatch'])
    assert.equal(result.providerDiagnostic.unwrappedFrom, 'strategyPatch')
    assert.deepEqual(result.providerDiagnostic.recognizedPatchAreas, ['diagnosis', 'positioning'])
    assert.deepEqual(result.providerDiagnostic.acceptedPatchAreas, ['positioning'])
    assert.ok(result.providerDiagnostic.rejectedPatchAreas.some((item: { area: string }) => item.area === 'diagnosis'))
  })
})

function samplePrompt() {
  const input = makeBusiness()
  const brief = buildBusinessBrief(input)
  return buildStrategyPatchPrompt({
    businessBrief: brief,
    baselineDigest: buildBaselineDigest(generateMarketingPlan(input), brief),
  })
}

async function invokeValidPlan() {
  const input = makeBusiness()
  const brief = buildBusinessBrief(input)
  return handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      mode: 'plan',
      businessBrief: brief,
      baselineDigest: buildBaselineDigest(generateMarketingPlan(input), brief),
    }),
  })
}

async function withMockGroq(
  message: { content: string; reasoning?: string },
  run: () => Promise<void>,
) {
  const originalFetch = globalThis.fetch
  const originalProvider = process.env.AI_PROVIDER
  const originalKey = process.env.GROQ_API_KEY
  const originalModel = process.env.GROQ_MODEL
  process.env.AI_PROVIDER = 'groq'
  process.env.GROQ_API_KEY = 'test-only-key'
  process.env.GROQ_MODEL = 'openai/gpt-oss-120b'
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ finish_reason: 'stop', message }],
  }), { status: 200 })
  try {
    await run()
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

function assertStrictObjects(schema: unknown): void {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return
  const value = schema as Record<string, unknown>
  if (value.type === 'object') {
    assert.equal(value.additionalProperties, false)
    const properties = value.properties as Record<string, unknown>
    assert.deepEqual([...(value.required as string[])].sort(), Object.keys(properties).sort())
  }
  Object.values(value).forEach(assertStrictObjects)
}
