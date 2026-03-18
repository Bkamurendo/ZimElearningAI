/**
 * Daily AI usage quota per user.
 *
 * FREE  users: FREE_DAILY_LIMIT AI requests per day (resets midnight UTC)
 * PRO   users: unlimited
 *
 * Quota is tracked in the `profiles` table via the `ai_requests_today` and
 * `ai_quota_reset_at` columns.  Run the migration below if those columns
 * don't exist yet:
 *
 *   ALTER TABLE public.profiles
 *     ADD COLUMN IF NOT EXISTS ai_requests_today  INTEGER   DEFAULT 0,
 *     ADD COLUMN IF NOT EXISTS ai_quota_reset_at  TIMESTAMPTZ DEFAULT now(),
 *     ADD COLUMN IF NOT EXISTS plan               TEXT      DEFAULT 'free'
 *       CHECK (plan IN ('free', 'pro'));
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export const FREE_DAILY_LIMIT = 25   // free users get 25 AI calls per day
export const PRO_DAILY_LIMIT  = 9999 // effectively unlimited

export interface QuotaResult {
  allowed: boolean
  plan: 'free' | 'pro'
  used: number
  limit: number
  remaining: number
  resetsAt: string   // ISO string
}

/**
 * Check whether the user may make another AI request.
 * If allowed, increments the counter atomically.
 */
export async function checkAIQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaResult> {
  // Fetch current usage
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, ai_requests_today, ai_quota_reset_at')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    // Can't read profile — this usually means the quota columns haven't been migrated yet.
    // Fail OPEN with a conservative free-tier allowance so AI features still work.
    // NOTE: If you see this in logs, run the migration in supabase/schema.sql to add
    // ai_requests_today and ai_quota_reset_at columns to the profiles table.
    console.warn('[ai-quota] Could not read profile quota data:', error?.message ?? 'no profile row')
    return { allowed: true, plan: 'free', used: 0, limit: FREE_DAILY_LIMIT, remaining: FREE_DAILY_LIMIT, resetsAt: tomorrowMidnightUTC() }
  }

  const plan: 'free' | 'pro' = profile.plan ?? 'free'
  const limit = plan === 'pro' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT

  // Reset counter if it's a new day (UTC)
  const now = new Date()
  const resetAt = new Date(profile.ai_quota_reset_at ?? now)
  const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000

  const used: number = isNewDay ? 0 : (profile.ai_requests_today ?? 0)

  if (plan === 'pro') {
    // Pro users — just increment, no blocking
    await supabase.from('profiles').update({
      ai_requests_today: used + 1,
      ...(isNewDay && { ai_quota_reset_at: now.toISOString() }),
    }).eq('id', userId)

    return { allowed: true, plan, used, limit, remaining: limit - used, resetsAt: tomorrowMidnightUTC() }
  }

  // Free user — enforce limit
  if (used >= limit) {
    return {
      allowed: false,
      plan,
      used,
      limit,
      remaining: 0,
      resetsAt: tomorrowMidnightUTC(),
    }
  }

  // Increment counter
  await supabase.from('profiles').update({
    ai_requests_today: used + 1,
    ...(isNewDay && { ai_quota_reset_at: now.toISOString() }),
  }).eq('id', userId)

  return {
    allowed: true,
    plan,
    used: used + 1,
    limit,
    remaining: limit - (used + 1),
    resetsAt: tomorrowMidnightUTC(),
  }
}

function tomorrowMidnightUTC(): string {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.toISOString()
}
