import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { createClient } from '@/lib/supabase/server'
import StudentOnboarding from './StudentOnboarding'
import GeneralOnboarding from './GeneralOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user

  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, onboarding_completed')
      .eq('id', user.id)
      .single()

    // Must be outside nested try/catch so redirect() propagates correctly
    if (profile?.onboarding_completed) {
      const role = profile.role?.toLowerCase() ?? 'student'
      redirect(`/${role === 'school_admin' ? 'school-admin' : role}/dashboard`)
    }

    const role = profile?.role ?? 'student'

    if (role === 'student') {
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
    if (isRedirectError(err)) throw err  // let Next.js handle redirects
    console.error('[Onboarding] Runtime error:', err)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup error</h2>
        <p className="text-slate-600 mb-6 text-center">We encountered a problem setting up your account. Please try refreshing.</p>
        <a href="/login" className="mt-4 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition">
          Back to Login
        </a>
      </div>
    )
  }
}

