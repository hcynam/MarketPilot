import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseServerConfig } from './_shared/serverEnv'

interface FunctionEvent {
  httpMethod?: string
  body?: string | null
  headers?: Record<string, string | undefined>
}

type Action = 'preflight' | 'finalize' | 'update-email'
type AdminClientFactory = (url: string, key: string) => SupabaseClient

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}

export async function handler(event: FunctionEvent) {
  return handleAccountRegistration(event)
}

export async function handleAccountRegistration(
  event: FunctionEvent,
  createAdminClient: AdminClientFactory = createAdmin,
) {
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
  const admin = createAdminClient(supabaseUrl, serviceRoleKey)

  if (action === 'preflight') {
    const email = normalizeEmail(payload.email)
    const phone = normalizePhone(payload.phone)
    if (!isEmail(email) || !isPhone(phone)) return json(422, { ok: false, code: 'INVALID_CONTACT' })

    const [emailResult, phoneResult] = await Promise.all([
      admin.from('profiles').select('id, is_active').eq('email', email).maybeSingle(),
      admin.from('profiles').select('id, is_active').eq('phone', phone).maybeSingle(),
    ])
    if (emailResult.error || phoneResult.error) {
      if (emailResult.error) logSupabaseError('preflight_email_lookup', emailResult.error)
      if (phoneResult.error) logSupabaseError('preflight_phone_lookup', phoneResult.error)
      return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    }
    const emailProfile = emailResult.data
    const phoneProfile = phoneResult.data
    const sameIncompleteProfile = phoneProfile
      && phoneProfile.is_active === false
      && (!emailProfile || emailProfile.id === phoneProfile.id)
    if (sameIncompleteProfile) {
      return json(200, { ok: true, status: 'resume' })
    }
    if (emailProfile || phoneProfile) {
      return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })
    }
    return json(200, { ok: true, status: 'available' })
  }

  const token = readBearer(event.headers)
  if (!token) return json(401, { ok: false, code: 'NOT_AUTHENTICATED' })
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData.user
  if (userError || !user) return json(401, { ok: false, code: 'NOT_AUTHENTICATED' })

  if (action === 'finalize') {
    if (!user.phone || !user.phone_confirmed_at) return json(403, { ok: false, code: 'PHONE_NOT_VERIFIED' })
    const metadata = user.user_metadata as Record<string, unknown>
    const requestedEmail = normalizeEmail(payload.email)
    const email = requestedEmail || normalizeEmail(metadata.email)
    const phone = normalizeAuthPhone(user.phone)
    if (!isEmail(email)) return json(422, { ok: false, code: 'INVALID_EMAIL' })
    if (!isPhone(phone)) return json(422, { ok: false, code: 'INVALID_CONTACT' })

    const { data: duplicate, error: duplicateError } = await admin.from('profiles').select('id').eq('email', email).neq('id', user.id).maybeSingle()
    if (duplicateError) {
      logSupabaseError('finalize_duplicate_email_lookup', duplicateError)
      return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    }
    if (duplicate) return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })

    const now = new Date().toISOString()
    const { data: finalizedProfile, error: finalizeError } = await admin.from('profiles').update({
      email,
      phone,
      phone_verified_at: user.phone_confirmed_at,
      is_active: true,
      last_login_at: now,
      last_active_at: now,
      login_count: 1,
    }).eq('id', user.id).select('id').maybeSingle()
    if (finalizeError || !finalizedProfile) {
      logSupabaseError('finalize_profile_update', finalizeError ?? {
        code: 'PROFILE_NOT_FOUND',
        message: 'The auth user has no matching profile row.',
        details: 'No profile was updated for the authenticated user id.',
      })
      return json(409, { ok: false, code: 'ACCOUNT_FINALIZATION_FAILED' })
    }

    // Auth email synchronization is deliberately after the transactional profile
    // completion. A provider-side email failure must not reactivate the old trap.
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email,
      email_confirm: true,
      user_metadata: { ...metadata, email },
    })
    if (authError) logSupabaseError('finalize_auth_email_sync', authError)
    const { error: eventError } = await admin.from('product_events').insert({
      user_id: user.id,
      event_name: 'signup_completed',
      metadata: {},
    })
    if (eventError) logSupabaseError('finalize_signup_event', eventError)
    return json(200, { ok: true })
  }

  if (action === 'update-email') {
    const email = normalizeEmail(payload.email)
    if (!isEmail(email)) return json(422, { ok: false, code: 'INVALID_EMAIL' })
    const { data: duplicate, error: duplicateError } = await admin.from('profiles').select('id').eq('email', email).neq('id', user.id).maybeSingle()
    if (duplicateError) {
      logSupabaseError('update_email_duplicate_lookup', duplicateError)
      return json(503, { ok: false, code: 'ACCOUNT_SERVICE_UNAVAILABLE' })
    }
    if (duplicate) return json(409, { ok: false, code: 'CONTACT_ALREADY_REGISTERED' })

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true })
    if (authError) {
      logSupabaseError('update_auth_email', authError)
      return json(409, { ok: false, code: 'EMAIL_UPDATE_FAILED' })
    }
    const { error: profileError } = await admin.from('profiles').update({ email }).eq('id', user.id)
    if (profileError) {
      logSupabaseError('update_profile_email', profileError)
      return json(409, { ok: false, code: 'EMAIL_UPDATE_FAILED' })
    }
    return json(200, { ok: true })
  }

  return json(400, { ok: false, code: 'INVALID_ACTION' })
}

function createAdmin(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/[\s()-]/g, '') : ''
}

function normalizeAuthPhone(value: unknown): string {
  const phone = normalizePhone(value)
  return /^\d{8,15}$/.test(phone) ? `+${phone}` : phone
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

interface SupabaseErrorLike {
  code?: string
  message?: string
  details?: string
}

function logSupabaseError(operation: string, error: SupabaseErrorLike): void {
  console.error('MarketPilot account operation failed', {
    operation,
    code: safeLogText(error.code),
    message: safeLogText(error.message),
    details: safeLogText(error.details),
  })
}

function safeLogText(value: unknown): string | null {
  return typeof value === 'string' ? value.slice(0, 1000) : null
}
