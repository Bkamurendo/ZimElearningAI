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

/**
 * Check if a user has active premium access (via plan, trial, or role)
 */
export function isPremium(profile: {
  plan?: string | null
  pro_expires_at?: string | null
  trial_ends_at?: string | null
  role?: string | null
} | null | undefined): boolean {
  if (!profile) return false

  // Admins and Teachers are always considered premium for UI testing/moderation
  if (profile.role === 'admin' || profile.role === 'teacher') return true

  const now = new Date()

  // 1. Check if trial is active
  if (profile.trial_ends_at) {
    if (new Date(profile.trial_ends_at) > now) return true
  }

  // 2. Check if paid plan is active
  if (profile.plan && ['starter', 'pro', 'elite'].includes(profile.plan)) {
    // If there's no expiration date, it's a legacy/manual lifetime or managed sub
    if (!profile.pro_expires_at) return true

    // Otherwise check if it hasn't expired yet
    if (new Date(profile.pro_expires_at) > now) return true
  }

  return false
}
