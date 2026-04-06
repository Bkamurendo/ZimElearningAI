import { createClient } from '@/lib/supabase/server'
import StudentSidebar from './StudentSidebar'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import TrialStatusBanner from '@/components/TrialStatusBanner'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user

  let userName = 'Student'
  let streak = 0
  let unreadNotifications = 0
  let unreadMessages = 0
  let plan: 'free' | 'starter' | 'pro' | 'elite' = 'free'
  let aiUsed = 0
  let trialEndsAt: string | null = null
  let subscriptionExpiresAt: string | null = null
  let hasChallenge = false

  if (user) {
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('full_name, plan, ai_requests_today, ai_quota_reset_at, trial_ends_at, subscription_expires_at')
        .eq('id', user.id)
        .single()
      
      if (pError || !profile) {
        console.warn('[StudentLayout] Profile not found or quota columns missing:', pError?.message)
      } else {
        userName = profile.full_name ?? 'Student'
        plan = (profile.plan ?? 'free') as typeof plan
        trialEndsAt = profile.trial_ends_at ?? null
        subscriptionExpiresAt = profile.subscription_expires_at ?? null
        
        // Calculate today's usage (reset if new day)
        const now = new Date()
        const resetAt = new Date(profile.ai_quota_reset_at ?? now)
        const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
        aiUsed = isNewDay ? 0 : (profile.ai_requests_today ?? 0)
      }
    } catch (e) {
      console.error('[StudentLayout] Critical error fetching profile:', e)
    }

    const { data: sp } = await supabase
      .from('student_profiles').select('id').eq('user_id', user.id).single() as { data: { id: string } | null; error: unknown }

    if (sp) {
      const { data: s } = await supabase
        .from('student_streaks').select('current_streak').eq('student_id', sp.id).single() as { data: { current_streak: number } | null; error: unknown }
      streak = s?.current_streak ?? 0
    }

    // Unread notifications
    try {
      const { count } = await supabase
        .from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('read', false)
      unreadNotifications = count ?? 0
    } catch { /* table may not exist */ }

    // Unread messages
    try {
      const { count } = await supabase
        .from('messages').select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id).eq('read', false)
      unreadMessages = count ?? 0
    } catch { /* table may not exist */ }

    // Check if today's challenge is available and not yet attempted
    try {
      if (sp) {
        const { data: spFull } = await supabase
          .from('student_profiles')
          .select('zimsec_level')
          .eq('user_id', user.id)
          .single() as { data: { zimsec_level: string } | null; error: unknown }

        if (spFull?.zimsec_level) {
          const todayStr = new Date().toISOString().split('T')[0]
          const { data: todayChallenge } = await supabase
            .from('daily_challenges')
            .select('id')
            .eq('challenge_date', todayStr)
            .eq('zimsec_level', spFull.zimsec_level)
            .single()

          if (todayChallenge) {
            const { data: attempt } = await supabase
              .from('daily_challenge_attempts')
              .select('id')
              .eq('challenge_id', todayChallenge.id)
              .eq('user_id', user.id)
              .single()
            hasChallenge = !attempt
          } else {
            // Challenge not yet generated — mark as available so user can trigger generation
            hasChallenge = true
          }
        }
      }
    } catch { /* daily_challenges table may not exist yet */ }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar
        userName={userName}
        streak={streak}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        plan={plan}
        aiUsed={aiUsed}
        trialEndsAt={trialEndsAt}
        subscriptionExpiresAt={subscriptionExpiresAt}
        hasChallenge={hasChallenge}
      />
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <div className="pt-14 lg:pt-0">
          <TrialStatusBanner trialEndsAt={trialEndsAt} subscriptionExpiresAt={subscriptionExpiresAt} plan={plan} />
          {children}
        </div>
      </div>
      <MobileBottomNav role="student" />
    </div>
  )
}
