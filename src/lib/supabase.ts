import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// #region agent log
fetch('http://127.0.0.1:7773/ingest/afbfef74-f320-498c-8563-5938b6d7d154',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8bc043'},body:JSON.stringify({sessionId:'8bc043',runId:'pre-fix',hypothesisId:'B',location:'supabase.ts:init',message:'supabase client config',data:{hasUrl:Boolean(supabaseUrl),hasAnonKey:Boolean(supabaseAnonKey),configured:isSupabaseConfigured,mode:import.meta.env.MODE},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED')
  return supabase
}
