import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import StudentOnboarding from './StudentOnboarding'
import GeneralOnboarding from './GeneralOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user

  if (authError || !user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which we might want to handle differently,
    // but assuming standard error handling for now.
    console.error('[Onboarding] Profile error:', profileError)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup error</h2>
        <p className="text-slate-600 mb-6 text-center">We encountered a problem while fetching your profile. Please try refreshing.</p>
        <Link href="/login">
          <Button variant="premium">Back to Login</Button>
        </Link>
      </div>
    )
  }

  if (profile?.onboarding_completed) {
    const role = profile.role?.toLowerCase() ?? 'student'
    redirect(`/${role === 'school_admin' ? 'school-admin' : role}/dashboard`)
  }

  const role = profile?.role ?? 'student'

  if (role === 'student') {
    // Fetch subjects for all levels so the client component can filter
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('name')

    if (subjectsError) {
      console.error('[Onboarding] Subjects error:', subjectsError)
    }

    return (
      <StudentOnboarding
        fullName={profile?.full_name ?? ''}
        subjects={subjects ?? []}
      />
    )
  }

  return <GeneralOnboarding role={role} fullName={profile?.full_name ?? ''} />
}
