/**
 * /admin/engagement
 *
 * Real user engagement analytics drawn exclusively from tables that exist:
 *   profiles  — plan, ai_requests_today, ai_quota_reset_at, created_at, role
 *   payments  — paid conversion data
 *   student_subjects — subject enrolment counts
 *   subjects  — subject names
 *
 * All other tables (lesson_progress, quiz_attempts, etc.) are not yet
 * created, so we do not query them.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft, Activity, Zap, Users, TrendingUp,
  CreditCard, BookOpen, Clock,
} from 'lucide-react'

type ProfileRow = {
  id: string
  role: string
  plan: string
  ai_requests_today: number
  ai_quota_reset_at: string | null
  created_at: string
  pro_expires_at: string | null
}

type SubjectEnrolRow = { subject_id: string }
type SubjectRow = { id: string; name: string; zimsec_level: string }
type PaymentRow = { user_id: string; created_at: string }

export default async function AdminEngagementPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const now = new Date()
  const todayStart    = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekAgo       = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [profilesRes, enrolRes, subjectsRes, recentPaymentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, plan, ai_requests_today, ai_quota_reset_at, created_at, pro_expires_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('student_subjects')
      .select('subject_id'),
    supabase
      .from('subjects')
      .select('id, name, zimsec_level'),
    supabase
      .from('payments')
      .select('user_id, created_at')
      .eq('status', 'paid')
      .gte('created_at', weekAgo.toISOString()),
  ])

  const profiles       = (profilesRes.data       ?? []) as ProfileRow[]
  const enrolRows      = (enrolRes.data           ?? []) as SubjectEnrolRow[]
  const subjectsList   = (subjectsRes.data        ?? []) as SubjectRow[]
  const recentPayments = (recentPaymentsRes.data  ?? []) as PaymentRow[]

  const students = profiles.filter(p => p.role === 'student')
  const totalStudents = students.length
  const totalUsers    = profiles.length

  // ── Today ─────────────────────────────────────────────────────────────────
  const aiActiveToday  = students.filter(p => (p.ai_requests_today ?? 0) > 0).length
  const newSignupsToday = profiles.filter(p => new Date(p.created_at) >= todayStart).length
  const totalAiReqsToday = students.reduce((s, p) => s + (p.ai_requests_today ?? 0), 0)
  const atLimitToday   = students.filter(p => {
    const limit = (p.plan === 'pro' || p.plan === 'elite') ? 9999 : 10
    return (p.ai_requests_today ?? 0) >= limit
  }).length

  // ── This week ─────────────────────────────────────────────────────────────
  const newSignupsWeek  = profiles.filter(p => new Date(p.created_at) >= weekAgo).length
  const paidThisWeek    = recentPayments.length

  // ── Engagement segments ───────────────────────────────────────────────────
  // ai_quota_reset_at is updated when a student makes an AI request on a new day.
  // Recent signups (<7 days) may appear "active" even without AI use — that's expected.
  const activeStudents  = students.filter(p =>
    p.ai_quota_reset_at && new Date(p.ai_quota_reset_at) >= weekAgo
  ).length
  const atRiskStudents  = students.filter(p => {
    if (!p.ai_quota_reset_at) return false
    const d = new Date(p.ai_quota_reset_at)
    return d < weekAgo && d >= thirtyDaysAgo
  }).length
  const dormantStudents = students.filter(p =>
    !p.ai_quota_reset_at || new Date(p.ai_quota_reset_at) < thirtyDaysAgo
  ).length

  // ── Plan distribution ─────────────────────────────────────────────────────
  const planCounts = {
    free:    profiles.filter(p => p.plan === 'free').length,
    starter: profiles.filter(p => p.plan === 'starter').length,
    pro:     profiles.filter(p => p.plan === 'pro').length,
    elite:   profiles.filter(p => p.plan === 'elite').length,
  }
  const paidUsers = planCounts.starter + planCounts.pro + planCounts.elite
  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0'

  // ── AI usage distribution ─────────────────────────────────────────────────
  const heavyAiUsers  = students.filter(p => (p.ai_requests_today ?? 0) >= 8).length
  const lightAiUsers  = students.filter(p => (p.ai_requests_today ?? 0) > 0 && (p.ai_requests_today ?? 0) < 8).length
  const noAiToday     = students.filter(p => (p.ai_requests_today ?? 0) === 0).length

  // ── Weekly signup chart (7 days) ──────────────────────────────────────────
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const signupsByDay = new Map<string, number>(days.map(d => [d, 0]))
  for (const p of profiles) {
    const day = p.created_at.slice(0, 10)
    if (signupsByDay.has(day)) signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1)
  }
  const maxDaySignups = Math.max(...Array.from(signupsByDay.values()), 1)
  const todayKey = now.toISOString().slice(0, 10)

  // ── Top enrolled subjects ─────────────────────────────────────────────────
  const subjectEnrolCount = new Map<string, number>()
  for (const row of enrolRows) {
    subjectEnrolCount.set(row.subject_id, (subjectEnrolCount.get(row.subject_id) ?? 0) + 1)
  }
  const topSubjects = subjectsList
    .map(s => ({ ...s, count: subjectEnrolCount.get(s.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const maxSubjectCount = topSubjects[0]?.count || 1

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-1">
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Engagement Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live student activity — AI usage, signups &amp; plan distribution</p>
        </div>

        {/* ── Today snapshot ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Using AI Today',
                value: aiActiveToday,
                sub: `${totalStudents > 0 ? Math.round((aiActiveToday / totalStudents) * 100) : 0}% of students`,
                icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-t-amber-500',
              },
              {
                label: 'AI Requests Sent',
                value: totalAiReqsToday,
                sub: `avg ${aiActiveToday > 0 ? (totalAiReqsToday / aiActiveToday).toFixed(1) : 0} per active student`,
                icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-t-indigo-500',
              },
              {
                label: 'New Signups',
                value: newSignupsToday,
                sub: 'registered today',
                icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-t-emerald-500',
              },
              {
                label: 'At Daily Limit',
                value: atLimitToday,
                sub: 'upgrade candidates',
                icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-t-red-500',
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 border-t-4 ${border}`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── This week ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Last 7 Days</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New Users',      value: newSignupsWeek,  icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Paid This Week', value: paidThisWeek,    icon: CreditCard,  color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
              { label: 'Active Students',value: activeStudents,  icon: Zap,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
              { label: 'Enrolled Subs',  value: enrolRows.length, icon: BookOpen,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Daily signup chart ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Daily Signups — Last 7 Days</h2>
              <p className="text-xs text-gray-400">New user registrations per day</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {days.map((day) => {
              const count = signupsByDay.get(day) ?? 0
              const pct = (count / maxDaySignups) * 100
              const isToday = day === todayKey
              const label = new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className={`text-xs w-16 flex-shrink-0 font-medium ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {label}{isToday ? ' ●' : ''}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    {count > 0 && (
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right tabular-nums">
                    {count > 0 ? count : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Plan distribution ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Plan Distribution</h2>
                <p className="text-xs text-gray-400">{conversionRate}% paid conversion · {totalUsers} users total</p>
              </div>
            </div>
            <div className="space-y-3">
              {([
                { label: 'Free',    count: planCounts.free,    color: 'bg-gray-400',    textColor: 'text-gray-700'    },
                { label: 'Starter ($2)', count: planCounts.starter, color: 'bg-blue-400', textColor: 'text-blue-700' },
                { label: 'Pro ($5)', count: planCounts.pro,    color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { label: 'Elite ($8)', count: planCounts.elite, color: 'bg-purple-500', textColor: 'text-purple-700' },
              ] as const).map(({ label, count, color, textColor }) => {
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${textColor}`}>{label}</span>
                      <span className="text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-400">
              <span>Paid users: <span className="font-bold text-indigo-600">{paidUsers}</span></span>
              <span>Free users: <span className="font-bold text-gray-600">{planCounts.free}</span></span>
            </div>
          </div>

          {/* AI Usage Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">AI Usage Today</h2>
                <p className="text-xs text-gray-400">{totalAiReqsToday.toLocaleString()} total requests sent</p>
              </div>
            </div>
            <div className="space-y-3">
              {([
                { label: 'Heavy (8+ requests)', count: heavyAiUsers,  color: 'bg-amber-500',   textColor: 'text-amber-700'   },
                { label: 'Light (1–7 requests)', count: lightAiUsers, color: 'bg-blue-400',    textColor: 'text-blue-700'    },
                { label: 'No activity today',   count: noAiToday,     color: 'bg-gray-300',    textColor: 'text-gray-500'    },
              ] as const).map(({ label, count, color, textColor }) => {
                const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${textColor}`}>{label}</span>
                      <span className="text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
              {atLimitToday} student{atLimitToday !== 1 ? 's' : ''} at daily limit — prime upgrade candidates
            </p>
          </div>
        </div>

        {/* ── Engagement Segments ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Student Engagement Segments</h2>
              <p className="text-xs text-gray-400">
                Based on last AI-tutor activity · {totalStudents} students total
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Active',   sublabel: 'AI used last 7 days',   count: activeStudents,  bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700', bar: 'bg-emerald-500' },
              { label: 'At Risk',  sublabel: 'No activity 7–30 days', count: atRiskStudents,  bg: 'bg-amber-50',   border: 'border-amber-200',   color: 'text-amber-700',   bar: 'bg-amber-400'   },
              { label: 'Dormant',  sublabel: 'No activity 30+ days',  count: dormantStudents, bg: 'bg-red-50',     border: 'border-red-200',     color: 'text-red-700',     bar: 'bg-red-400'     },
            ] as const).map(({ label, sublabel, count, bg, border, color, bar }) => {
              const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
              return (
                <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className={`text-xs font-semibold ${color} mt-0.5`}>{label}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{sublabel}</p>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-2.5">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{pct}% of students</p>
                </div>
              )
            })}
          </div>
          <Link
            href="/admin/cohort"
            className="mt-4 flex items-center justify-between px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition text-xs font-medium text-indigo-700"
          >
            <span>View full cohort analysis &amp; conversion funnel</span>
            <span>→</span>
          </Link>
        </div>

        {/* ── Top enrolled subjects ─────────────────────────────────── */}
        {topSubjects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Most Enrolled Subjects</h2>
                <p className="text-xs text-gray-400">{enrolRows.length.toLocaleString()} total enrolments across {subjectsList.length} subjects</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {topSubjects.map((subject) => {
                const pct = (subject.count / maxSubjectCount) * 100
                const levelColor = subject.zimsec_level === 'primary'
                  ? 'text-emerald-600' : subject.zimsec_level === 'olevel'
                  ? 'text-blue-600' : 'text-purple-600'
                return (
                  <div key={subject.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-700 w-36 flex-shrink-0 truncate">{subject.name}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-20 flex-shrink-0 justify-end">
                      <span className="text-xs font-bold text-gray-700 tabular-nums">{subject.count}</span>
                      <span className={`text-[10px] uppercase font-semibold ${levelColor}`}>
                        {subject.zimsec_level === 'primary' ? 'Pri' : subject.zimsec_level === 'olevel' ? 'O' : 'A'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Activity size={14} className="text-gray-300 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Live database counts — refresh to see latest activity.
            AI usage resets daily at midnight UTC.
          </p>
          <Clock size={14} className="text-gray-300 flex-shrink-0 ml-auto" />
          <span className="text-xs text-gray-300">
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  )
}
