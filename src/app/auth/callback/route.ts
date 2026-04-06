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
    return NextResponse.redirect(url.toString())
  }

  if (code) {
    const supabase = createClient()
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError) {
        // 1. If a specific destination was requested (e.g. /reset-password), honour it immediately
        if (explicitNext) {
          return redirectWithCookies(explicitNext)
        }

        // 2. Otherwise: smart redirect based on profile state
        const { data: userData, error: userError } = await supabase.auth.getUser()
        const user = userData?.user
        
        if (user && !userError) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', user.id)
            .single()

          if (profile) {
            if (!profile.onboarding_completed) {
              return redirectWithCookies('/onboarding')
            }
            
            const safeRole = profile.role?.toLowerCase() || 'student'
            const dest = safeRole === 'school_admin' ? '/school-admin/dashboard' : `/${safeRole}/dashboard`
            return redirectWithCookies(dest)
          }
        }

        // 3. Fall back to onboarding for new / incomplete users
        return redirectWithCookies('/onboarding')
      } else {
        console.error('[auth-callback] Code exchange failed:', exchangeError.message)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&error_description=${encodeURIComponent(exchangeError.message)}`)
      }
    } catch (err) {
      console.error('[auth-callback] Critical route failure:', err)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
