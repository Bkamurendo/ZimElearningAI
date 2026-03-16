import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentOnboarding from './StudentOnboarding'
import GeneralOnboarding from './GeneralOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect(`/${profile.role}/dashboard`)
  }

  const role = profile?.role ?? 'student'

  if (role === 'student') {
    // Fetch subjects for all levels so the client component can filter
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .order('name')

    return (
      <StudentOnboarding
        fullName={profile?.full_name ?? ''}
        subjects={subjects ?? []}
      />
    )
  }

  return <GeneralOnboarding role={role} fullName={profile?.full_name ?? ''} />
}
