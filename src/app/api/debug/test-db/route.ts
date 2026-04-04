import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data: testResult, error } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'student')
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 500 })
    }

    // Test raw SQL query
    const { data: rawResult, error: rawError } = await supabase
      .rpc('count_students_with_trials')

    return NextResponse.json({
      connectionTest: 'SUCCESS',
      basicCount: testResult,
      rawResult: rawResult,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[DEBUG TEST DB]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
