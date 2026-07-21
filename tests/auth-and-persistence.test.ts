import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { normalizeEmail, normalizePhone, passwordError, validateRegistration } from '../src/auth/validation'
import { buildAuthPath, safeReturnTo } from '../src/auth/navigation'
import { planFingerprint, type GuestPlanSnapshot } from '../src/plans/guestPlan'
import { createPendingActionState, parsePendingAction, PENDING_ACTION_TTL_MS } from '../src/plans/pendingAction'
import { b2bSaas } from './fixtures'
import { generateFallbackMarketingPlan } from '../src/ai/fallbackPlan'

test('registration validation normalizes Persian phone digits and email without weakening consent checks', () => {
  assert.equal(normalizePhone('+98', '۰۹۱۲ ۱۲۳ ۴۵۶۷'), '+989121234567')
  assert.equal(normalizePhone('+971', '۰۰۹۷۱۵۰۱۲۳۴۵۶۷'), '+971501234567')
  assert.equal(normalizeEmail('  Owner@Example.COM '), 'owner@example.com')

  const errors = validateRegistration({
    firstName: 'مینا',
    lastName: 'رضایی',
    countryCode: '+98',
    phone: '09121234567',
    email: 'owner@example.com',
    password: 'secure-pass-1',
    confirmPassword: 'secure-pass-1',
    termsAccepted: false,
    marketingConsent: false,
    signupReason: 'save',
    acquisition: { landingPage: '/', referrer: null, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null },
  })
  assert.equal(errors.phone, undefined)
  assert.equal(errors.email, undefined)
  assert.ok(errors.termsAccepted)
})

test('password validation stays usable while requiring a basic letter and number mix', () => {
  assert.ok(passwordError('short1'))
  assert.ok(passwordError('onlyletters'))
  assert.equal(passwordError('امنیت-کافی-9'), null)
})

test('auth navigation keeps reason and a safe internal return path without creating redirect loops', () => {
  const path = buildAuthPath('signup', { reason: 'pdf', returnTo: '/account/plans/plan-1?tab=output#pdf' })
  const url = new URL(path, 'https://marketpilot.local')
  assert.equal(url.pathname, '/signup')
  assert.equal(url.searchParams.get('reason'), 'pdf')
  assert.equal(url.searchParams.get('returnTo'), '/account/plans/plan-1?tab=output#pdf')
  assert.equal(safeReturnTo('https://example.com/steal', '/account'), '/account')
  assert.equal(safeReturnTo('//example.com/steal', '/account'), '/account')
  assert.equal(safeReturnTo('/login?returnTo=/login', '/account'), '/account')
  assert.equal(safeReturnTo('/account\\settings', '/account'), '/account')
})

test('pending actions are validated, expire, and remain bound to the guest program', () => {
  const now = Date.parse('2026-07-20T12:00:00.000Z')
  const pending = createPendingActionState('word', 'guest-42', '/account', now)
  assert.deepEqual(parsePendingAction(JSON.stringify(pending), now + 1_000), pending)
  assert.equal(parsePendingAction(JSON.stringify(pending), now + PENDING_ACTION_TTL_MS + 1), null)
  assert.equal(parsePendingAction('{broken', now), null)
  assert.equal(parsePendingAction(JSON.stringify({ ...pending, action: 'share' }), now), null)
})

test('auth UI no longer exposes email login or deprecated account copy', () => {
  const authPages = readFileSync('src/auth/AuthPages.tsx', 'utf8')
  const authContext = readFileSync('src/auth/AuthContext.tsx', 'utf8')
  const gate = readFileSync('src/plans/PlanAccessContext.tsx', 'utf8')
  assert.doesNotMatch(authPages, /PhoneOrEmailField|ایمیل یا شماره موبایل|ورود به فضای شخصی|ساخت حساب رایگان/)
  assert.doesNotMatch(authPages, /رمز عبور و کد یک‌بارمصرف در MarketPilot ذخیره نمی‌شوند/)
  assert.match(authContext, /signInWithPassword\(\{ phone: normalizedPhone, password \}\)/)
  assert.doesNotMatch(authContext, /normalized\.kind === 'email'/)
  assert.doesNotMatch(gate, /شماره موبایل فقط برای ورود امن تأیید می‌شود|ساخت حساب رایگان/)
})

test('plan fingerprints are deterministic and change when structured output changes', async () => {
  const plan = generateFallbackMarketingPlan(b2bSaas)
  const snapshot: GuestPlanSnapshot = {
    guestId: 'guest-test',
    businessName: b2bSaas.businessName,
    title: 'برنامه آزمایشی',
    inputData: b2bSaas,
    outputData: plan,
    schemaVersion: 'marketing-plan.v1',
    modelProvider: 'internal',
    status: 'ready',
    origin: 'guest',
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
  }
  const first = await planFingerprint(snapshot)
  const second = await planFingerprint({ ...snapshot, updatedAt: '2026-07-21T00:00:00.000Z' })
  const changed = await planFingerprint({ ...snapshot, outputData: { ...plan, usp: `${plan.usp} تغییر` } })
  assert.equal(first, second)
  assert.notEqual(first, changed)
  assert.equal(first.length, 64)
})

test('migration enables RLS and binds every persisted domain row to auth.uid()', () => {
  const sql = readFileSync('supabase/migrations/202607200001_marketpilot_accounts.sql', 'utf8')
  assert.match(sql, /alter table public\.profiles enable row level security/i)
  assert.match(sql, /alter table public\.marketing_plans enable row level security/i)
  assert.match(sql, /alter table public\.product_events enable row level security/i)
  assert.match(sql, /plans_select_own[\s\S]*auth\.uid\(\)[\s\S]*user_id/i)
  assert.match(sql, /plans_insert_own[\s\S]*auth\.uid\(\)[\s\S]*user_id/i)
  assert.doesNotMatch(sql, /otp[^\n]*(insert|log)/i)

  const rlsTest = readFileSync('supabase/tests/rls.sql', 'utf8')
  assert.match(rlsTest, /cross-user insert unexpectedly succeeded/i)
  assert.match(rlsTest, /another user plan was directly readable/i)
  assert.match(rlsTest, /another user plan was directly writable/i)
  assert.match(rlsTest, /profile ownership visibility is incorrect/i)
  assert.match(rlsTest, /another user event was directly readable/i)
  assert.match(rlsTest, /anonymous profile read unexpectedly succeeded/i)
})

test('service role remains server-only in the environment template', () => {
  const env = readFileSync('.env.example', 'utf8')
  assert.match(env, /^SUPABASE_SERVICE_ROLE_KEY=/m)
  assert.doesNotMatch(env, /^VITE_.*SERVICE_ROLE/m)
  assert.doesNotMatch(env, /(?:sb_secret_|eyJ[A-Za-z0-9_-]{20,}\.)/)

  const client = readFileSync('src/lib/supabase.ts', 'utf8')
  assert.match(client, /VITE_SUPABASE_URL/)
  assert.match(client, /VITE_SUPABASE_ANON_KEY/)
  assert.doesNotMatch(client, /SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY/)
})

test('account function keeps service credentials server-side and returns non-enumerating duplicate errors', () => {
  const source = readFileSync('netlify/functions/account-registration.ts', 'utf8')
  const serverEnv = readFileSync('netlify/functions/_shared/serverEnv.ts', 'utf8')
  assert.match(source, /readSupabaseServerConfig/)
  assert.match(serverEnv, /SUPABASE_URL/)
  assert.match(serverEnv, /VITE_SUPABASE_URL/)
  assert.match(serverEnv, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.doesNotMatch(source, /VITE_.*SERVICE_ROLE/)
  assert.doesNotMatch(source, /EMAIL_ALREADY_REGISTERED|PHONE_ALREADY_REGISTERED/)
  assert.match(source, /CONTACT_ALREADY_REGISTERED/)
  assert.match(source, /ACCOUNT_SERVICE_UNAVAILABLE/)
})
