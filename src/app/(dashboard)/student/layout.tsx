import { createClient } from '@/lib/supabase/server'
import StudentSidebar from './StudentSidebar'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName = 'Student'
  let streak = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name ?? 'Student'

    const { data: sp } = (await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()) as { data: { id: string } | null; error: unknown }

    if (sp) {
      const { data: s } = (await supabase
        .from('student_streaks')
        .select('current_streak')
        .eq('student_id', sp.id)
        .single()) as { data: { current_streak: number } | null; error: unknown }
      streak = s?.current_streak ?? 0
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar userName={userName} streak={streak} />
      {/* Content shifts right on desktop, adds top padding on mobile */}
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
