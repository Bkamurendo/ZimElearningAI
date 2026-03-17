import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/onboarding'
  // Security: validate `next` is a safe relative path — prevent open redirect attacks
  // Must start with / and must not be a protocol-relative URL (//evil.com) or absolute URL
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://')
    ? rawNext
    : '/onboarding'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
