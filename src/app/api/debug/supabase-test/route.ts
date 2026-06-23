export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[SUPABASE TEST] Starting test...')
    
    // Test Supabase client creation
    const supabase = createClient()
    console.log('[SUPABASE TEST] Client created successfully')
    
    // Test a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'student')
      .single()
    
    console.log('[SUPABASE TEST] Query result:', { data, error })
    
    if (error) {
      console.error('[SUPABASE TEST] Query error:', error)
      return NextResponse.json({ 
        error: 'Supabase query failed',
        details: error.message,
        hint: 'Check database connection and permissions'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'Supabase connection successful',
      studentCount: data,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[SUPABASE TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
