import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Prevent infinite recursive fetch loops on Vercel if ENV vars are missing
    console.error('CRITICAL: Supabase URL or Key is missing. Skipping auth guard.')
    return supabaseResponse
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    supabaseUrl,
    supabaseKey,
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
    '/', '/login', '/register', '/auth/callback', '/schools', 
    '/privacy', '/terms', '/forgot-password', '/reset-password', 
    '/api/schools', '/api/debug', '/admin/trials-test', '/debug-elearning'
  ]
  const isPublicPath = publicPaths.some((p) => pathname === p || lowerPath.startsWith(p))

  // 2. UNAUTHENTICATED -> LOGIN (Except public paths)
  if (!user && !isPublicPath) {
    return redirectWithCookies('/login')
  }

  // 3. AUTHENTICATED -> Allow them to browse public pages or proceed to private ones
  // We remove the automatic "Profile -> Dashboard" redirect from middleware
  // because it requires a database lookup that causes timeouts on Vercel Edge.
  
  return supabaseResponse

  return supabaseResponse
}
