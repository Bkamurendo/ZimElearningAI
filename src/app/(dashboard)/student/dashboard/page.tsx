export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShieldAlert } from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect'
import DashboardClient from './DashboardClient'
import { Button } from '@/components/ui/Button'

export default async function StudentDashboard() {
  const supabase = createClient()
  
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'student') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const { data: studentProfile } = (await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single()) as {
      data: { id: string; zimsec_level: string; grade: string } | null
      error: unknown
    }

    const { data: enrolments } = (await supabase
      .from('student_subjects')
      .select('subject:subjects(name, code, zimsec_level)')
      .eq('student_id', studentProfile?.id ?? '')) as {
      data: { subject: { name: string; code: string; zimsec_level: string } | null }[] | null
      error: unknown
    }

    const subjects = enrolments?.map((e) => e.subject).filter(Boolean) ?? []

    const [
      { count: lessonsCompleted },
      { count: quizzesCompleted },
      { count: topicsMastered },
      { data: _streak },
      { data: notifications },
      { data: recentBadges },
      { data: studyPlan },
      _learningSessions
    ] = await Promise.all([
      supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', studentProfile?.id ?? ''),
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', studentProfile?.id ?? ''),
      supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', studentProfile?.id ?? '').eq('mastery_level', 'mastered'),
      supabase.from('student_streaks').select('current_streak, total_xp').eq('student_id', studentProfile?.id ?? '').single(),
      supabase.from('notifications').select('id, title, message, type, created_at').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(3),
      supabase.from('student_badges').select('badge_name, earned_at').eq('student_id', studentProfile?.id ?? '').order('earned_at', { ascending: false }).limit(3),
      supabase.from('study_plans').select('exam_date').eq('student_id', studentProfile?.id ?? '').single(),
      supabase.from('learning_sessions').select('duration_minutes').eq('user_id', user.id).gte('created_at', new Date().toISOString().split('T')[0]),
    ])

    const learningMinutesToday = (_learningSessions?.data ?? []).reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0)

    // Pending assignments count
    let pendingAssignmentsCount = 0
    if (studentProfile) {
      const { data: subjectIdRows } = await supabase.from('student_subjects').select('subject_id').eq('student_id', studentProfile.id)
      const sIds = (subjectIdRows ?? []).map(r => r.subject_id as string)
      if (sIds.length > 0) {
        const { data: allAssignments } = await supabase.from('assignments').select('id').in('subject_id', sIds)
        const allAIds = (allAssignments ?? []).map(a => a.id as string)
        if (allAIds.length > 0) {
          const { data: submitted } = await supabase.from('assignment_submissions').select('assignment_id').eq('student_id', studentProfile.id).in('assignment_id', allAIds)
          const submittedIds = new Set((submitted ?? []).map(s => s.assignment_id as string))
          pendingAssignmentsCount = allAIds.filter(id => !submittedIds.has(id)).length
        }
      }
    }

    // Continue Learning (Parallelized & Robust)
    const continueItems: any[] = []
    if (studentProfile && subjects.length > 0) {
      const { data: subjectRows } = await supabase
        .from('student_subjects')
        .select('subject_id, subjects(id, name, code)')
        .eq('student_id', studentProfile.id)
        .limit(3)
      
      const sessionTasks = (subjectRows ?? []).map(async (row: any) => {
        const subj = row.subjects
        if (!subj) return null
        
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('subject_id', subj.id)
          .eq('published', true)
          .limit(1)
        
        const course = courses?.[0]
        if (!course) return null
        
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title')
          .eq('course_id', course.id)
          .order('order_index')
          .limit(20)
        
        if (!lessons?.length) return null
        
        const { data: done } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', studentProfile.id)
          .in('lesson_id', lessons.map(l => l.id))
        
        const doneSet = new Set((done ?? []).map(d => d.lesson_id as string))
        const nextLesson = lessons.find(l => !doneSet.has(l.id))
        
        if (nextLesson) {
          return {
            subjectName: subj.name,
            subjectCode: subj.code,
            courseId: course.id,
            courseTitle: course.title,
            lessonId: nextLesson.id,
            lessonTitle: nextLesson.title
          }
        }
        return null
      })
      
      const results = await Promise.all(sessionTasks)
      continueItems.push(...results.filter(Boolean))
    }

    // Daily challenge
    let dailyChallengeCompleted = false
    let dailyChallengeScore: number | null = null
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: todayChallenge } = await supabase.from('daily_challenges').select('id').eq('challenge_date', todayStr).eq('zimsec_level', studentProfile?.zimsec_level ?? 'olevel').single()
      if (todayChallenge) {
        const { data: challengeAttempt } = await supabase.from('daily_challenge_attempts').select('score').eq('challenge_id', todayChallenge.id).eq('user_id', user.id).single()
        if (challengeAttempt) {
          dailyChallengeCompleted = true
          dailyChallengeScore = (challengeAttempt as any).score
        }
      }
    } catch { /* ignored */ }

    // Upcoming exams
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: upcomingExams } = await supabase.from('exam_timetable').select('id, exam_date, paper_number, subjects(name, code)').eq('student_id', studentProfile?.id ?? '').gte('exam_date', todayStr).order('exam_date', { ascending: true }).limit(3)

    // Getting Started checklist signals
    const hasExamDates = (upcomingExams?.length ?? 0) > 0
    const { count: aiMsgCount } = await supabase
      .from('ai_chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const hasUsedMaFundi = (aiMsgCount ?? 0) > 0

    const stats = [
      { label: 'Subjects', value: subjects.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-t-emerald-500' },
      { label: 'Lessons done', value: lessonsCompleted ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-t-blue-500' },
      { label: 'Quizzes done', value: quizzesCompleted ?? 0, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-t-purple-500' },
      { label: 'Topics mastered', value: topicsMastered ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-t-amber-500' },
    ]

    return (
      <DashboardClient 
        user={user}
        profile={profile || {}}
        studentProfile={studentProfile || {}}
        subjects={subjects || []}
        stats={stats || []}
        notifications={notifications || []}
        recentBadges={recentBadges || []}
        continueItems={continueItems || []}
        upcomingExams={upcomingExams || []}
        studyPlan={studyPlan || null}
        pendingAssignmentsCount={pendingAssignmentsCount || 0}
        dailyChallengeCompleted={dailyChallengeCompleted || false}
        dailyChallengeScore={dailyChallengeScore || null}
        learningMinutesToday={learningMinutesToday}
        hasExamDates={hasExamDates}
        hasUsedMaFundi={hasUsedMaFundi}
      />
    )
  } catch (err: any) {
    if (isRedirectError(err)) throw err
    console.error('[StudentDashboard] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50 uppercase font-black">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Scholarship Sync Failed</h2>
        <p className="text-slate-500 max-w-xs uppercase font-bold italic">We encountered a critical error while synchronizing your academic records. Security protocols have blocked access.</p>
        <Link href="/login">
          <Button variant="outline">Re-authenticate Session</Button>
        </Link>
      </div>
    )
  }
}
