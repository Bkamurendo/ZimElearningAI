import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? ''
  // Security: validate `next` is a safe relative path — prevent open redirect attacks
  // Must start with / and must not be a protocol-relative URL (//evil.com) or absolute URL
  const explicitNext =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://')
      ? rawNext
      : ''

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If a specific destination was requested (e.g. password reset), honour it
      if (explicitNext) {
        return NextResponse.redirect(`${origin}${explicitNext}`)
      }

      // Otherwise: smart redirect based on profile state
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_completed) {
          const dest = profile.role === 'school_admin' ? '/school-admin/dashboard' : `/${profile.role}/dashboard`
          return NextResponse.redirect(`${origin}${dest}`)
        }
      }

      // Fall back to onboarding for new / incomplete users
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
