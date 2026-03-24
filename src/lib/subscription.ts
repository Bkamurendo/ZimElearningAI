/**
 * Feature gating based on user subscription plan.
 *
 * FREE    — 25 AI calls/day, limited features
 * STARTER — $2/mo — 100 AI calls/day, downloads, 15 subjects
 * PRO     — $5/mo — unlimited AI, all tools, all subjects
 * ELITE   — $8/mo — unlimited AI + priority model + parent dashboard
 */

export type Plan = 'free' | 'starter' | 'pro' | 'elite'

export interface PlanFeatures {
  aiDailyLimit: number
  canDownloadResources: boolean
  canAccessPastPapers: boolean
  canUseGradePredictor: boolean
  canUseStudyPlanner: boolean
  canViewLeaderboard: boolean
  maxSubjects: number
  priorityAI: boolean       // Use Sonnet (smarter) instead of Haiku
  parentDashboard: boolean  // Parent can view child's progress reports
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    aiDailyLimit: 25,
    canDownloadResources: false,
    canAccessPastPapers: true,     // 2 per day via quota
    canUseGradePredictor: true,    // 1 per day via quota
    canUseStudyPlanner: true,      // 1 per day via quota
    canViewLeaderboard: true,
    maxSubjects: 5,
    priorityAI: false,
    parentDashboard: false,
  },
  starter: {
    aiDailyLimit: 100,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 15,
    priorityAI: false,
    parentDashboard: false,
  },
  pro: {
    aiDailyLimit: 9999,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 999,
    priorityAI: false,
    parentDashboard: false,
  },
  elite: {
    aiDailyLimit: 9999,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    maxSubjects: 999,
    priorityAI: true,
    parentDashboard: true,
  },
}

export function getPlanFeatures(plan: Plan = 'free'): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free
}

export function isFeatureAllowed(plan: Plan, feature: keyof PlanFeatures): boolean {
  const features = getPlanFeatures(plan)
  const val = features[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val > 0
  return false
}

/** Returns true if plan has unlimited AI (pro or elite) */
export function isUnlimitedAI(plan: Plan): boolean {
  return plan === 'pro' || plan === 'elite'
}
