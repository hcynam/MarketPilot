import type { User } from '@supabase/supabase-js'
import { requireSupabase } from '../lib/supabase'
import type { BusinessInput, MarketingPlan } from '../types'
import {
  markGuestPlanClaimed,
  planFingerprint,
  type GuestPlanSnapshot,
} from './guestPlan'

export interface SavedPlan {
  id: string
  businessName: string
  title: string
  inputData: BusinessInput
  outputData: MarketingPlan
  schemaVersion: string
  modelProvider: string | null
  status: 'ready' | 'generating' | 'failed'
  origin: string
  createdAt: string
  updatedAt: string
  lastViewedAt: string | null
}

export async function savePlanForUser(snapshot: GuestPlanSnapshot, user: User): Promise<SavedPlan> {
  const client = requireSupabase()
  const fingerprint = await planFingerprint(snapshot)
  const row = {
    user_id: user.id,
    guest_id: snapshot.guestId,
    plan_fingerprint: fingerprint,
    business_name: snapshot.businessName,
    title: snapshot.title,
    input_data: snapshot.inputData,
    output_data: snapshot.outputData,
    schema_version: snapshot.schemaVersion,
    model_provider: snapshot.modelProvider,
    status: snapshot.status,
    origin: snapshot.origin,
    export_context: { businessName: snapshot.businessName },
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await client
    .from('marketing_plans')
    .upsert(row, { onConflict: 'user_id,plan_fingerprint' })
    .select('*')
    .single()
  if (error) throw new Error(safeDatabaseError(error.code))
  markGuestPlanClaimed(user.id)
  return mapSavedPlan(data as Record<string, unknown>)
}

export async function claimGuestPlan(snapshot: GuestPlanSnapshot | null, user: User): Promise<SavedPlan | null> {
  if (!snapshot || snapshot.claimedBy === user.id) return null
  return savePlanForUser(snapshot, user)
}

export async function listPlans(): Promise<SavedPlan[]> {
  const { data, error } = await requireSupabase()
    .from('marketing_plans')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(safeDatabaseError(error.code))
  return (data ?? []).map((row) => mapSavedPlan(row as Record<string, unknown>))
}

export async function getPlan(id: string): Promise<SavedPlan | null> {
  const { data, error } = await requireSupabase()
    .from('marketing_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(safeDatabaseError(error.code))
  if (!data) return null
  await requireSupabase().from('marketing_plans').update({ last_viewed_at: new Date().toISOString() }).eq('id', id)
  return mapSavedPlan(data as Record<string, unknown>)
}

export async function trackProductEvent(
  eventName: 'signup_completed' | 'login' | 'plan_generated' | 'plan_saved' | 'plan_viewed' | 'pdf_exported' | 'word_exported' | 'printed',
  planId?: string,
  metadata: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  try {
    await requireSupabase().from('product_events').insert({
      event_name: eventName,
      plan_id: planId ?? null,
      metadata,
    })
  } catch {
    // Analytics must never interrupt the user's primary action.
  }
}

function mapSavedPlan(row: Record<string, unknown>): SavedPlan {
  return {
    id: String(row.id),
    businessName: String(row.business_name ?? ''),
    title: String(row.title ?? 'برنامه بازاریابی'),
    inputData: row.input_data as BusinessInput,
    outputData: row.output_data as MarketingPlan,
    schemaVersion: String(row.schema_version ?? 'marketing-plan.v1'),
    modelProvider: typeof row.model_provider === 'string' ? row.model_provider : null,
    status: row.status as SavedPlan['status'],
    origin: String(row.origin ?? 'authenticated'),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastViewedAt: typeof row.last_viewed_at === 'string' ? row.last_viewed_at : null,
  }
}

function safeDatabaseError(code?: string): string {
  if (code === '23505') return 'PLAN_ALREADY_SAVED'
  if (code === '42501') return 'PLAN_ACCESS_DENIED'
  return 'PLAN_STORAGE_FAILED'
}
