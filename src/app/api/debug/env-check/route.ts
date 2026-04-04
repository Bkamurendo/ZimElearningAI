import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
    }

    // Check if the URL is a placeholder
    const isPlaceholderUrl = envVars.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project.supabase.co')
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      envVars,
      isPlaceholderUrl,
      urlPreview: envVars.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      issue: isPlaceholderUrl ? 'Supabase URL is set to placeholder value' : 'URL appears to be correct',
      fix: isPlaceholderUrl ? 'Update .env.local with actual Supabase project URL' : 'Check other connection issues'
    })
  } catch (err) {
    console.error('[ENV CHECK]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
