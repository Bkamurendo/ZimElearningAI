import { createClient } from '@/lib/supabase/server'
import StudentSidebar from './StudentSidebar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'Student'
  let streak = 0
  let unreadNotifications = 0
  let unreadMessages = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()
    userName = profile?.full_name ?? 'Student'

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
      />
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
