declare const process: { env: Record<string, string | undefined> }

export interface SupabaseServerConfig {
  supabaseUrl: string
  serviceRoleKey: string
}

export interface SupabaseServerConfigStatus {
  supabaseUrl: string | null
  serviceRoleKey: string | null
  hasSupabaseUrl: boolean
  hasServiceRoleKey: boolean
  usedViteSupabaseUrlFallback: boolean
}

export function readSupabaseServerConfigStatus(): SupabaseServerConfigStatus {
  const explicitUrl = process.env.SUPABASE_URL?.trim() || null
  const viteUrl = process.env.VITE_SUPABASE_URL?.trim() || null
  const supabaseUrl = explicitUrl || viteUrl
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null

  return {
    supabaseUrl,
    serviceRoleKey,
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    usedViteSupabaseUrlFallback: !explicitUrl && Boolean(viteUrl),
  }
}

export function readSupabaseServerConfig(): SupabaseServerConfig | null {
  const status = readSupabaseServerConfigStatus()
  if (!status.supabaseUrl || !status.serviceRoleKey) return null
  return {
    supabaseUrl: status.supabaseUrl,
    serviceRoleKey: status.serviceRoleKey,
  }
}
