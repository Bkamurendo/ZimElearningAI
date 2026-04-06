/**
 * Daily AI usage quota per user.
 *
 * FREE    users: 25 AI requests/day  (resets midnight UTC)
 * STARTER users: 100 AI requests/day
 * PRO     users: unlimited
 * ELITE   users: unlimited
 *
 * Quota is tracked in the `profiles` table via:
 *   ai_requests_today  INTEGER   DEFAULT 0
 *   ai_quota_reset_at  TIMESTAMPTZ DEFAULT now()
 *   plan               TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','pro','elite'))
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export type PlanTier = 'free' | 'starter' | 'pro' | 'elite'

export const FREE_DAILY_LIMIT    = 25
export const STARTER_DAILY_LIMIT = 100
export const PRO_DAILY_LIMIT     = 9999   // effectively unlimited

function getDailyLimit(plan: PlanTier): number {
  if (plan === 'pro' || plan === 'elite') return PRO_DAILY_LIMIT
  if (plan === 'starter') return STARTER_DAILY_LIMIT
  return FREE_DAILY_LIMIT
}

export interface QuotaResult {
  allowed: boolean
  plan: PlanTier
  used: number
  limit: number
  remaining: number
  resetsAt: string   // ISO string
  trialExpired?: boolean
}

/**
 * Check whether the user may make another AI request.
 * If allowed, increments the counter atomically.
 */
export async function checkAIQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, ai_requests_today, ai_quota_reset_at, trial_ends_at')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    // Fail OPEN — quota columns not migrated yet
    console.warn('[ai-quota] Could not read profile quota data:', error?.message ?? 'no profile row')
    return { allowed: true, plan: 'free', used: 0, limit: FREE_DAILY_LIMIT, remaining: FREE_DAILY_LIMIT, resetsAt: tomorrowMidnightUTC() }
  }

  // Check if 7-day free trial is still active — treat as 'pro' while on trial
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialActive = trialEndsAt ? trialEndsAt > new Date() : false
  const isTrialExpired = trialEndsAt ? trialEndsAt <= new Date() : false

  const plan: PlanTier = profile.plan ?? 'free'
  // Effective plan for quota purposes: trial users get pro limits
  const effectivePlan: PlanTier = isTrialActive ? 'pro' : plan
  const limit = getDailyLimit(effectivePlan)

  // Reset counter if it's a new day (UTC)
  const now = new Date()
  const resetAt = new Date(profile.ai_quota_reset_at ?? now)
  const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000

  const used: number = isNewDay ? 0 : (profile.ai_requests_today ?? 0)

  if (effectivePlan === 'pro' || effectivePlan === 'elite') {
    // Unlimited plans (and trial users) — increment for analytics, never block
    await supabase.from('profiles').update({
      ai_requests_today: used + 1,
      ...(isNewDay && { ai_quota_reset_at: now.toISOString() }),
    }).eq('id', userId)

    return { allowed: true, plan, used, limit, remaining: limit - used, resetsAt: tomorrowMidnightUTC(), trialExpired: isTrialExpired }
  }

  // Starter / Free — enforce daily limit
  if (used >= limit) {
    return { allowed: false, plan, used, limit, remaining: 0, resetsAt: tomorrowMidnightUTC(), trialExpired: isTrialExpired }
  }

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
    trialExpired: isTrialExpired,
  }
}

function tomorrowMidnightUTC(): string {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.toISOString()
}
