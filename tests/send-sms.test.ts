import assert from 'node:assert/strict'
import test from 'node:test'
import { Webhook } from 'standardwebhooks'
import { handler } from '../netlify/functions/send-sms'

test('SMS hook sends the exact Supabase OTP through Kavenegar Verify/Lookup', async () => {
  const previousFetch = globalThis.fetch
  const previousEnv = {
    apiKey: process.env.KAVENEGAR_API_KEY,
    hookSecret: process.env.SUPABASE_SMS_HOOK_SECRET,
    template: process.env.KAVENEGAR_VERIFY_TEMPLATE,
  }
  const secret = `whsec_${Buffer.from('marketpilot-test-hook-secret').toString('base64')}`
  process.env.KAVENEGAR_API_KEY = 'test-api-key'
  process.env.SUPABASE_SMS_HOOK_SECRET = secret
  process.env.KAVENEGAR_VERIFY_TEMPLATE = 'marketpilototp'

  let requestedUrl = ''
  globalThis.fetch = async (input) => {
    requestedUrl = String(input)
    return new Response(JSON.stringify({
      return: { status: 200, message: 'تایید شد' },
      entries: [{}],
    }), { status: 200 })
  }

  try {
    const body = JSON.stringify({
      user: { phone: '989121234567' },
      sms: { otp: '123456', message: 'کد ورود شما: 123456' },
    })
    const webhookId = 'msg_test'
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = new Webhook(secret).sign(webhookId, new Date(timestamp * 1000), body)

    const response = await handler({
      httpMethod: 'POST',
      body,
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': String(timestamp),
        'webhook-signature': signature,
      },
    })

    assert.equal(response.statusCode, 200)
    const url = new URL(requestedUrl)
    assert.equal(url.pathname, '/v1/test-api-key/verify/lookup.json')
    assert.equal(url.searchParams.get('receptor'), '09121234567')
    assert.equal(url.searchParams.get('token'), '123456')
    assert.equal(url.searchParams.get('template'), 'marketpilototp')
    assert.equal(url.searchParams.has('sender'), false)
    assert.equal(url.searchParams.has('message'), false)
  } finally {
    globalThis.fetch = previousFetch
    restoreEnv('KAVENEGAR_API_KEY', previousEnv.apiKey)
    restoreEnv('SUPABASE_SMS_HOOK_SECRET', previousEnv.hookSecret)
    restoreEnv('KAVENEGAR_VERIFY_TEMPLATE', previousEnv.template)
  }
})

test('SMS hook requires the Verify/Lookup template without calling Kavenegar', async () => {
  const previousFetch = globalThis.fetch
  const previousEnv = {
    apiKey: process.env.KAVENEGAR_API_KEY,
    hookSecret: process.env.SUPABASE_SMS_HOOK_SECRET,
    template: process.env.KAVENEGAR_VERIFY_TEMPLATE,
  }
  process.env.KAVENEGAR_API_KEY = 'test-api-key'
  process.env.SUPABASE_SMS_HOOK_SECRET = 'test-hook-secret'
  delete process.env.KAVENEGAR_VERIFY_TEMPLATE
  let providerCalled = false
  globalThis.fetch = async () => {
    providerCalled = true
    return new Response('{}', { status: 200 })
  }

  try {
    const response = await handler({ httpMethod: 'POST', body: '{}' })
    assert.equal(response.statusCode, 503)
    assert.equal(providerCalled, false)
    assert.match(response.body, /SMS_SERVICE_NOT_CONFIGURED/)
  } finally {
    globalThis.fetch = previousFetch
    restoreEnv('KAVENEGAR_API_KEY', previousEnv.apiKey)
    restoreEnv('SUPABASE_SMS_HOOK_SECRET', previousEnv.hookSecret)
    restoreEnv('KAVENEGAR_VERIFY_TEMPLATE', previousEnv.template)
  }
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
