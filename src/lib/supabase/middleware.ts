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

  const { pathname } = request.nextUrl
  const lowerPath = pathname.toLowerCase()
  
  // OPTIMIZATION: Skip getUser() for public assets and the callback route itself
  // to avoid consuming one-time 'code' parameters or slowing down static files
  const isAuthCallback = lowerPath.startsWith('/auth/callback')
  
  // Only skip for actual common static assets
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.ico', '.woff', '.woff2']
  const isStaticFile = staticExtensions.some(ext => lowerPath.endsWith(ext))
  
  let user = null
  if (!isAuthCallback && !isStaticFile) {
    // Safely check for user without crashing on null data
    const { data, error: authError } = await supabase.auth.getUser()
    user = data?.user
  }

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
  const isPublicPath = publicPaths.some((p) => lowerPath.startsWith(p))

  // 1. Not logged in -> Redirect to login (unless already on a public path)
  if (!user && !isPublicPath && pathname !== '/') {
    return redirectWithCookies('/login')
  }

  // 2. Logged in on a public path OR root -> Redirect to their respective home
  if (user && (isPublicPath || pathname === '/')) {
    try {
      // OPTIMIZATION: If already on a dashboard, don't re-fetch profile to redirect
      if (lowerPath.includes('/dashboard')) return supabaseResponse

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (!profile.onboarding_completed) {
          return redirectWithCookies('/onboarding')
        }
        // Enforce lower-case role for URL consistency
        const safeRole = profile.role?.toLowerCase() || 'student'
        const dest = safeRole === 'school_admin' ? '/school-admin/dashboard' : `/${safeRole}/dashboard`
        return redirectWithCookies(dest)
      }
    } catch (err) {
      console.error('[Middleware] Profile lookup failed:', err)
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
        const safeRole = profile.role?.toLowerCase() || 'student'
        return redirectWithCookies(`/${safeRole}/dashboard`)
      }
    } catch (err) {
       console.error('[Middleware] Onboarding check failed:', err)
    }
  }

  return supabaseResponse
}
