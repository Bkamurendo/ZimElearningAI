import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    const now = new Date()
    
    // Fetch all users with trial_ends_at
    const { data: trialUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at, subscription_expires_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .order('trial_ends_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Categorize users with detailed logging
    const allUsers = trialUsers || []
    const activeTrials = allUsers.filter(user => {
      const isActive = new Date(user.trial_ends_at) > now
      console.log(`User ${user.email}: plan=${user.plan}, trial_ends=${user.trial_ends_at}, active=${isActive}`)
      return isActive
    })
    
    const expiredTrials = allUsers.filter(user => 
      new Date(user.trial_ends_at) <= now
    )
    
    const paidUsers = allUsers.filter(user => 
      user.plan !== 'free'
    )

    return NextResponse.json({
      totalUsersWithTrial: allUsers.length,
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length,
      paidUsers: paidUsers.length,
      now: now.toISOString(),
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        plan: user.plan,
        trial_ends_at: user.trial_ends_at,
        days_left: Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        is_active_trial: user.plan === 'free' && new Date(user.trial_ends_at) > now
      }))
    })
  } catch (err) {
    console.error('[DEBUG TRIALS]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
