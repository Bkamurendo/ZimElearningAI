export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    console.log('[ADMIN TEST] Starting admin test...')
    
    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('[ADMIN TEST] Admin client created successfully')
    
    // Test a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'student')
      .single()
    
    console.log('[ADMIN TEST] Query result:', { data, error })
    
    if (error) {
      console.error('[ADMIN TEST] Query error:', error)
      return NextResponse.json({ 
        error: 'Supabase admin query failed',
        details: error.message,
        hint: 'Check database connection and permissions'
      }, { status: 500 })
    }
    
    // Now test trial users specifically
    const { data: trialData, error: trialError } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .limit(5)
    
    console.log('[ADMIN TEST] Trial query result:', { trialData, trialError })
    
    return NextResponse.json({
      message: 'Supabase admin connection successful',
      studentCount: data,
      trialUsersFound: trialData?.length || 0,
      trialUsers: trialData,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[ADMIN TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
