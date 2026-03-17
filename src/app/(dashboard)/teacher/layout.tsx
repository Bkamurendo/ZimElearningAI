import { createClient } from '@/lib/supabase/server'
import TeacherSidebar from './TeacherSidebar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'Teacher'
  let unreadMessages = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', user.id).single()
    userName = profile?.full_name ?? 'Teacher'

    try {
      const { count } = await supabase
        .from('messages').select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id).eq('read', false)
      unreadMessages = count ?? 0
    } catch { /* messages table may not exist */ }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherSidebar userName={userName} unreadMessages={unreadMessages} />
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
