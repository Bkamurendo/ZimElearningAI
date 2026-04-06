import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? ''
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  
  // Use custom domain for redirects if set, otherwise fallback to request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
  const origin = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl

  // Handle incoming OAuth errors immediately
  if (error || errorCode) {
    console.error(`[auth-callback] OAuth Error: ${error} (${errorCode}): ${searchParams.get('error_description')}`)
    return NextResponse.redirect(`${origin}/login?error=${errorCode || 'bad_oauth_state'}`)
  }

  // Security: validate `next` is a safe relative path
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
