import { createClient } from '@supabase/supabase-js'
import { readSupabaseServerConfig, readSupabaseServerConfigStatus } from './_shared/serverEnv'

interface FunctionEvent {
  httpMethod?: string
  body?: string | null
  headers?: Record<string, string | undefined>
}

type Action = 'preflight' | 'finalize' | 'update-email'

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}

export async function handler(event: FunctionEvent) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, code: 'METHOD_NOT_ALLOWED' })
  if (!event.body || event.body.length > 6000) return json(400, { ok: false, code: 'INVALID_REQUEST' })

  const serverConfig = readSupabaseServerConfig()
  if (!serverConfig) return json(503, { ok: false, code: 'ACCOUNT_SERVICE_NOT_CONFIGURED' })
  const { supabaseUrl, serviceRoleKey } = serverConfig

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(event.body) as Record<string, unknown>
  } catch {
    return json(400, { ok: false, code: 'INVALID_REQUEST' })
  }

  const action = payload.action as Action
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  if (action === 'preflight') {
    const email = normalizeEmail(payload.email)
    const phone = normalizePhone(payload.phone)
    if (!isEmail(email) || !isPhone(phone)) return json(422, { ok: false, code: 'INVALID_CONTACT' })

    const [emailResult, phoneResult] = await Promise.all([
      admin.from('profiles').select('id').eq('email', email).maybeSingle(),
      admin.from('profiles').select('id').eq('phone', phone).maybeSingle(),
    ])
    if (emailResult.error || phoneResult.error) {
      return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    }
    if (emailResult.data || phoneResult.data) {
      return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })
    }
    return json(200, { ok: true })
  }

  const token = readBearer(event.headers)
  if (!token) return json(401, { ok: false, code: 'NOT_AUTHENTICATED' })
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData.user
  if (userError || !user) return json(401, { ok: false, code: 'NOT_AUTHENTICATED' })

  if (action === 'finalize') {
    if (!user.phone || !user.phone_confirmed_at) return json(403, { ok: false, code: 'PHONE_NOT_VERIFIED' })
    const metadata = user.user_metadata as Record<string, unknown>
    const email = normalizeEmail(metadata.email)
    if (!isEmail(email)) return json(422, { ok: false, code: 'INVALID_EMAIL' })

    const { data: duplicate, error: duplicateError } = await admin.from('profiles').select('id').eq('email', email).neq('id', user.id).maybeSingle()
    if (duplicateError) return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    if (duplicate) return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email,
      email_confirm: true,
      user_metadata: { ...metadata, email },
    })
    if (authError) return json(409, { ok: false, code: 'ACCOUNT_FINALIZATION_FAILED' })

    const now = new Date().toISOString()
    const { error: profileError } = await admin.from('profiles').update({
      email,
      phone: user.phone,
      phone_verified_at: user.phone_confirmed_at,
      is_active: true,
      last_login_at: now,
      last_active_at: now,
      login_count: 1,
    }).eq('id', user.id)
    if (profileError) return json(409, { ok: false, code: 'ACCOUNT_FINALIZATION_FAILED' })

    await admin.from('product_events').insert({ user_id: user.id, event_name: 'signup_completed', metadata: {} })
    return json(200, { ok: true })
  }

  if (action === 'update-email') {
    const email = normalizeEmail(payload.email)
    if (!isEmail(email)) return json(422, { ok: false, code: 'INVALID_EMAIL' })
    const { data: duplicate, error: duplicateError } = await admin.from('profiles').select('id').eq('email', email).neq('id', user.id).maybeSingle()
    if (duplicateError) return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    if (duplicate) return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true })
    if (authError) return json(409, { ok: false, code: 'EMAIL_UPDATE_FAILED' })
    const { error: profileError } = await admin.from('profiles').update({ email }).eq('id', user.id)
    if (profileError) return json(409, { ok: false, code: 'EMAIL_UPDATE_FAILED' })
    return json(200, { ok: true })
  }

  return json(400, { ok: false, code: 'INVALID_ACTION' })
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/[\s()-]/g, '') : ''
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value)
}

function isPhone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

function readBearer(headers: Record<string, string | undefined> | undefined): string | null {
  const value = headers?.authorization ?? headers?.Authorization
  const match = value?.match(/^Bearer\s+([^\s]+)$/i)
  const token = match?.[1] ?? ''
  return token.length > 0 && token.length <= 4096 ? token : null
}

function json(statusCode: number, payload: Record<string, unknown>) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(payload) }
}
