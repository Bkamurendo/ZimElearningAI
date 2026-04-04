import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('[TRIAL TEST] Testing trial user detection...')
    
    // Test 1: Check if we can connect to profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'student')
      .single()
    
    if (profilesError) {
      return NextResponse.json({ 
        error: 'Failed to connect to profiles table',
        details: profilesError.message
      }, { status: 500 })
    }
    
    // Test 2: Check for trial users
    const { data: trialUsers, error: trialError } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .order('trial_ends_at', { ascending: true })
    
    if (trialError) {
      return NextResponse.json({ 
        error: 'Failed to fetch trial users',
        details: trialError.message
      }, { status: 500 })
    }
    
    // Test 3: Check if new tables exist
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('count')
      .single()
    
    const userActivityTableExists = !activityError
    
    const now = new Date()
    const activeTrials = trialUsers?.filter(user => 
      user.trial_ends_at && new Date(user.trial_ends_at) > now
    ) || []
    
    const expiredTrials = trialUsers?.filter(user => 
      user.trial_ends_at && new Date(user.trial_ends_at) <= now
    ) || []
    
    return NextResponse.json({
      success: true,
      message: 'Trial user detection test completed',
      results: {
        totalStudents: profiles?.count || 0,
        totalTrialUsers: trialUsers?.length || 0,
        activeTrials: activeTrials.length,
        expiredTrials: expiredTrials.length,
        userActivityTableExists: !activityError,
        currentTime: now.toISOString()
      },
      trialUsers: trialUsers?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        plan: user.plan,
        trial_ends_at: user.trial_ends_at,
        days_left: user.trial_ends_at ? Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
        status: user.trial_ends_at && new Date(user.trial_ends_at) > now ? 'active' : 'expired'
      }))
    })
  } catch (err) {
    console.error('[TRIAL TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
