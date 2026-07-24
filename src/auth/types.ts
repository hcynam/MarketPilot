import type { Session, User } from '@supabase/supabase-js'

export type SignupReason = 'pdf' | 'word' | 'print' | 'save' | 'header_account' | 'dashboard'

export type PendingAction = 'save' | 'pdf' | 'word' | 'print'

export interface AcquisitionSource {
  landingPage: string
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  lastActiveAt: string | null
  loginCount: number
  termsAcceptedAt: string
  privacyAcceptedAt: string
  marketingConsent: boolean
  marketingConsentAt: string | null
  locale: string
  timezone: string | null
  signupReason: SignupReason
  isActive: boolean
}

export interface RegistrationInput {
  firstName: string
  lastName: string
  countryCode: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  marketingConsent: boolean
  signupReason: SignupReason
  acquisition: AcquisitionSource
}

export interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
}

export interface PendingRegistration {
  phone: string
  email: string
  createdAt: string
}

export interface RegistrationStartResult {
  pending: PendingRegistration
  completed: boolean
}
