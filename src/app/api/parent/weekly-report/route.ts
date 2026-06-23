export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'

/**
 * Weekly Progress Sync for Parents
 * This endpoint would typically be called by a CRON job every Sunday evening.
 * It aggregates student data and sends a summary to the registered parent.
 */
export async function GET() {
  const supabase = createClient()
  
  // 1. Fetch all profiles that have a parent phone
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, parent_phone')
    .not('parent_phone', 'is', null)

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
  if (!profiles || profiles.length === 0) return NextResponse.json({ message: 'No parent contacts found' })

  const results = []

  for (const profile of profiles) {
    try {
      // 2. Get student profile
      const { data: student } = await supabase
        .from('student_profiles')
        .select('id, current_streak')
        .eq('user_id', profile.id)
        .single()

      if (!student) continue

      // 3. Get activity for the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: recentAttempts } = await supabase
        .from('quiz_attempts')
        .select('id, subject_id, score, total')
        .eq('student_id', student.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      const { data: recentLessons } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('student_id', student.id)
        .eq('status', 'completed')
        .gte('updated_at', sevenDaysAgo.toISOString())

      // 4. Calculate stats
      const subjectsStudied = new Set(recentAttempts?.map(a => a.subject_id)).size
      const activeDays = new Set(recentAttempts?.map(a => a.created_at?.slice(0, 10))).size
      const avgScore = recentAttempts && recentAttempts.length > 0
        ? Math.round((recentAttempts.reduce((acc, a) => acc + (a.score / a.total), 0) / recentAttempts.length) * 100)
        : 0

      // 5. Send report if there was activity
      if (recentAttempts?.length || recentLessons?.length) {
        const firstName = profile.full_name?.split(' ')[0] ?? 'Student'
        const report = `ZimLearn Weekly: ${firstName} was active ${activeDays}/7 days. Studied ${subjectsStudied} subjects, completed ${recentLessons?.length || 0} lessons. Avg Quiz: ${avgScore}%. Keep it up!`
        
        await sendSMS(profile.parent_phone, report)
        results.push({ id: profile.id, status: 'sent' })
      }
    } catch (err) {
      console.error(`Failed to send weekly report for ${profile.id}:`, err)
      results.push({ id: profile.id, status: 'error' })
    }
  }

  return NextResponse.json({ 
    success: true, 
    processed: profiles.length, 
    sent: results.filter(r => r.status === 'sent').length 
  })
}
