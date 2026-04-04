import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const now = new Date()
    
    console.log('[TRIAL INVESTIGATION] Starting investigation...')
    
    // 1. Check ALL students first
    const { data: allStudents, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
    
    console.log(`[TRIAL INVESTIGATION] All students count: ${allStudents?.length || 0}`)
    
    if (allError) {
      console.error('[TRIAL INVESTIGATION] Error fetching all students:', allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // 2. Check specifically for trial_ends_at not null
    const { data: trialQuery, error: trialError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
    
    console.log(`[TRIAL INVESTIGATION] Trial query count: ${trialQuery?.length || 0}`)
    
    if (trialError) {
      console.error('[TRIAL INVESTIGATION] Error fetching trial users:', trialError)
      return NextResponse.json({ error: trialError.message }, { status: 500 })
    }

    // 3. Try different approach - check for ANY trial_ends_at value
    const { data: anyTrialEnds, error: anyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .limit(10)
    
    console.log(`[TRIAL INVESTIGATION] Any trial_ends_at count: ${anyTrialEnds?.length || 0}`)

    // 4. Manual check - look for specific patterns
    const manualTrialUsers = allStudents?.filter(user => {
      const hasTrialEnd = user.trial_ends_at && user.trial_ends_at !== null
      const trialEndValid = user.trial_ends_at && !isNaN(new Date(user.trial_ends_at).getTime())
      return hasTrialEnd && trialEndValid
    }) || []

    console.log(`[TRIAL INVESTIGATION] Manual trial users count: ${manualTrialUsers.length}`)

    // 5. Show sample data
    const sampleUsers = manualTrialUsers.slice(0, 3).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      plan: user.plan,
      trial_ends_at: user.trial_ends_at,
      days_left: user.trial_ends_at ? Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    }))

    return NextResponse.json({
      investigation: {
        all_students_count: allStudents?.length || 0,
        trial_query_count: trialQuery?.length || 0,
        any_trial_ends_count: anyTrialEnds?.length || 0,
        manual_trial_count: manualTrialUsers.length,
        current_time: now.toISOString(),
        sample_trial_users: sampleUsers
      },
      all_students_sample: allStudents?.slice(0, 3).map(user => ({
        id: user.id,
        email: user.email,
        plan: user.plan,
        trial_ends_at: user.trial_ends_at,
        has_trial: !!user.trial_ends_at
      }))
    })
  } catch (err) {
    console.error('[TRIAL INVESTIGATION]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
