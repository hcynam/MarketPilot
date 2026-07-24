import assert from 'node:assert/strict'
import test from 'node:test'
import { Webhook } from 'standardwebhooks'
import { handler } from '../netlify/functions/send-sms'

test('SMS hook includes a configured sender in the Kavenegar ordinary SMS request', async () => {
  const previousFetch = globalThis.fetch
  const previousEnv = {
    apiKey: process.env.KAVENEGAR_API_KEY,
    hookSecret: process.env.SUPABASE_SMS_HOOK_SECRET,
    sender: process.env.KAVENEGAR_SENDER,
  }
  const secret = `whsec_${Buffer.from('marketpilot-test-hook-secret').toString('base64')}`
  process.env.KAVENEGAR_API_KEY = 'test-api-key'
  process.env.SUPABASE_SMS_HOOK_SECRET = secret
  process.env.KAVENEGAR_SENDER = '10004346'

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
    assert.equal(url.pathname, '/v1/test-api-key/sms/send.json')
    assert.equal(url.searchParams.get('receptor'), '09121234567')
    assert.equal(url.searchParams.get('sender'), '10004346')
    assert.equal(url.searchParams.get('message'), 'کد ورود شما: 123456')
    assert.equal(url.searchParams.has('token'), false)
    assert.equal(url.searchParams.has('template'), false)
  } finally {
    globalThis.fetch = previousFetch
    restoreEnv('KAVENEGAR_API_KEY', previousEnv.apiKey)
    restoreEnv('SUPABASE_SMS_HOOK_SECRET', previousEnv.hookSecret)
    restoreEnv('KAVENEGAR_SENDER', previousEnv.sender)
  }
})

test('SMS hook omits an empty or absent sender and lets Kavenegar use the account default', async () => {
  const previousFetch = globalThis.fetch
  const previousEnv = {
    apiKey: process.env.KAVENEGAR_API_KEY,
    hookSecret: process.env.SUPABASE_SMS_HOOK_SECRET,
    sender: process.env.KAVENEGAR_SENDER,
  }
  const secret = `whsec_${Buffer.from('marketpilot-default-sender-test').toString('base64')}`
  process.env.KAVENEGAR_API_KEY = 'test-api-key'
  process.env.SUPABASE_SMS_HOOK_SECRET = secret

  const requestedUrls: string[] = []
  globalThis.fetch = async (input) => {
    requestedUrls.push(String(input))
    return new Response(JSON.stringify({
      return: { status: 200, message: 'accepted' },
      entries: [{}],
    }), { status: 200 })
  }

  try {
    const body = JSON.stringify({
      user: { phone: '+989121234567' },
      sms: { otp: '654321', message: 'Your code is 654321' },
    })
    const webhookId = 'msg_default_sender'
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = new Webhook(secret).sign(webhookId, new Date(timestamp * 1000), body)
    const event = {
      httpMethod: 'POST',
      body,
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': String(timestamp),
        'webhook-signature': signature,
      },
    }

    for (const sender of [undefined, '   ']) {
      if (sender === undefined) delete process.env.KAVENEGAR_SENDER
      else process.env.KAVENEGAR_SENDER = sender
      const response = await handler(event)
      assert.equal(response.statusCode, 200)
    }

    assert.equal(requestedUrls.length, 2)
    for (const requestedUrl of requestedUrls) {
      const url = new URL(requestedUrl)
      assert.equal(url.pathname, '/v1/test-api-key/sms/send.json')
      assert.equal(url.searchParams.get('receptor'), '09121234567')
      assert.equal(url.searchParams.get('message'), 'Your code is 654321')
      assert.equal(url.searchParams.has('sender'), false)
    }
  } finally {
    globalThis.fetch = previousFetch
    restoreEnv('KAVENEGAR_API_KEY', previousEnv.apiKey)
    restoreEnv('SUPABASE_SMS_HOOK_SECRET', previousEnv.hookSecret)
    restoreEnv('KAVENEGAR_SENDER', previousEnv.sender)
  }
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
