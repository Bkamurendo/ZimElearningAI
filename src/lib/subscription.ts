/**
 * Feature gating based on user subscription plan.
 * FREE users get limited AI calls and basic features.
 * STARTER ($2/mo) — entry-level paid tier with moderate limits.
 * PRO ($5/month) — full AI access + all features.
 * ELITE ($8/month) — highest tier with maximum limits.
 */

export type PlanTier = 'free' | 'starter' | 'pro' | 'elite'

export interface PlanFeatures {
  aiDailyLimit: number        // AI calls per day
  canDownloadResources: boolean
  canAccessPastPapers: boolean
  canUseGradePredictor: boolean
  canUseStudyPlanner: boolean
  canViewLeaderboard: boolean
  maxSubjects: number
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    aiDailyLimit: 10,
    canDownloadResources: false,
    canAccessPastPapers: true,     // 2 per day (enforced via quota)
    canUseGradePredictor: true,    // 1 per day
    canUseStudyPlanner: true,      // 1 per day
    canViewLeaderboard: true,
    maxSubjects: 5,
  },
  starter: {
    aiDailyLimit: 50,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 10,
  },
  pro: {
    aiDailyLimit: 9999,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 999,
  },
  elite: {
    aiDailyLimit: 9999,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 999,
  },
}

/** Monthly price in USD for each plan tier */
export const PLAN_PRICES: Record<PlanTier, number> = {
  free: 0,
  starter: 2,
  pro: 5,
  elite: 8,
}

export function getPlanFeatures(plan: PlanTier = 'free'): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free
}

export function isFeatureAllowed(plan: PlanTier, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan)
  const val = features[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val > 0
  return false
}

/** Returns true for any paid plan tier */
export function isPaidPlan(plan: PlanTier): boolean {
  return plan !== 'free'
}
