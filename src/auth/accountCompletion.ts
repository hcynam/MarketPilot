import type { UserProfile } from './types'

interface AccountResponse {
  code?: string
  status?: 'available' | 'resume'
}

export async function accountRequest(
  action: string,
  payload: Record<string, unknown>,
  token?: string,
): Promise<AccountResponse> {
  const response = await fetch('/.netlify/functions/account-registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const body = await response.json().catch(() => ({ code: 'ACCOUNT_REQUEST_FAILED' })) as AccountResponse
  if (!response.ok) throw new Error(body.code ?? 'ACCOUNT_REQUEST_FAILED')
  return body
}

export async function ensureCompletedAccount(
  accessToken: string,
  refreshProfile: () => Promise<UserProfile | null>,
): Promise<UserProfile | null> {
  let currentProfile = await refreshProfile()
  if (currentProfile?.isActive && currentProfile.phoneVerifiedAt) return currentProfile
  await accountRequest('finalize', {}, accessToken)
  currentProfile = await refreshProfile()
  return currentProfile
}
