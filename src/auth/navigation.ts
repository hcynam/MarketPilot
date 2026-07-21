import type { SignupReason } from './types'

const AUTH_PATHS = new Set(['/login', '/signup', '/verify-phone', '/recover'])

export function safeReturnTo(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/u.test(value)) {
    return fallback
  }

  try {
    const base = new URL('https://marketpilot.local')
    const resolved = new URL(value, base)
    if (resolved.origin !== base.origin || AUTH_PATHS.has(resolved.pathname)) return fallback
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}

export function signupReason(value: string | null | undefined): SignupReason {
  return value === 'pdf' || value === 'word' || value === 'print' || value === 'save' || value === 'dashboard'
    ? value
    : 'header_account'
}

export function buildAuthPath(
  destination: 'login' | 'signup' | 'verify-phone' | 'recover',
  options: { reason?: SignupReason; returnTo?: string } = {},
): string {
  const params = new URLSearchParams()
  if (options.reason) params.set('reason', options.reason)
  if (options.returnTo) params.set('returnTo', safeReturnTo(options.returnTo))
  const query = params.toString()
  return `/${destination}${query ? `?${query}` : ''}`
}
