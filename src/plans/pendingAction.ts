import type { PendingAction } from '../auth/types'
import { safeReturnTo } from '../auth/navigation'

export const PENDING_ACTION_KEY = 'marketpilot-pending-action-v2'
export const PENDING_ACTION_TTL_MS = 30 * 60 * 1000

export interface PendingActionState {
  action: PendingAction
  guestId: string
  returnTo: string
  createdAt: string
}

export function createPendingActionState(
  action: PendingAction,
  guestId: string,
  returnTo: string,
  now = Date.now(),
): PendingActionState {
  return { action, guestId, returnTo: safeReturnTo(returnTo), createdAt: new Date(now).toISOString() }
}

export function parsePendingAction(raw: string, now = Date.now()): PendingActionState | null {
  try {
    const value = JSON.parse(raw) as Partial<PendingActionState>
    const action = value.action
    const createdAt = typeof value.createdAt === 'string' ? Date.parse(value.createdAt) : Number.NaN
    if (action !== 'save' && action !== 'pdf' && action !== 'word' && action !== 'print') return null
    if (!value.guestId || !Number.isFinite(createdAt) || now - createdAt > PENDING_ACTION_TTL_MS || createdAt - now > 60_000) return null
    return {
      action,
      guestId: value.guestId,
      returnTo: safeReturnTo(value.returnTo, '/'),
      createdAt: new Date(createdAt).toISOString(),
    }
  } catch {
    return null
  }
}
