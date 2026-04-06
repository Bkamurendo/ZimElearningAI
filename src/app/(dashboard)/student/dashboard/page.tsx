import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BookOpen,
  Brain,
  BarChart3,
  CalendarDays,
  Star,
  CheckCircle2,
  Zap,
  ChevronRight,
  Trophy,
  Bell,
  ClipboardList,
  PlayCircle,
  CalendarCheck,
  Clock,
  Sparkles,
} from 'lucide-react'
import PassPulseRings from './PassPulseRings'

const SUBJECT_COLORS = [
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-red-400 to-red-600',
]

export default async function StudentDashboard() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
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

  type SubjectRow = { name: string; code: string; zimsec_level: string } | null
  const { data: enrolments } = (await supabase
    .from('student_subjects')
    .select('subject:subjects(name, code, zimsec_level)')
    .eq('student_id', studentProfile?.id ?? '')) as {
    data: { subject: SubjectRow }[] | null
    error: unknown
  }

  const subjects = (
    enrolments?.map((e) => e.subject).filter(Boolean) ?? []
  ) as NonNullable<SubjectRow>[]

  const { count: lessonsCompleted } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentProfile?.id ?? '')

  const { count: quizzesCompleted } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentProfile?.id ?? '')

  const { count: topicsMastered } = await supabase
    .from('topic_mastery')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentProfile?.id ?? '')
    .eq('mastery_level', 'mastered')

  const { data: streak } = (await supabase
    .from('student_streaks')
    .select('current_streak, total_xp')
    .eq('student_id', studentProfile?.id ?? '')
    .single()) as {
    data: { current_streak: number; total_xp: number } | null
    error: unknown
  }

  const { data: notifications } = (await supabase
    .from('notifications')
    .select('id, title, message, type, created_at')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(3)) as {
    data:
      | { id: string; title: string; message: string; type: string; created_at: string }[]
      | null
    error: unknown
  }

  const { data: recentBadges } = (await supabase
    .from('student_badges')
    .select('badge_name, earned_at')
    .eq('student_id', studentProfile?.id ?? '')
    .order('earned_at', { ascending: false })
    .limit(3)) as {
    data: { badge_name: string; earned_at: string }[] | null
    error: unknown
  }

  // Pending assignments count
  const subjectIds = subjects.map(s => s.code)
  let pendingAssignmentsCount = 0
  if (subjectIds.length > 0 && studentProfile) {
    const { data: subjectIdRows } = await supabase
      .from('student_subjects')
      .select('subject_id')
      .eq('student_id', studentProfile.id)
    const sIds = (subjectIdRows ?? []).map(r => r.subject_id as string)
    if (sIds.length > 0) {
      const { data: allAssignments } = await supabase
        .from('assignments')
        .select('id')
        .in('subject_id', sIds)
      const allAIds = (allAssignments ?? []).map(a => a.id as string)
      if (allAIds.length > 0) {
        const { data: submitted } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', studentProfile.id)
          .in('assignment_id', allAIds)
        const submittedIds = new Set((submitted ?? []).map(s => s.assignment_id as string))
        pendingAssignmentsCount = allAIds.filter(id => !submittedIds.has(id)).length
      }
    }
  }

  // Continue Learning — first incomplete lesson per enrolled subject
  type ContinueItem = {
    subjectName: string
    subjectCode: string
    courseId: string
    courseTitle: string
    lessonId: string
    lessonTitle: string
  }
  const continueItems: ContinueItem[] = []
  if (studentProfile && subjects.length > 0) {
    const { data: subjectRows } = await supabase
      .from('student_subjects')
      .select('subject_id, subjects(id, name, code)')
      .eq('student_id', studentProfile.id)
      .limit(6) as {
      data: { subject_id: string; subjects: { id: string; name: string; code: string } | null }[] | null
      error: unknown
    }

    for (const row of (subjectRows ?? []).slice(0, 6)) {
      if (continueItems.length >= 3) break
      const subj = row.subjects as unknown as { id: string; name: string; code: string } | null
      if (!subj) continue

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('subject_id', subj.id)
        .eq('published', true)
        .limit(3)

      for (const course of (courses ?? [])) {
        if (continueItems.length >= 3) break
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, order_index')
          .eq('course_id', course.id)
          .order('order_index')

        if (!lessons?.length) continue

        const lessonIds = lessons.map(l => l.id)
        const { data: done } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', studentProfile.id)
          .in('lesson_id', lessonIds)

        const doneSet = new Set((done ?? []).map(d => d.lesson_id as string))
        const nextLesson = lessons.find(l => !doneSet.has(l.id))
        if (nextLesson) {
          continueItems.push({
            subjectName: subj.name,
            subjectCode: subj.code,
            courseId: course.id,
            courseTitle: course.title,
            lessonId: nextLesson.id,
            lessonTitle: nextLesson.title,
          })
        }
      }
    }
  }

  // Daily challenge status
  let dailyChallengeCompleted = false
  let dailyChallengeScore: number | null = null
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: todayChallenge } = await supabase
      .from('daily_challenges')
      .select('id')
      .eq('challenge_date', todayStr)
      .eq('zimsec_level', studentProfile?.zimsec_level ?? 'olevel')
      .single()

    if (todayChallenge) {
      const { data: challengeAttempt } = await supabase
        .from('daily_challenge_attempts')
        .select('score')
        .eq('challenge_id', todayChallenge.id)
        .eq('user_id', user.id)
        .single() as { data: { score: number } | null; error: unknown }

      if (challengeAttempt) {
        dailyChallengeCompleted = true
        dailyChallengeScore = challengeAttempt.score
      }
    }
  } catch { /* daily_challenges table may not exist yet */ }

  // Upcoming ZIMSEC exams from timetable
  const todayStr = new Date().toISOString().split('T')[0]
  type ExamRow = { id: string; exam_date: string; paper_number: string; subjects: { name: string; code: string } | null }
  const { data: upcomingExams } = await supabase
    .from('exam_timetable')
    .select('id, exam_date, paper_number, subjects(name, code)')
    .eq('student_id', studentProfile?.id ?? '')
    .gte('exam_date', todayStr)
    .order('exam_date', { ascending: true })
    .limit(3) as { data: ExamRow[] | null; error: unknown }

  // Get exam date from study plan
  const { data: studyPlan } = await supabase
    .from('study_plans')
    .select('exam_date')
    .eq('student_id', studentProfile?.id ?? '')
    .single()

  const levelLabel =
    studentProfile?.zimsec_level === 'primary'
      ? 'Primary'
      : studentProfile?.zimsec_level === 'olevel'
        ? 'O-Level'
        : 'A-Level'

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    {
      label: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-t-emerald-500',
    },
    {
      label: 'Lessons done',
      value: lessonsCompleted ?? 0,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-t-blue-500',
    },
    {
      label: 'Quizzes done',
      value: quizzesCompleted ?? 0,
      icon: Brain,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-t-purple-500',
    },
    {
      label: 'Topics mastered',
      value: topicsMastered ?? 0,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-t-amber-500',
    },
  ]

  const notifCount = notifications?.length ?? 0

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
      />
    )
  } catch (error) {
    console.error('[StudentDashboard] Runtime error:', error)
    // Return a safe error UI or redirect to login
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
        <p className="text-slate-500">We couldn't load your dashboard. Please try refreshing.</p>
        <Link href="/login">
          <Button>Back to Login</Button>
        </Link>
      </div>
    )
  }
}

import DashboardClient from './DashboardClient'
import { Button } from '@/components/ui/Button'

