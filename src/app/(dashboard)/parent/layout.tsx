import { createClient } from '@/lib/supabase/server'
import ParentSidebar from './ParentSidebar'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName = 'Parent'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name ?? 'Parent'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ParentSidebar userName={userName} />
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
