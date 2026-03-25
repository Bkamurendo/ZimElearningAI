import { createClient } from '@/lib/supabase/server'
import StudentSidebar from './StudentSidebar'
import { MobileBottomNav } from '@/components/MobileBottomNav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'Student'
  let streak = 0
  let unreadNotifications = 0
  let unreadMessages = 0
  let plan: 'free' | 'starter' | 'pro' | 'elite' = 'free'
  let aiUsed = 0
  let trialEndsAt: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name, plan, ai_requests_today, ai_quota_reset_at, trial_ends_at').eq('id', user.id).single()
    userName = profile?.full_name ?? 'Student'
    plan = (profile?.plan ?? 'free') as typeof plan
    trialEndsAt = profile?.trial_ends_at ?? null
    // Calculate today's usage (reset if new day)
    const now = new Date()
    const resetAt = new Date(profile?.ai_quota_reset_at ?? now)
    const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
    aiUsed = isNewDay ? 0 : (profile?.ai_requests_today ?? 0)

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
      />
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
      <MobileBottomNav role="student" />
    </div>
  )
}
