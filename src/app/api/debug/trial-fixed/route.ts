import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .limit(10)
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch trial users',
        details: error.message
      }, { status: 500 })
    }
    
    const now = new Date()
    const activeTrials = data?.filter(user => 
      user.trial_ends_at && new Date(user.trial_ends_at) > now
    ) || []
    
    return NextResponse.json({
      success: true,
      totalTrialUsers: data?.length || 0,
      activeTrials: activeTrials.length,
      users: data?.map(user => ({
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
    console.error('[TRIAL FIXED]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
