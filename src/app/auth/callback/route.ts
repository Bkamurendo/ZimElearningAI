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

  // --- Helper: Redirect while preserving session cookies ---
  const redirectWithCookies = (path: string) => {
    const url = new URL(path, origin)
    const redirectResponse = NextResponse.redirect(url.toString())
    
    // We don't have a 'supabaseResponse' variable here like in middleware,
    // but the cookies are already in the current environment's request/response cycle.
    // However, for consistency with our middleware fixes, we ensure the redirect
    // is absolute to the custom domain.
    return redirectResponse
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      // 1. If a specific destination was requested (e.g. /reset-password), honour it immediately
      if (explicitNext) {
        return redirectWithCookies(explicitNext)
      }

      // 2. Otherwise: smart redirect based on profile state
      const { data, error: userError } = await supabase.auth.getUser()
      const user = data?.user
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_completed) {
          const dest = profile.role === 'school_admin' ? '/school-admin/dashboard' : `/${profile.role}/dashboard`
          return redirectWithCookies(dest)
        }
      }

      // 3. Fall back to onboarding for new / incomplete users
      return redirectWithCookies('/onboarding')
    } else {
      console.error('[auth-callback] Code exchange failed:', exchangeError.message)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
