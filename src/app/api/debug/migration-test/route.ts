import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const results = {
      trialUsers: { status: 'working', count: 0 },
      userActivity: { status: 'not_tested', exists: false },
      studySessions: { status: 'not_tested', exists: false },
      schools: { status: 'not_tested', exists: false },
      announcements: { status: 'not_tested', exists: false },
      securityEvents: { status: 'not_tested', exists: false }
    }
    
    // Test 1: Trial users (should work)
    try {
      const { data: trialData } = await supabase
        .from('profiles')
        .select('count')
        .eq('role', 'student')
        .not('trial_ends_at', 'is', null)
        .single()
      results.trialUsers.count = trialData?.count || 0
      results.trialUsers.status = 'working'
    } catch (err) {
      results.trialUsers.status = 'error'
    }
    
    // Test 2: User activity table
    try {
      const { data: activityData } = await supabase
        .from('user_activity')
        .select('count')
        .single()
      results.userActivity.exists = true
      results.userActivity.status = 'working'
    } catch (err) {
      results.userActivity.status = 'table_not_found'
    }
    
    // Test 3: Study sessions table
    try {
      const { data: sessionData } = await supabase
        .from('study_sessions')
        .select('count')
        .single()
      results.studySessions.exists = true
      results.studySessions.status = 'working'
    } catch (err) {
      results.studySessions.status = 'table_not_found'
    }
    
    // Test 4: Schools table
    try {
      const { data: schoolData } = await supabase
        .from('schools')
        .select('count')
        .single()
      results.schools.exists = true
      results.schools.status = 'working'
    } catch (err) {
      results.schools.status = 'table_not_found'
    }
    
    // Test 5: Announcements table
    try {
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('count')
        .single()
      results.announcements.exists = true
      results.announcements.status = 'working'
    } catch (err) {
      results.announcements.status = 'table_not_found'
    }
    
    // Test 6: Security events table
    try {
      const { data: securityData } = await supabase
        .from('security_events')
        .select('count')
        .single()
      results.securityEvents.exists = true
      results.securityEvents.status = 'working'
    } catch (err) {
      results.securityEvents.status = 'table_not_found'
    }
    
    const allTablesWorking = Object.values(results).every(r => r.status === 'working')
    
    return NextResponse.json({
      success: true,
      migrationComplete: allTablesWorking,
      message: allTablesWorking 
        ? 'All admin tables are working! Migration successful.'
        : 'Migration partially complete. Some tables may need the SQL script.',
      results,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[MIGRATION TEST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
