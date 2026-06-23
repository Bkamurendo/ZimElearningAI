import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? ''
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
  const origin = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl

  // Handle incoming OAuth errors from the provider immediately
  if (error || errorCode) {
    console.error(`[auth-callback] OAuth Error: ${error} (${errorCode}): ${searchParams.get('error_description')}`)
    return NextResponse.redirect(`${origin}/login?error=${errorCode || 'bad_oauth_state'}`)
  }

  // Security: only allow safe relative paths
  const explicitNext =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://')
      ? rawNext
      : ''

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Create the redirect response first, then attach session cookies to it.
  // This ensures cookies set by exchangeCodeForSession are included in the
  // same response the browser receives so middleware sees an authed session.
  const response = NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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

      // Recovery: if the code is expired/already-used but there's a valid
      // existing session (e.g. user hit Back after a successful login),
      // don't strand them on the error page — redirect to their dashboard.
      const { data: existingSession } = await supabase.auth.getSession()
      if (existingSession?.session?.user) {
        return redirectToDashboard(supabase, existingSession.session.user.id, explicitNext, origin, response)
      }

      response.headers.set(
        'Location',
        new URL(`/login?error=auth_callback_failed`, origin).toString()
      )
      return response
    }

    // Code exchanged successfully — cookies are now on `response`

    if (explicitNext) {
      response.headers.set('Location', new URL(explicitNext, origin).toString())
      return response
    }

    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      return redirectToDashboard(supabase, userData.user.id, explicitNext, origin, response)
    }

    // New user with no profile yet — send to onboarding
    response.headers.set('Location', new URL('/onboarding', origin).toString())
    return response

  } catch (err) {
    console.error('[auth-callback] Critical route failure:', err)
    response.headers.set('Location', new URL('/login?error=auth_callback_failed', origin).toString())
    return response
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function redirectToDashboard(supabase: any, userId: string, explicitNext: string, origin: string, response: NextResponse) {
  if (explicitNext) {
    response.headers.set('Location', new URL(explicitNext, origin).toString())
    return response
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', userId)
      .single()

    if (!profile || !profile.onboarding_completed) {
      response.headers.set('Location', new URL('/onboarding', origin).toString())
      return response
    }

    const role = profile.role?.toLowerCase() ?? 'student'
    const dest = role === 'school_admin' ? '/school-admin/dashboard' : `/${role}/dashboard`
    response.headers.set('Location', new URL(dest, origin).toString())
  } catch {
    response.headers.set('Location', new URL('/onboarding', origin).toString())
  }

  return response
}
