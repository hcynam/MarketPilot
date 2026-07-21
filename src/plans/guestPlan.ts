import type { BusinessInput, MarketingPlan } from '../types'

const GUEST_PLAN_KEY = 'marketpilot-guest-plan-v1'
const GUEST_PLAN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface GuestPlanSnapshot {
  guestId: string
  businessName: string
  title: string
  inputData: BusinessInput
  outputData: MarketingPlan
  schemaVersion: string
  modelProvider: string | null
  status: 'ready'
  origin: 'guest' | 'authenticated'
  createdAt: string
  updatedAt: string
  claimedBy?: string
  savedPlanId?: string
}

export function createGuestPlanSnapshot(args: {
  businessName: string
  inputData: BusinessInput
  outputData: MarketingPlan
  modelProvider?: string | null
}): GuestPlanSnapshot {
  const previous = loadGuestPlanSnapshot()
  const now = new Date().toISOString()
  return {
    guestId: previous?.guestId ?? createId(),
    businessName: args.businessName.trim() || 'برنامه بازاریابی',
    title: args.businessName.trim() ? `برنامه بازاریابی ${args.businessName.trim()}` : 'برنامه بازاریابی',
    inputData: clone(args.inputData),
    outputData: clone(args.outputData),
    schemaVersion: 'marketing-plan.v1',
    modelProvider: args.modelProvider ?? null,
    status: 'ready',
    origin: previous?.origin ?? 'guest',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }
}

export function saveGuestPlanSnapshot(snapshot: GuestPlanSnapshot): void {
  try {
    localStorage.setItem(GUEST_PLAN_KEY, JSON.stringify(snapshot))
  } catch {
    // The visible plan remains in React state when storage is unavailable.
  }
}

export function loadGuestPlanSnapshot(): GuestPlanSnapshot | null {
  try {
    const raw = localStorage.getItem(GUEST_PLAN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuestPlanSnapshot
    const updatedAt = Date.parse(parsed.updatedAt)
    if (!parsed.guestId || !parsed.inputData || !parsed.outputData || !Number.isFinite(updatedAt) || Date.now() - updatedAt > GUEST_PLAN_TTL_MS) {
      localStorage.removeItem(GUEST_PLAN_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function markGuestPlanClaimed(userId: string): void {
  const snapshot = loadGuestPlanSnapshot()
  if (!snapshot) return
  saveGuestPlanSnapshot({ ...snapshot, claimedBy: userId, origin: 'authenticated' })
}

export function clearGuestPlanSnapshot(): void {
  try { localStorage.removeItem(GUEST_PLAN_KEY) } catch { /* storage unavailable */ }
}

export async function planFingerprint(snapshot: GuestPlanSnapshot): Promise<string> {
  const value = stableStringify({
    businessName: snapshot.businessName,
    inputData: snapshot.inputData,
    outputData: snapshot.outputData,
  })
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
