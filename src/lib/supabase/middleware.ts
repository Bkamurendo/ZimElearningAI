import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const lowerPath = pathname.toLowerCase()

  // 1. FAST EXIT FOR PUBLIC PAGES - Solve 504 Timeout on Login
  const publicPaths = [
    '/', '/login', '/register', '/auth/callback', '/schools', 
    '/privacy', '/terms', '/forgot-password', '/reset-password', 
    '/api/schools', '/api/debug', '/admin/trials-test', '/debug-elearning'
  ]
  const isPublicPath = publicPaths.some((p) => pathname === p || lowerPath.startsWith(p))
  
  // If it's a public path, don't even talk to Supabase — just let it through
  if (isPublicPath) {
    return NextResponse.next({ request })
  }

  // 2. ONLY INITIALIZE SUPABASE FOR PRIVATE ROUTES
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase URL or Key is missing. Skipping auth guard.')
    return supabaseResponse
  }

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

  // 3. AUTH CHECK FOR PRIVATE ROUTES
  let user = null
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    if (!authError && data?.user) {
      user = data.user
    }
  } catch (err) {
    console.error('[Middleware] Global Auth Error:', err)
  }

  // --- Helper: Redirect while preserving session cookies ---
  const redirectWithCookies = (path: string) => {
    if (pathname === path) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectResponse = NextResponse.redirect(url)
    
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // 4. UNAUTHENTICATED on private path -> LOGIN
  if (!user) {
    return redirectWithCookies('/login')
  }

  // 5. AUTHENTICATED -> Proceed to private route
  return supabaseResponse
}
