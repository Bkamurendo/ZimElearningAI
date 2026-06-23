export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Fetch ALL students without any filters
    const { data: allStudents, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at, subscription_expires_at, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check for any trial_ends_at values
    const usersWithTrialEnds = allStudents?.filter(user => user.trial_ends_at) || []
    const usersWithTrialEndsCount = usersWithTrialEnds.length

    // Check for null trial_ends_at
    const usersWithoutTrialEnds = allStudents?.filter(user => !user.trial_ends_at) || []
    const usersWithoutTrialEndsCount = usersWithoutTrialEnds.length

    return NextResponse.json({
      totalStudents: allStudents?.length || 0,
      usersWithTrialEnds: usersWithTrialEndsCount,
      usersWithoutTrialEnds: usersWithoutTrialEndsCount,
      users: allStudents?.map(user => ({
        id: user.id,
        email: user.email,
        plan: user.plan,
        trial_ends_at: user.trial_ends_at,
        has_trial: !!user.trial_ends_at,
        created_at: user.created_at
      }))
    })
  } catch (err) {
    console.error('[DEBUG ALL USERS]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
