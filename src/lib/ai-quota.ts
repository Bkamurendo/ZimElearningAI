// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export const FREE_DAILY_LIMIT = 5

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  return data?.plan ?? 'free'
}

export function isPaidPlan(plan: string): boolean {
  return ['starter', 'pro', 'elite'].includes(plan)
}

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  resetsAt: string
}

export async function checkAIQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, ai_requests_today, ai_quota_reset_at')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    // Fail open — quota columns may not exist yet
    return { allowed: true, used: 0, limit: FREE_DAILY_LIMIT, remaining: FREE_DAILY_LIMIT, resetsAt: tomorrowMidnightUTC() }
  }

  // Paid users (starter/pro/elite) have unlimited AI access
  if (isPaidPlan(profile.plan)) {
    return { allowed: true, used: 0, limit: 9999, remaining: 9999, resetsAt: tomorrowMidnightUTC() }
  }

  // Free users: enforce daily limit
  const now = new Date()
  const resetAt = new Date(profile.ai_quota_reset_at ?? now)
  const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
  const used: number = isNewDay ? 0 : (profile.ai_requests_today ?? 0)

  if (used >= FREE_DAILY_LIMIT) {
    return { allowed: false, used, limit: FREE_DAILY_LIMIT, remaining: 0, resetsAt: tomorrowMidnightUTC() }
  }

  // Increment counter
  await supabase.from('profiles').update({
    ai_requests_today: used + 1,
    ...(isNewDay && { ai_quota_reset_at: now.toISOString() }),
  }).eq('id', userId)

  return {
    allowed: true,
    used: used + 1,
    limit: FREE_DAILY_LIMIT,
    remaining: FREE_DAILY_LIMIT - (used + 1),
    resetsAt: tomorrowMidnightUTC(),
  }
}

function tomorrowMidnightUTC(): string {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.toISOString()
}
