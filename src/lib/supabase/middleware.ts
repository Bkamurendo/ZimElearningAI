import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Safely check for user without crashing on null data
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user

  const { pathname } = request.nextUrl

  // --- Helper: Redirect while preserving session cookies ---
  const redirectWithCookies = (path: string) => {
    // Only redirect if we're not already there (infinite loop guard)
    if (pathname === path) return supabaseResponse
    
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectResponse = NextResponse.redirect(url)
    
    // CRITICAL: Copy cookies set during getUser() (session refresh) to the new redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectResponse
  }

  const publicPaths = ['/login', '/register', '/auth/callback', '/schools', '/privacy', '/terms', '/forgot-password', '/reset-password', '/api/schools', '/api/debug', '/admin/trials-test']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  // 1. Not logged in -> Redirect to login (unless already on a public path)
  if (!user && !isPublicPath && pathname !== '/') {
    return redirectWithCookies('/login')
  }

  // 2. Logged in on a public path OR root -> Redirect to their respective home
  if (user && (isPublicPath || pathname === '/')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (!profile.onboarding_completed) {
          return redirectWithCookies('/onboarding')
        }
        return redirectWithCookies(`/${profile.role}/dashboard`)
      }
    } catch (err) {
      console.error('[Middleware] Profile lookup failed:', err)
      // Fall through to allow request if DB is busy, rather than crashing
    }
  }

  // 3. Logged in on onboarding -> Redirect if already finished
  if (user && pathname === '/onboarding') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        return redirectWithCookies(`/${profile.role}/dashboard`)
      }
    } catch (err) {
       console.error('[Middleware] Onboarding check failed:', err)
    }
  }

  return supabaseResponse
}
