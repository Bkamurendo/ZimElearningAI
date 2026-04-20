export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subjectCode, topic, score, total, questions } = await req.json()

  // Security: validate numeric inputs to prevent gamification score corruption
  const safeScore = typeof score === 'number' ? Math.max(0, Math.floor(score)) : 0
  const safeTotal = typeof total === 'number' ? Math.max(1, Math.min(Math.floor(total), 200)) : 1
  if (safeScore > safeTotal) {
    return NextResponse.json({ error: 'Invalid score: score cannot exceed total' }, { status: 400 })
  }

  // Get student profile
  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  // Get subject id
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', subjectCode)
    .single()
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  // Save quiz attempt
  await supabase.from('quiz_attempts').insert({
    student_id: student.id,
    subject_id: subject.id,
    topic: String(topic ?? '').slice(0, 200),
    score: safeScore,
    total: safeTotal,
    questions: Array.isArray(questions) ? questions.slice(0, 100) : [],
  })

  // Update topic mastery
  const pct = safeTotal > 0 ? safeScore / safeTotal : 0
  const mastery =
    pct >= 0.85 ? 'mastered' : pct >= 0.65 ? 'competent' : pct >= 0.35 ? 'learning' : 'not_started'

  await supabase.from('topic_mastery').upsert(
    { student_id: student.id, subject_id: subject.id, topic, mastery_level: mastery, updated_at: new Date().toISOString() },
    { onConflict: 'student_id,topic' }
  )

  // Update streak and XP
  const today = new Date().toISOString().slice(0, 10)
  const xpEarned = Math.round((safeScore / safeTotal) * 50)

  const { data: streak } = await supabase
    .from('student_streaks')
    .select('*')
    .eq('student_id', student.id)
    .single()

  if (!streak) {
    await supabase.from('student_streaks').insert({
      student_id: student.id,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      total_xp: xpEarned,
    })
  } else {
    const lastDate = streak.last_activity_date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const newStreak =
      lastDate === today
        ? streak.current_streak
        : lastDate === yesterdayStr
        ? streak.current_streak + 1
        : 1

    await supabase
      .from('student_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak),
        last_activity_date: today,
        total_xp: streak.total_xp + xpEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', student.id)
  }

  // Award badges
  await checkAndAwardBadges(supabase, student.id, score, total, pct)

  return NextResponse.json({ mastery, xpEarned })
}

async function checkAndAwardBadges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  studentId: string,
  score: number,
  total: number,
  pct: number
) {
  const badges: { badge_type: string; badge_name: string }[] = []

  if (pct === 1) badges.push({ badge_type: 'perfect_score', badge_name: 'Perfect Score!' })
  if (pct >= 0.85) badges.push({ badge_type: 'high_achiever', badge_name: 'High Achiever' })

  // Count total attempts
  const { count } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)

  if (count === 1) badges.push({ badge_type: 'first_quiz', badge_name: 'First Quiz Complete!' })
  if (count === 10) badges.push({ badge_type: 'quiz_10', badge_name: '10 Quizzes Done' })
  if (count === 50) badges.push({ badge_type: 'quiz_50', badge_name: '50 Quizzes Done' })

  for (const badge of badges) {
    await supabase
      .from('student_badges')
      .upsert({ student_id: studentId, ...badge }, { onConflict: 'student_id,badge_type' })
  }
}
