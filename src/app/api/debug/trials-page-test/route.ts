import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    // Test the exact same query as the trials page
    const supabase = createClient()
    
    const { data: trialUsers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        plan,
        trial_ends_at,
        subscription_expires_at,
        created_at,
        last_sign_in_at
      `)
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null')
      .order('trial_ends_at', { ascending: true })

    if (error) {
      console.error('Error fetching trial users:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch trial users',
        details: error.message,
        hint: 'Check if server client is working properly'
      }, { status: 500 })
    }

    const now = new Date()
    
    // Categorize users exactly like the trials page
    const activeTrials = trialUsers?.filter(user => {
      return user.trial_ends_at && new Date(user.trial_ends_at) > now
    }) || []

    const expiredTrials = trialUsers?.filter(user => {
      return user.trial_ends_at && new Date(user.trial_ends_at) <= now
    }) || []

    const expiringSoon = trialUsers?.filter(user => {
      if (!user.trial_ends_at) return false
      const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 3
    }) || []

    return NextResponse.json({
      success: true,
      message: 'Trials page query test successful',
      results: {
        totalTrialUsers: trialUsers?.length || 0,
        activeTrials: activeTrials.length,
        expiredTrials: expiredTrials.length,
        expiringSoon: expiringSoon.length,
        currentTime: now.toISOString()
      },
      sampleData: trialUsers?.slice(0, 3).map(user => ({
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
    console.error('[TRIALS PAGE TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
