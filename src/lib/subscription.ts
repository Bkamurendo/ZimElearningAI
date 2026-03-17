/**
 * Feature gating based on user subscription plan.
 * FREE users get limited AI calls and basic features.
 * PRO users ($5/month) get unlimited AI + all features.
 */

export interface PlanFeatures {
  aiDailyLimit: number        // AI calls per day
  canDownloadResources: boolean
  canAccessPastPapers: boolean
  canUseGradePredictor: boolean
  canUseStudyPlanner: boolean
  canViewLeaderboard: boolean
  maxSubjects: number
}

export const PLAN_FEATURES: Record<'free' | 'pro', PlanFeatures> = {
  free: {
    aiDailyLimit: 10,
    canDownloadResources: false,
    canAccessPastPapers: true,     // 2 per day (enforced via quota)
    canUseGradePredictor: true,    // 1 per day
    canUseStudyPlanner: true,      // 1 per day
    canViewLeaderboard: true,
    maxSubjects: 5,
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
}

export function getPlanFeatures(plan: 'free' | 'pro' = 'free'): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free
}

export function isFeatureAllowed(plan: 'free' | 'pro', feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan)
  const val = features[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val > 0
  return false
}
