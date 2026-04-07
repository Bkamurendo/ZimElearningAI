import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // ─── IMPORTANT: Create the redirect response FIRST, then attach ───
  // cookies to it. This ensures session cookies from exchangeCodeForSession
  // are included in the very response the browser receives, so subsequent
  // requests (middleware, dashboard) see an authenticated session.
  // Using next/headers cookies() + a separate NextResponse.redirect() loses
  // the cookies because they live on different response objects.

  // Start with a placeholder redirect (we'll update the Location header below)
  const placeholderUrl = new URL('/login?error=auth_callback_failed', origin)
  const response = NextResponse.redirect(placeholderUrl)

  // Create a supabase client whose cookie setter writes to `response`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read from the incoming request
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to the outgoing response so they survive the redirect
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth-callback] Code exchange failed:', exchangeError.message)
      const errUrl = new URL('/login', origin)
      errUrl.searchParams.set('error', 'auth_callback_failed')
      errUrl.searchParams.set('error_description', exchangeError.message)
      response.headers.set('Location', errUrl.toString())
      return response
    }

    // ── Code exchanged successfully; cookies are now on `response` ──

    // 1. If a specific destination was requested (e.g. /reset-password), honour it
    if (explicitNext) {
      response.headers.set('Location', new URL(explicitNext, origin).toString())
      return response
    }

    // 2. Smart redirect based on profile state
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
          response.headers.set('Location', new URL('/onboarding', origin).toString())
          return response
        }

        const safeRole = profile.role?.toLowerCase() || 'student'
        const dest = safeRole === 'school_admin' ? '/school-admin/dashboard' : `/${safeRole}/dashboard`
        response.headers.set('Location', new URL(dest, origin).toString())
        return response
      }
    }

    // 3. Fall back to onboarding for new / incomplete users
    response.headers.set('Location', new URL('/onboarding', origin).toString())
    return response

  } catch (err) {
    console.error('[auth-callback] Critical route failure:', err)
    const errUrl = new URL('/login', origin)
    errUrl.searchParams.set('error', 'auth_callback_failed')
    response.headers.set('Location', errUrl.toString())
    return response
  }
}
