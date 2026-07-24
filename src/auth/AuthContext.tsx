import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase'
import { accountRequest, ensureCompletedAccount } from './accountCompletion'
import { isValidPhone, normalizeEmail, normalizePhone } from './validation'
import type {
  AuthState,
  PendingRegistration,
  RegistrationInput,
  RegistrationStartResult,
  UserProfile,
} from './types'

const PENDING_REGISTRATION_KEY = 'marketpilot-pending-registration-v1'

interface AuthContextValue extends AuthState {
  refreshProfile: () => Promise<UserProfile | null>
  startRegistration: (input: RegistrationInput) => Promise<RegistrationStartResult>
  verifyRegistration: (phone: string, token: string, email?: string) => Promise<void>
  resendRegistrationOtp: (phone: string) => Promise<void>
  signInWithPassword: (phone: string, password: string, countryCode?: string) => Promise<void>
  sendLoginOtp: (phone: string) => Promise<void>
  verifyLoginOtp: (phone: string, token: string) => Promise<void>
  sendRecoveryOtp: (phone: string) => Promise<void>
  verifyRecoveryOtp: (phone: string, token: string) => Promise<void>
  setRecoveredPassword: (password: string) => Promise<void>
  updateNames: (firstName: string, lastName: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  requestPhoneChange: (phone: string) => Promise<void>
  confirmPhoneChange: (phone: string, token: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()
    const currentSession = sessionData.session
    setSession(currentSession)
    if (!currentSession?.user) {
      setProfile(null)
      return null
    }
    const { data, error } = await client.from('profiles').select('*').eq('id', currentSession.user.id).maybeSingle()
    if (error) throw new Error('PROFILE_LOAD_FAILED')
    const mapped = data ? mapProfile(data as Record<string, unknown>) : null
    setProfile(mapped)
    return mapped
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let alive = true
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (data.session) {
        try {
          await refreshProfile()
        } catch {
          setProfile(null)
        }
      }
      if (alive) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        return
      }
      setTimeout(() => {
        void refreshProfile().catch(() => setProfile(null)).finally(() => setLoading(false))
      }, 0)
    })
    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [refreshProfile])

  const startRegistration = useCallback(async (input: RegistrationInput): Promise<RegistrationStartResult> => {
    const client = requireSupabase()
    const phone = normalizePhone(input.countryCode, input.phone)
    const email = normalizeEmail(input.email)

    const preflight = await accountRequest('preflight', { email, phone })
    const pending = { phone, email, createdAt: new Date().toISOString() }
    if (preflight.status === 'resume') {
      const { data, error } = await client.auth.signInWithPassword({ phone, password: input.password })
      if (!error && data.session) {
        await accountRequest('finalize', { email }, data.session.access_token)
        await client.auth.refreshSession()
        await refreshProfile()
        sessionStorage.removeItem(PENDING_REGISTRATION_KEY)
        return { pending, completed: true }
      }

      if (!isUnconfirmedPhoneError(error?.message)) throw new Error('LOGIN_INVALID')
      const { error: resendError } = await client.auth.resend({ phone, type: 'sms' })
      if (resendError) throw new Error(mapAuthError(resendError.message))
      sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(pending))
      return { pending, completed: false }
    }

    const { error } = await client.auth.signUp({
      phone,
      password: input.password,
      options: {
        channel: 'sms',
        data: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          email,
          terms_accepted: true,
          privacy_accepted: true,
          marketing_consent: input.marketingConsent,
          locale: navigator.language || 'fa-IR',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          landing_page: input.acquisition.landingPage,
          referrer: input.acquisition.referrer,
          utm_source: input.acquisition.utmSource,
          utm_medium: input.acquisition.utmMedium,
          utm_campaign: input.acquisition.utmCampaign,
          utm_content: input.acquisition.utmContent,
          utm_term: input.acquisition.utmTerm,
          signup_reason: input.signupReason,
        },
      },
    })
    if (error) throw new Error(mapAuthError(error.message))

    sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(pending))
    return { pending, completed: false }
  }, [refreshProfile])

  const verifyRegistration = useCallback(async (phone: string, token: string, email?: string): Promise<void> => {
    const client = requireSupabase()
    const { data, error } = await client.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error || !data.session) throw new Error(mapOtpError(error?.message))
    await accountRequest('finalize', email ? { email } : {}, data.session.access_token)
    await client.auth.refreshSession()
    await refreshProfile()
    sessionStorage.removeItem(PENDING_REGISTRATION_KEY)
  }, [refreshProfile])

  const resendRegistrationOtp = useCallback(async (phone: string): Promise<void> => {
    const { error } = await requireSupabase().auth.resend({ phone, type: 'sms' })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const signInWithPassword = useCallback(async (phone: string, password: string, countryCode = '+98'): Promise<void> => {
    const client = requireSupabase()
    const normalizedPhone = normalizePhone(countryCode, phone)
    if (!isValidPhone(normalizedPhone)) throw new Error('LOGIN_PHONE_INVALID')
    const { data, error } = await client.auth.signInWithPassword({ phone: normalizedPhone, password })
    if (error || !data.session) throw new Error('LOGIN_INVALID')
    let currentProfile: UserProfile | null
    try {
      currentProfile = await ensureCompletedAccount(data.session.access_token, refreshProfile)
    } catch (completionError) {
      await client.auth.signOut()
      throw completionError
    }
    if (!currentProfile?.isActive || !currentProfile.phoneVerifiedAt) {
      await client.auth.signOut()
      throw new Error('ACCOUNT_NOT_ACTIVE')
    }
    await recordLogin()
  }, [refreshProfile])

  const sendLoginOtp = useCallback(async (phone: string): Promise<void> => {
    const { error } = await requireSupabase().auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const verifyLoginOtp = useCallback(async (phone: string, token: string): Promise<void> => {
    const client = requireSupabase()
    const { data, error } = await client.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error || !data.session) throw new Error(mapOtpError(error?.message))
    let currentProfile: UserProfile | null
    try {
      currentProfile = await ensureCompletedAccount(data.session.access_token, refreshProfile)
    } catch (completionError) {
      await client.auth.signOut()
      throw completionError
    }
    if (!currentProfile?.isActive) {
      await client.auth.signOut()
      throw new Error('ACCOUNT_NOT_ACTIVE')
    }
    await recordLogin()
  }, [refreshProfile])

  const sendRecoveryOtp = sendLoginOtp

  const verifyRecoveryOtp = useCallback(async (phone: string, token: string): Promise<void> => {
    const { data, error } = await requireSupabase().auth.verifyOtp({ phone, token, type: 'sms' })
    if (error || !data.session) throw new Error(mapOtpError(error?.message))
  }, [])

  const setRecoveredPassword = useCallback(async (password: string): Promise<void> => {
    const { error } = await requireSupabase().auth.updateUser({ password })
    if (error) throw new Error(mapAuthError(error.message))
    await refreshProfile()
    await recordLogin()
  }, [refreshProfile])

  const updateNames = useCallback(async (firstName: string, lastName: string): Promise<void> => {
    const { error } = await requireSupabase().from('profiles').update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    }).eq('id', session?.user.id)
    if (error) throw new Error('PROFILE_UPDATE_FAILED')
    await refreshProfile()
  }, [refreshProfile, session?.user.id])

  const updateEmail = useCallback(async (email: string): Promise<void> => {
    const accessToken = session?.access_token
    if (!accessToken) throw new Error('NOT_AUTHENTICATED')
    await accountRequest('update-email', { email: normalizeEmail(email) }, accessToken)
    await requireSupabase().auth.refreshSession()
    await refreshProfile()
  }, [refreshProfile, session?.access_token])

  const requestPhoneChange = useCallback(async (phone: string): Promise<void> => {
    const { error } = await requireSupabase().auth.updateUser({ phone })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const confirmPhoneChange = useCallback(async (phone: string, token: string): Promise<void> => {
    const client = requireSupabase()
    const { error } = await client.auth.verifyOtp({ phone, token, type: 'phone_change' })
    if (error) throw new Error(mapOtpError(error.message))
    const { error: syncError } = await client.rpc('confirm_phone_change', { new_phone: phone })
    if (syncError) throw new Error('PHONE_UPDATE_FAILED')
    await refreshProfile()
  }, [refreshProfile])

  const updatePassword = useCallback(async (password: string): Promise<void> => {
    const { error } = await requireSupabase().auth.updateUser({ password })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    const client = requireSupabase()
    const { error } = await client.auth.signOut()
    if (error) throw new Error('SIGN_OUT_FAILED')
    setProfile(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    refreshProfile,
    startRegistration,
    verifyRegistration,
    resendRegistrationOtp,
    signInWithPassword,
    sendLoginOtp,
    verifyLoginOtp,
    sendRecoveryOtp,
    verifyRecoveryOtp,
    setRecoveredPassword,
    updateNames,
    updateEmail,
    requestPhoneChange,
    confirmPhoneChange,
    updatePassword,
    signOut,
  }), [
    confirmPhoneChange, loading, profile, refreshProfile, requestPhoneChange,
    resendRegistrationOtp, sendLoginOtp, sendRecoveryOtp, session, setRecoveredPassword,
    signInWithPassword, signOut, startRegistration, updateEmail, updateNames,
    updatePassword, verifyLoginOtp, verifyRecoveryOtp, verifyRegistration,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function readPendingRegistration(): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY)
    return raw ? JSON.parse(raw) as PendingRegistration : null
  } catch {
    return null
  }
}

async function recordLogin(): Promise<void> {
  const client = requireSupabase()
  await client.rpc('record_authenticated_login')
  await client.from('product_events').insert({ event_name: 'login', metadata: {} })
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    phoneVerifiedAt: stringOrNull(row.phone_verified_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastLoginAt: stringOrNull(row.last_login_at),
    lastActiveAt: stringOrNull(row.last_active_at),
    loginCount: Number(row.login_count ?? 0),
    termsAcceptedAt: String(row.terms_accepted_at),
    privacyAcceptedAt: String(row.privacy_accepted_at),
    marketingConsent: Boolean(row.marketing_consent),
    marketingConsentAt: stringOrNull(row.marketing_consent_at),
    locale: String(row.locale ?? 'fa-IR'),
    timezone: stringOrNull(row.timezone),
    signupReason: row.signup_reason as UserProfile['signupReason'],
    isActive: Boolean(row.is_active),
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function mapOtpError(message?: string): string {
  const lower = message?.toLowerCase() ?? ''
  if (lower.includes('expired')) return 'OTP_EXPIRED'
  if (lower.includes('token') || lower.includes('otp')) return 'OTP_INVALID'
  return 'OTP_VERIFICATION_FAILED'
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('rate') || lower.includes('seconds')) return 'OTP_RATE_LIMITED'
  if (lower.includes('already') || lower.includes('registered')) return 'CONTACT_ALREADY_REGISTERED'
  if (lower.includes('password')) return 'PASSWORD_REJECTED'
  return 'AUTH_REQUEST_FAILED'
}

function isUnconfirmedPhoneError(message?: string): boolean {
  const lower = message?.toLowerCase() ?? ''
  return lower.includes('phone not confirmed') || lower.includes('not confirmed')
}
