import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    // Test basic functionality without Supabase
    return NextResponse.json({
      message: 'Debug endpoint is working',
      timestamp: new Date().toISOString(),
      env_vars: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET'
      }
    })
  } catch (err) {
    console.error('[SIMPLE TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
