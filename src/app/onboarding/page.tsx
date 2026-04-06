import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentOnboarding from './StudentOnboarding'
import GeneralOnboarding from './GeneralOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
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
  } catch (err) {
    console.error('[Onboarding] Runtime error:', err)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup error</h2>
        <p className="text-slate-600 mb-6 text-center">We encountered a problem while setting up your account. Please try refreshing.</p>
        <Link href="/login">
          <Button variant="premium">Back to Login</Button>
        </Link>
      </div>
    )
  }
}

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
