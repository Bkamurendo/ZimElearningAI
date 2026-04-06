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
  
  // 1. SKIP AUTH FOR STATIC ASSETS & CALLBACKS
  const isAuthCallback = lowerPath.startsWith('/auth/callback')
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.ico', '.woff', '.woff2', '.map']
  const isStaticFile = staticExtensions.some(ext => lowerPath.endsWith(ext)) || lowerPath.includes('/_next/')
  
  let user = null
  if (!isAuthCallback && !isStaticFile) {
    try {
      // Safely check for user without crashing on null data or network failure
      const { data, error: authError } = await supabase.auth.getUser()
      if (!authError && data?.user) {
        user = data.user
      }
    } catch (err) {
      console.error('[Middleware] Global Auth Error:', err)
      // Fallback: assume not logged in rather than crashing the whole site
    }
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

  // Define public paths that DON'T require a valid session
  const publicPaths = [
    '/login', '/register', '/auth/callback', '/schools', 
    '/privacy', '/terms', '/forgot-password', '/reset-password', 
    '/api/schools', '/api/debug', '/admin/trials-test', '/debug-elearning'
  ]
  const isPublicPath = publicPaths.some((p) => lowerPath.startsWith(p))

  // 2. UNAUTHENTICATED -> LOGIN (Except public paths & root)
  if (!user && !isPublicPath && pathname !== '/') {
    return redirectWithCookies('/login')
  }

  // 3. AUTHENTICATED on public path OR root -> DASHBOARD
  if (user && (isPublicPath || pathname === '/')) {
    try {
      // If already on a dashboard path or debug page, let it pass
      if (lowerPath.includes('/dashboard') || lowerPath === '/debug-elearning') return supabaseResponse

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (!profile.onboarding_completed && pathname !== '/onboarding') {
          return redirectWithCookies('/onboarding')
        }
        
        const safeRole = profile.role?.toLowerCase() || 'student'
        const dest = safeRole === 'school_admin' ? '/school-admin/dashboard' : `/${safeRole}/dashboard`
        
        // Prevent redirecting if we are already at the destination
        if (pathname === dest) return supabaseResponse
        return redirectWithCookies(dest)
      }
    } catch (err) {
      console.error('[Middleware] Profile lookup failed:', err)
      // If profile lookup fails, let them stay where they are or fall through
    }
  }

  // 4. ONBOARDING GUARD: If finished, go to dashboard
  if (user && pathname === '/onboarding') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        const safeRole = profile.role?.toLowerCase() || 'student'
        const dest = safeRole === 'school_admin' ? '/school-admin/dashboard' : `/${safeRole}/dashboard`
        return redirectWithCookies(dest)
      }
    } catch (err) {
       console.error('[Middleware] Onboarding check failed:', err)
    }
  }

  return supabaseResponse
}
