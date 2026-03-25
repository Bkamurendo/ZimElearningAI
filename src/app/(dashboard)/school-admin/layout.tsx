import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SchoolAdminSidebar from './SchoolAdminSidebar'

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin') {
    redirect('/login')
  }

  if (!profile.school_id) {
    redirect('/login')
  }

  const { data: school } = await supabase
    .from('schools')
    .select('name, plan')
    .eq('id', profile.school_id)
    .single()

  const schoolName = school?.name ?? 'My School'
  const adminName = profile.full_name ?? 'School Admin'
  const plan: 'basic' | 'pro' = (school?.plan === 'pro' ? 'pro' : 'basic')

  return (
    <div className="min-h-screen bg-slate-50">
      <SchoolAdminSidebar
        schoolName={schoolName}
        adminName={adminName}
        plan={plan}
      />
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
