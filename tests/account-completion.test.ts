import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleAccountRegistration } from '../netlify/functions/account-registration'
import { ensureCompletedAccount } from '../src/auth/accountCompletion'
import type { UserProfile } from '../src/auth/types'

const previousServerEnv = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
}
process.env.SUPABASE_URL = 'https://marketpilot-test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

test.after(() => {
  restoreEnv('SUPABASE_URL', previousServerEnv.url)
  restoreEnv('SUPABASE_SERVICE_ROLE_KEY', previousServerEnv.key)
})

test('normal signup preflight and OTP completion use one atomic normalized profile update', async () => {
  const calls: string[] = []
  const admin = createAdmin({
    calls,
    profiles: [],
    user: verifiedUser(),
  })

  const preflight = await handleAccountRegistration(event({
    action: 'preflight',
    email: 'owner@example.com',
    phone: '+989121234567',
  }), () => admin)
  assert.equal(preflight.statusCode, 200)
  assert.equal(jsonBody(preflight).status, 'available')

  const finalize = await handleAccountRegistration(event({
    action: 'finalize',
    email: 'owner@example.com',
  }, 'verified-access-token'), () => admin)
  assert.equal(finalize.statusCode, 200)
  assert.deepEqual(calls, [
    'profile:activate:user-1:+989121234567:owner@example.com',
    'auth:update-email:user-1:owner@example.com',
    'event:signup_completed:user-1',
  ])

  const source = readFileSync('netlify/functions/account-registration.ts', 'utf8')
  const triggerMigration = readFileSync('supabase/migrations/202607230001_fix_profile_phone_normalization.sql', 'utf8')
  assert.match(source, /normalizeAuthPhone\(user\.phone\)/)
  assert.match(source, /from\('profiles'\)\.update\(\{[\s\S]*phone,[\s\S]*is_active: true/i)
  assert.match(triggerMigration, /when new\.phone ~ '\^\[1-9\].*then '\+' \|\| new\.phone/i)
})

test('completion failure reports the exact Supabase operation and error without advancing auth email', async () => {
  const calls: string[] = []
  const captured: unknown[] = []
  const previousConsoleError = console.error
  console.error = (...args: unknown[]) => captured.push(args)
  const admin = createAdmin({
    calls,
    profiles: [],
    user: verifiedUser(),
    profileUpdateError: {
      code: '23514',
      message: 'new row for relation "profiles" violates check constraint "profiles_phone_check"',
      details: 'Failing row contains a phone without the E.164 plus prefix.',
    },
  })

  try {
    const response = await handleAccountRegistration(event({
      action: 'finalize',
      email: 'owner@example.com',
    }, 'verified-access-token'), () => admin)
    assert.equal(response.statusCode, 409)
    assert.equal(jsonBody(response).code, 'ACCOUNT_FINALIZATION_FAILED')
    assert.deepEqual(calls, ['profile:activate:user-1:+989121234567:owner@example.com'])
    assert.equal(captured.length, 1)
    assert.deepEqual(captured[0], [
      'MarketPilot account operation failed',
      {
        operation: 'finalize_profile_update',
        code: '23514',
        message: 'new row for relation "profiles" violates check constraint "profiles_phone_check"',
        details: 'Failing row contains a phone without the E.164 plus prefix.',
      },
    ])
  } finally {
    console.error = previousConsoleError
  }
})

test('retrying an incomplete signup returns resume instead of duplicate contact', async () => {
  const admin = createAdmin({
    profiles: [{
      id: 'user-1',
      email: 'owner@example.com',
      phone: '+989121234567',
      is_active: false,
    }],
    user: verifiedUser(),
  })
  const response = await handleAccountRegistration(event({
    action: 'preflight',
    email: 'owner@example.com',
    phone: '+989121234567',
  }), () => admin)
  assert.equal(response.statusCode, 200)
  assert.equal(jsonBody(response).status, 'resume')
})

test('login repairs a verified incomplete account and then accepts the completed profile', async () => {
  const previousFetch = globalThis.fetch
  const requests: Array<{ authorization: string | null; action: unknown }> = []
  globalThis.fetch = async (_input, init) => {
    const headers = new Headers(init?.headers)
    requests.push({
      authorization: headers.get('authorization'),
      action: JSON.parse(String(init?.body)).action,
    })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
  const incomplete = profile({ isActive: false, phoneVerifiedAt: null })
  const complete = profile({ isActive: true, phoneVerifiedAt: '2026-07-24T12:00:00.000Z' })
  let reads = 0

  try {
    const result = await ensureCompletedAccount('verified-access-token', async () => {
      reads += 1
      return reads === 1 ? incomplete : complete
    })
    assert.equal(result?.isActive, true)
    assert.equal(result?.phoneVerifiedAt, '2026-07-24T12:00:00.000Z')
    assert.equal(reads, 2)
    assert.deepEqual(requests, [{
      authorization: 'Bearer verified-access-token',
      action: 'finalize',
    }])

    const authSource = readFileSync('src/auth/AuthContext.tsx', 'utf8')
    assert.equal((authSource.match(/ensureCompletedAccount\(/g) ?? []).length, 2)
  } finally {
    globalThis.fetch = previousFetch
  }
})

interface ProfileRow {
  id: string
  email: string
  phone: string
  is_active: boolean
}

interface FakeAdminOptions {
  calls?: string[]
  profiles: ProfileRow[]
  user: ReturnType<typeof verifiedUser>
  profileUpdateError?: { code: string; message: string; details: string }
}

function createAdmin(options: FakeAdminOptions): SupabaseClient {
  const calls = options.calls ?? []
  const admin = {
    from(table: string) {
      if (table === 'product_events') {
        return {
          async insert(values: { user_id: string; event_name: string }) {
            calls.push(`event:${values.event_name}:${values.user_id}`)
            return { data: null, error: null }
          },
        }
      }
      assert.equal(table, 'profiles')
      return {
        select() {
          const filters: Array<(row: ProfileRow) => boolean> = []
          const query = {
            eq(column: keyof ProfileRow, value: unknown) {
              filters.push((row) => row[column] === value)
              return query
            },
            neq(column: keyof ProfileRow, value: unknown) {
              filters.push((row) => row[column] !== value)
              return query
            },
            async maybeSingle() {
              return { data: options.profiles.find((row) => filters.every((filter) => filter(row))) ?? null, error: null }
            },
          }
          return query
        },
        update(values: { email: string; phone: string; is_active: boolean }) {
          const updateQuery = {
            eq(_column: string, userId: string) {
              calls.push(`profile:activate:${userId}:${values.phone}:${values.email}`)
              return updateQuery
            },
            select() {
              return updateQuery
            },
            async maybeSingle() {
              return {
                data: options.profileUpdateError ? null : { id: options.user.id },
                error: options.profileUpdateError ?? null,
              }
            },
          }
          return updateQuery
        },
      }
    },
    auth: {
      async getUser() {
        return { data: { user: options.user }, error: null }
      },
      admin: {
        async updateUserById(userId: string, attributes: { email?: string }) {
          calls.push(`auth:update-email:${userId}:${attributes.email}`)
          return { data: { user: options.user }, error: null }
        },
      },
    },
  }
  return admin as unknown as SupabaseClient
}

function verifiedUser() {
  return {
    id: 'user-1',
    phone: '989121234567',
    phone_confirmed_at: '2026-07-24T12:00:00.000Z',
    user_metadata: { email: 'owner@example.com' },
  }
}

function event(body: Record<string, unknown>, token?: string) {
  return {
    httpMethod: 'POST',
    body: JSON.stringify(body),
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  }
}

function jsonBody(response: { body: string }): Record<string, unknown> {
  return JSON.parse(response.body) as Record<string, unknown>
}

function profile(overrides: Partial<UserProfile>): UserProfile {
  return {
    id: 'user-1',
    firstName: 'Mina',
    lastName: 'Rezaei',
    email: 'owner@example.com',
    phone: '+989121234567',
    phoneVerifiedAt: null,
    createdAt: '2026-07-24T11:00:00.000Z',
    updatedAt: '2026-07-24T11:00:00.000Z',
    lastLoginAt: null,
    lastActiveAt: null,
    loginCount: 0,
    termsAcceptedAt: '2026-07-24T11:00:00.000Z',
    privacyAcceptedAt: '2026-07-24T11:00:00.000Z',
    marketingConsent: false,
    marketingConsentAt: null,
    locale: 'fa-IR',
    timezone: 'Asia/Tehran',
    signupReason: 'header_account',
    isActive: false,
    ...overrides,
  }
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
