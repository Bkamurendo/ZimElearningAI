/**
 * Feature gating based on user subscription plan.
 *
 * FREE    — 3 AI calls/day
 * STARTER — $2/mo ($15/yr) — 10 AI calls/day, downloads, 15 subjects
 * PRO     — $5/mo ($40/yr) — 40 AI calls/day, all tools, all subjects
 * ELITE   — $12/mo ($90/yr) — 120 AI calls/day + priority model + parent dashboard
 * ULTIMATE— $25/mo ($200/yr) — Unlimited AI + 1-on-1 support
 */

export type Plan = 'free' | 'starter' | 'pro' | 'elite' | 'ultimate'

export interface PlanFeatures {
  aiDailyLimit: number
  canDownloadResources: boolean
  canAccessPastPapers: boolean
  canUseGradePredictor: boolean
  canUseStudyPlanner: boolean
  canViewLeaderboard: boolean
  canAccessAIWorkspace: boolean
  canAccessResourceLibrary: boolean
  maxSubjects: number
  priorityAI: boolean       // Use Sonnet (smarter) instead of Haiku
  parentDashboard: boolean  // Parent can view child's progress reports
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    aiDailyLimit: 3,
    canDownloadResources: false,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    canAccessAIWorkspace: false,
    canAccessResourceLibrary: false,
    maxSubjects: 5,
    priorityAI: false,
    parentDashboard: false,
  },
  starter: {
    aiDailyLimit: 10,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    canAccessAIWorkspace: true,
    canAccessResourceLibrary: true,
    maxSubjects: 15,
    priorityAI: false,
    parentDashboard: false,
  },
  pro: {
    aiDailyLimit: 40,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    canAccessAIWorkspace: true,
    canAccessResourceLibrary: true,
    maxSubjects: 999,
    priorityAI: false,
    parentDashboard: false,
  },
  elite: {
    aiDailyLimit: 120,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    canAccessAIWorkspace: true,
    canAccessResourceLibrary: true,
    maxSubjects: 999,
    priorityAI: true,
    parentDashboard: true,
  },
  ultimate: {
    aiDailyLimit: 9999,
    canDownloadResources: true,
    canAccessPastPapers: true,
    canUseGradePredictor: true,
    canUseStudyPlanner: true,
    canViewLeaderboard: true,
    canAccessAIWorkspace: true,
    canAccessResourceLibrary: true,
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

/** Returns true if plan has unlimited AI (ultimate) */
export function isUnlimitedAI(plan: Plan): boolean {
  return plan === 'ultimate'
}

/**
 * Check if a user has active premium access (via plan, trial, or role)
 */
export function isPremium(profile: {
  plan?: string | null
  pro_expires_at?: string | null
  trial_ends_at?: string | null
  role?: string | null
  schools?: {
    subscription_plan: string | null
    subscription_expires_at: string | null
  } | null
} | null | undefined): boolean {
  if (!profile) return false

  // Admins and Teachers are always considered premium for UI testing/moderation
  const role = profile.role?.toLowerCase()
  if (role === 'admin' || role === 'teacher' || role === 'school_admin') return true

  const now = new Date()

  // 1. Check if trial is active
  if (profile.trial_ends_at) {
    if (new Date(profile.trial_ends_at) > now) return true
  }

  // 2. Check if paid plan is active
  if (profile.plan && ['starter', 'pro', 'elite', 'ultimate'].includes(profile.plan)) {
    // If there's no expiration date, it's a legacy/manual lifetime or managed sub
    if (!profile.pro_expires_at) return true

    // Otherwise check if it hasn't expired yet
    if (new Date(profile.pro_expires_at) > now) return true
  }

  // 3. Check if user belongs to a school with an active premium subscription
  if (profile.schools && profile.schools.subscription_plan === 'pro') {
    if (!profile.schools.subscription_expires_at) return true
    if (new Date(profile.schools.subscription_expires_at) > now) return true
  }

  return false
}
