import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BookOpen,
  Brain,
  BarChart3,
  CalendarDays,
  FileText,
  Star,
  CheckCircle2,
  Zap,
  ChevronRight,
} from 'lucide-react'

const SUBJECT_COLORS = [
  'from-green-400 to-green-600',
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

  const levelLabel =
    studentProfile?.zimsec_level === 'primary'
      ? 'Primary Level'
      : studentProfile?.zimsec_level === 'olevel'
        ? 'O-Level'
        : 'A-Level'

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'

  const stats = [
    {
      label: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Lessons done',
      value: lessonsCompleted ?? 0,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Quizzes done',
      value: quizzesCompleted ?? 0,
      icon: Brain,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Topics mastered',
      value: topicsMastered ?? 0,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white rounded-2xl p-6 sm:p-8 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium mb-1">Good day,</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{firstName}!</h1>
                <p className="mt-1 text-green-200 text-sm">
                  {studentProfile?.grade} &bull; {levelLabel}
                </p>
              </div>
              {streak && streak.total_xp > 0 && (
                <div className="flex-shrink-0 bg-white/10 rounded-xl px-4 py-3 text-center hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Zap size={16} className="text-yellow-300" />
                    <p className="text-xl font-bold">{streak.total_xp}</p>
                  </div>
                  <p className="text-green-200 text-xs mt-0.5">XP earned</p>
                </div>
              )}
            </div>

            {streak && streak.current_streak > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                <span>🔥</span>
                <span className="font-semibold">{streak.current_streak} day streak</span>
                <span className="text-green-200">— keep it up!</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent badges */}
        {(recentBadges?.length ?? 0) > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏅</span>
              <h2 className="text-sm font-semibold text-amber-800">Recent Achievements</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentBadges!.map((b, i) => (
                <span
                  key={i}
                  className="text-xs bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full font-medium shadow-sm"
                >
                  {b.badge_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                href: '/student/progress',
                label: 'My Progress',
                desc: 'Knowledge profile',
                icon: BarChart3,
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                border: 'hover:border-green-300 hover:bg-green-50',
              },
              {
                href: '/student/study-planner',
                label: 'Study Planner',
                desc: 'AI revision schedule',
                icon: CalendarDays,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                border: 'hover:border-blue-300 hover:bg-blue-50',
              },
              {
                href: subjects[0] ? `/student/quiz/${subjects[0].code}` : '#',
                label: 'Quick Quiz',
                desc: 'AI-generated MCQ',
                icon: Brain,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                border: 'hover:border-purple-300 hover:bg-purple-50',
              },
              {
                href: subjects[0] ? `/student/past-papers/${subjects[0].code}` : '#',
                label: 'Past Papers',
                desc: 'AI-marked practice',
                icon: FileText,
                iconBg: 'bg-indigo-100',
                iconColor: 'text-indigo-600',
                border: 'hover:border-indigo-300 hover:bg-indigo-50',
              },
            ].map(({ href, label, desc, icon: Icon, iconBg, iconColor, border }) => (
              <Link
                key={label}
                href={href}
                className={`bg-white rounded-2xl border border-gray-100 p-4 transition-all duration-150 shadow-sm group ${border}`}
              >
                <div
                  className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3 transition-all`}
                >
                  <Icon size={20} className={iconColor} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {(notifications?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Notifications ({notifications!.length})
            </h2>
            <div className="space-y-2">
              {notifications!.map((n) => (
                <div key={n.id} className="flex gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Subjects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">My Subjects</h2>
            <span className="text-xs text-gray-400 font-medium">{subjects.length} enrolled</span>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-600 text-sm">No subjects enrolled yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete onboarding to pick your subjects</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((s, idx) => (
                <Link
                  key={s.code}
                  href={`/student/subjects/${s.code}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                >
                  <div
                    className={`w-11 h-11 bg-gradient-to-br ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <span className="text-white text-xs font-bold">
                      {s.code.split('-')[1]?.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.code}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

