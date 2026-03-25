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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect(`/${profile?.role}/dashboard`)

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
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div
          className="relative text-white rounded-2xl p-6 sm:p-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981, #0d9488)' }}
        >
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/3 translate-x-1/4"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">{greeting},</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  🎓 {firstName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {studentProfile?.grade}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {levelLabel}
                  </span>
                  {streak && streak.current_streak > 0 && (
                    <span className="inline-flex items-center gap-1 bg-orange-400/30 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      🔥 {streak.current_streak} day streak
                    </span>
                  )}
                </div>
              </div>

              {streak && streak.total_xp > 0 && (
                <div className="flex-shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center hidden sm:block border border-white/20">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Zap size={16} className="text-yellow-300" />
                    <p className="text-2xl font-bold">{streak.total_xp.toLocaleString()}</p>
                  </div>
                  <p className="text-emerald-100 text-xs mt-0.5 font-medium">XP earned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exam Countdown */}
        {studyPlan?.exam_date && (() => {
          const examDate = new Date(studyPlan.exam_date)
          const today = new Date()
          const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86400000))
          const urgency = daysLeft <= 14 ? 'red' : daysLeft <= 30 ? 'amber' : 'emerald'
          const colors = {
            red: { bg: 'from-red-500 to-rose-600', pill: 'bg-red-400/30', text: '🚨 Exam soon!' },
            amber: { bg: 'from-amber-500 to-orange-500', pill: 'bg-amber-400/30', text: '⏰ Keep studying!' },
            emerald: { bg: 'from-emerald-500 to-teal-600', pill: 'bg-emerald-400/30', text: '📅 On track!' },
          }[urgency]
          return (
            <div className={`relative text-white rounded-2xl px-6 py-5 overflow-hidden bg-gradient-to-r ${colors.bg} flex items-center justify-between gap-4`}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="relative">
                <p className="text-white/80 text-xs font-medium mb-0.5">ZIMSEC Exam Countdown</p>
                <p className="text-2xl font-bold">{daysLeft} days left</p>
                <p className="text-white/70 text-xs mt-0.5">{examDate.toLocaleDateString('en-ZW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="relative flex-shrink-0 text-right">
                <div className={`inline-flex items-center gap-1.5 ${colors.pill} backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold`}>
                  {colors.text}
                </div>
                <p className="text-white/60 text-xs mt-2">
                  {daysLeft > 0 ? `${Math.floor(daysLeft / 7)}w ${daysLeft % 7}d` : 'Exam day!'}
                </p>
              </div>
            </div>
          )
        })()}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, border }, idx) => (
            <div
              key={label}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 border-t-4 ${border} animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${color} animate-count-up`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent badges */}
        {(recentBadges?.length ?? 0) > 0 && (
          <div className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a, #fef3c7)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-sm">
                <Trophy size={15} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-amber-900">Recent Achievements</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentBadges!.map((b, i) => (
                <span
                  key={i}
                  className="text-xs bg-white/80 backdrop-blur-sm border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full font-semibold shadow-sm"
                >
                  🏅 {b.badge_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Continue Learning */}
        {continueItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Continue Learning</h2>
            </div>
            <div className="space-y-2">
              {continueItems.map(item => (
                <Link key={item.lessonId} href={`/student/lessons/${item.lessonId}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-300 hover:shadow-md transition-all shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <PlayCircle size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium truncate">{item.subjectName} · {item.courseTitle}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.lessonTitle}</p>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming ZIMSEC Exams */}
        {(upcomingExams?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck size={13} /> Upcoming Exams
              </h2>
              <Link href="/student/exam-timetable" className="text-xs text-teal-600 font-semibold hover:text-teal-700 transition flex items-center gap-1">
                Manage <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingExams!.map(exam => {
                const subj = exam.subjects as unknown as { name: string; code: string } | null
                const days = Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / 86400000)
                const chipCls = days <= 7 ? 'bg-red-100 text-red-700' : days <= 14 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                return (
                  <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{subj?.name ?? 'Exam'}</p>
                        <p className="text-xs text-gray-500">Paper {exam.paper_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(exam.exam_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-0.5 ${chipCls}`}>
                        <Clock size={9} />{days <= 0 ? 'Today' : `${days}d`}
                      </span>
                    </div>
                    <Link href="/student/ai-workspace" className="mt-2 flex items-center gap-1 text-xs text-purple-600 font-semibold hover:text-purple-700 transition">
                      <Sparkles size={11} /> Prepare with MaFundi
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                href: '/student/assignments',
                label: 'Assignments',
                desc: pendingAssignmentsCount > 0 ? `${pendingAssignmentsCount} pending` : 'View all',
                icon: ClipboardList,
                gradient: 'from-orange-500 to-amber-500',
                shadow: 'shadow-orange-200',
                badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : null,
              },
              {
                href: '/student/progress',
                label: 'My Progress',
                desc: 'Knowledge profile',
                icon: BarChart3,
                gradient: 'from-emerald-500 to-teal-600',
                shadow: 'shadow-emerald-200',
                badge: null,
              },
              {
                href: '/student/study-planner',
                label: 'Study Planner',
                desc: 'AI revision schedule',
                icon: CalendarDays,
                gradient: 'from-blue-500 to-indigo-600',
                shadow: 'shadow-blue-200',
                badge: null,
              },
              {
                href: subjects[0] ? `/student/quiz/${subjects[0].code}` : '#',
                label: 'Quick Quiz',
                desc: 'AI-generated MCQ',
                icon: Brain,
                gradient: 'from-purple-500 to-violet-600',
                shadow: 'shadow-purple-200',
                badge: null,
              },
            ].map(({ href, label, desc, icon: Icon, gradient, shadow, badge }) => (
              <Link
                key={label}
                href={href}
                className="group relative bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-sm"
              >
                {badge && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                <div
                  className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-md ${shadow} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {notifCount > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bell size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Notifications</h2>
                <span className="text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{notifCount}</span>
              </div>
              <Link href="/student/notifications" className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications!.map((n) => (
                <div key={n.id} className="flex gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Subjects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-900">My Subjects</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-medium">{subjects.length} enrolled</span>
              <Link href="/student/subjects" className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 text-sm">No subjects enrolled yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete onboarding to pick your subjects</p>
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.slice(0, 6).map((s, idx) => (
                  <Link
                    key={s.code}
                    href={`/student/subjects/${s.code}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div
                      className={`w-11 h-11 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      <span className="text-white text-xs font-bold">
                        {s.code.split('-')[1]?.slice(0, 2).toUpperCase() ?? s.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.code}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
              {subjects.length > 6 && (
                <Link href="/student/subjects" className="mt-3 flex items-center justify-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition py-2">
                  +{subjects.length - 6} more subjects <ChevronRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
