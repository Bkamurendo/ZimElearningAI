import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BarChart3,
  Users,
  TrendingUp,
  Zap,
  Brain,
  ArrowLeft,
  BookOpen,
  ClipboardList,
} from 'lucide-react'

export const metadata = { title: 'Analytics — School Admin' }

export default async function SchoolAdminAnalyticsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, school_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'school_admin') redirect('/login')
  if (!profile?.school_id) redirect('/login')

  const schoolId = profile.school_id as string

  // ── Fetch base stats in parallel ─────────────────────────────
  const [
    { count: totalStudents },
    { count: totalTeachers },
    { data: aiData },
    { data: topStudentsRaw },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('role', 'student'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('role', 'teacher'),
    // Sum ai_requests_today across all profiles in this school
    supabase
      .from('profiles')
      .select('ai_requests_today')
      .eq('school_id', schoolId),
    // Top 5 most active students today
    supabase
      .from('profiles')
      .select('id, full_name, email, ai_requests_today')
      .eq('school_id', schoolId)
      .eq('role', 'student')
      .gt('ai_requests_today', 0)
      .order('ai_requests_today', { ascending: false })
      .limit(5),
  ])

  const aiRequestsToday = (aiData ?? []).reduce(
    (sum, r) => sum + (Number(r.ai_requests_today) || 0),
    0
  )

  // ── Try to get lesson progress count (school-scoped via student_profiles) ──
  let lessonProgressCount: number | null = null
  try {
    // student_profiles links user_id → school_id indirectly via profiles
    // We join lesson_progress → student_profiles → profiles
    const { count } = await supabase
      .from('lesson_progress')
      .select(
        'id, student_profiles!inner(profiles!inner(school_id))',
        { count: 'exact', head: true }
      )
      .eq('student_profiles.profiles.school_id', schoolId)
    lessonProgressCount = count
  } catch {
    // table may not exist or join may not match schema – silently skip
  }

  // ── Try to get quiz attempts count (school-scoped) ──
  let quizAttemptsCount: number | null = null
  try {
    const { count } = await supabase
      .from('quiz_attempts')
      .select(
        'id, student_profiles!inner(profiles!inner(school_id))',
        { count: 'exact', head: true }
      )
      .eq('student_profiles.profiles.school_id', schoolId)
    quizAttemptsCount = count
  } catch {
    // silently skip
  }

  const topStudents = topStudentsRaw ?? []
  const maxAiToday = topStudents[0]?.ai_requests_today ?? 1

  // ── Stat cards definition ──────────────────────────────────
  const stats = [
    {
      label: 'Total Students',
      value: (totalStudents ?? 0).toLocaleString(),
      icon: Users,
      border: 'border-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Total Teachers',
      value: (totalTeachers ?? 0).toLocaleString(),
      icon: TrendingUp,
      border: 'border-teal-500',
      bg: 'bg-teal-50',
      text: 'text-teal-600',
    },
    {
      label: 'AI Requests Today',
      value: aiRequestsToday.toLocaleString(),
      icon: Zap,
      border: 'border-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Lessons Completed',
      value:
        lessonProgressCount !== null
          ? lessonProgressCount.toLocaleString()
          : '—',
      icon: BookOpen,
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Quiz Attempts',
      value:
        quizAttemptsCount !== null
          ? quizAttemptsCount.toLocaleString()
          : '—',
      icon: ClipboardList,
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'Active Students Today',
      value: topStudents.length.toLocaleString(),
      icon: Brain,
      border: 'border-rose-500',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/school-admin/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                School Analytics
              </h1>
              <p className="text-emerald-200 text-sm">
                Activity and progress insights for your school
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, border, bg, text }) => (
            <div
              key={label}
              className={`bg-white rounded-2xl shadow-sm border-t-4 ${border} p-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {label}
                </p>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={15} className={text} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Top active students today ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Top 5 Most Active Students Today
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by AI requests made today
              </p>
            </div>
          </div>

          {topStudents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Zap size={28} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm">
                No AI activity recorded today
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Rank
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Student
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      AI Requests Today
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topStudents.map((s, i) => {
                    const initials = (s.full_name ?? 'S')
                      .split(' ')
                      .map((n: string) => n[0] ?? '')
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                    const requests = Number(s.ai_requests_today) || 0
                    const pct = Math.round(
                      (requests / Math.max(Number(maxAiToday), 1)) * 100
                    )
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0
                                ? 'bg-amber-400 text-white'
                                : i === 1
                                ? 'bg-slate-300 text-slate-700'
                                : i === 2
                                ? 'bg-orange-300 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                              {initials || 'S'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {s.full_name ?? '—'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {s.email ?? ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                            <Zap size={11} />
                            {requests}
                          </span>
                        </td>
                        <td className="px-6 py-4 w-48">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Summary section ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-emerald-600" />
            </div>
            <h2 className="font-bold text-slate-900">School Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {totalStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Enrolled Students</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {totalTeachers ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Active Teachers</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {aiRequestsToday}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">AI Requests Today</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {quizAttemptsCount !== null ? quizAttemptsCount : '—'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Total Quiz Attempts</p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Data reflects school-scoped activity only. AI request counts reset
              daily at midnight.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
