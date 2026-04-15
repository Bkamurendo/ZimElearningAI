/**
 * /admin/engagement
 *
 * Real-time user engagement analytics.
 * Pulls live counts from lesson_progress, quiz_attempts, ai_chat_messages,
 * student_streaks, topic_mastery, and student_badges — no fake numbers.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft, Activity, BookOpen, Brain, Zap, Trophy,
  TrendingUp, Users, Star, Clock, Target, Flame,
} from 'lucide-react'

export default async function AdminEngagementPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // ── Batch 1: Count queries (all parallelised) ─────────────────
  const [
    lessonsTodayRes, quizzesTodayRes, aiMsgsTodayRes, badgesTodayRes,
    lessonsWeekRes,  quizzesWeekRes,  aiMsgsWeekRes,  badgesWeekRes,
    totalLessonsRes, totalQuizzesRes, totalAiMsgsRes, totalBadgesRes,
    masteredRes, learningRes, practicingRes,
    activeStreaksRes, studentCountRes,
  ] = await Promise.all([
    // Today
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).gte('completed_at', todayStart.toISOString()),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('ai_chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).eq('role', 'user'),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }).gte('earned_at', todayStart.toISOString()),
    // This week
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).gte('completed_at', weekAgo.toISOString()),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    supabase.from('ai_chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()).eq('role', 'user'),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }).gte('earned_at', weekAgo.toISOString()),
    // All-time
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
    supabase.from('ai_chat_messages').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }),
    // Topic mastery distribution
    supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('mastery_level', 'mastered'),
    supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('mastery_level', 'learning'),
    supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('mastery_level', 'practicing'),
    // Streaks & students
    supabase.from('student_streaks').select('id', { count: 'exact', head: true }).gt('current_streak', 0),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
  ])

  // ── Batch 2: Data queries ─────────────────────────────────────
  const [streakResult, quizScoreResult, recentLessonsResult, recentQuizzesResult, studentProfilesResult] = await Promise.all([
    supabase.from('student_streaks')
      .select('current_streak, total_xp, longest_streak')
      .order('total_xp', { ascending: false })
      .limit(200),
    supabase.from('quiz_attempts')
      .select('score, total')
      .gt('total', 0)
      .limit(2000),
    supabase.from('lesson_progress')
      .select('completed_at')
      .gte('completed_at', weekAgo.toISOString()),
    supabase.from('quiz_attempts')
      .select('created_at')
      .gte('created_at', weekAgo.toISOString()),
    supabase.from('profiles')
      .select('id, ai_quota_reset_at')
      .eq('role', 'student')
      .limit(500),
  ])

  // ── Extract counts ─────────────────────────────────────────────
  const lessonsToday  = lessonsTodayRes.count  ?? 0
  const quizzesToday  = quizzesTodayRes.count  ?? 0
  const aiMsgsToday   = aiMsgsTodayRes.count   ?? 0
  const badgesToday   = badgesTodayRes.count   ?? 0
  const lessonsWeek   = lessonsWeekRes.count   ?? 0
  const quizzesWeek   = quizzesWeekRes.count   ?? 0
  const aiMsgsWeek    = aiMsgsWeekRes.count    ?? 0
  const badgesWeek    = badgesWeekRes.count    ?? 0
  const totalLessons  = totalLessonsRes.count  ?? 0
  const totalQuizzes  = totalQuizzesRes.count  ?? 0
  const totalAiMsgs   = totalAiMsgsRes.count   ?? 0
  const totalBadges   = totalBadgesRes.count   ?? 0
  const masteredTopics   = masteredRes.count   ?? 0
  const learningTopics   = learningRes.count   ?? 0
  const practicingTopics = practicingRes.count ?? 0
  const activeStreaks  = activeStreaksRes.count ?? 0
  const totalStudents = studentCountRes.count  ?? 0

  // ── Streak stats ───────────────────────────────────────────────
  type StreakRow = { current_streak: number; total_xp: number; longest_streak: number }
  const streakRows = (streakResult.data ?? []) as StreakRow[]
  const avgStreak = streakRows.length > 0
    ? Math.round(streakRows.reduce((s, r) => s + r.current_streak, 0) / streakRows.length)
    : 0
  const totalXp = streakRows.reduce((s, r) => s + r.total_xp, 0)
  const topEarners = streakRows.slice(0, 5)
  const maxXp = topEarners[0]?.total_xp || 1

  // ── Quiz score distribution ────────────────────────────────────
  type ScoreRow = { score: number; total: number }
  const scoreRows = (quizScoreResult.data ?? []) as ScoreRow[]
  const scoredQuizzes = scoreRows.filter(r => r.total > 0)
  const avgScorePct = scoredQuizzes.length > 0
    ? Math.round(scoredQuizzes.reduce((s, r) => s + (r.score / r.total) * 100, 0) / scoredQuizzes.length)
    : 0
  const failing   = scoredQuizzes.filter(r => r.score / r.total < 0.5).length
  const passing   = scoredQuizzes.filter(r => r.score / r.total >= 0.5 && r.score / r.total < 0.75).length
  const excellent = scoredQuizzes.filter(r => r.score / r.total >= 0.75).length
  const scoredTotal = scoredQuizzes.length || 1

  // ── 7-day activity chart ───────────────────────────────────────
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const todayKey = now.toISOString().slice(0, 10)

  const lessonsByDay = new Map<string, number>(days.map(d => [d, 0]))
  const quizzesByDay = new Map<string, number>(days.map(d => [d, 0]))

  for (const row of recentLessonsResult.data ?? []) {
    const day = (row.completed_at as string).slice(0, 10)
    if (lessonsByDay.has(day)) lessonsByDay.set(day, (lessonsByDay.get(day) ?? 0) + 1)
  }
  for (const row of recentQuizzesResult.data ?? []) {
    const day = (row.created_at as string).slice(0, 10)
    if (quizzesByDay.has(day)) quizzesByDay.set(day, (quizzesByDay.get(day) ?? 0) + 1)
  }

  const dailyMax = Math.max(...days.map(d => (lessonsByDay.get(d) ?? 0) + (quizzesByDay.get(d) ?? 0)), 1)
  const dayLabels = days.map(d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }))

  // ── Engagement segments (AI usage as activity proxy) ──────────
  type StudentRow = { id: string; ai_quota_reset_at: string | null }
  const studentProfiles = (studentProfilesResult.data ?? []) as StudentRow[]
  const activeStudents  = studentProfiles.filter(p => p.ai_quota_reset_at && new Date(p.ai_quota_reset_at) >= weekAgo).length
  const atRiskStudents  = studentProfiles.filter(p => {
    if (!p.ai_quota_reset_at) return false
    const d = new Date(p.ai_quota_reset_at)
    return d < weekAgo && d >= thirtyDaysAgo
  }).length
  const dormantStudents = studentProfiles.filter(p =>
    !p.ai_quota_reset_at || new Date(p.ai_quota_reset_at) < thirtyDaysAgo
  ).length

  const totalTracked = masteredTopics + learningTopics + practicingTopics || 1

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-1">
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Engagement Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live activity — lessons, quizzes, AI tutoring, streaks &amp; mastery</p>
        </div>

        {/* ── Today's Pulse ─────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Lessons Completed', value: lessonsToday, icon: BookOpen,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-t-blue-500'   },
              { label: 'Quizzes Taken',     value: quizzesToday, icon: Brain,     color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-t-purple-500' },
              { label: 'AI Messages Sent',  value: aiMsgsToday,  icon: Zap,       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-t-amber-500'  },
              { label: 'Badges Earned',     value: badgesToday,  icon: Trophy,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-t-orange-500' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 border-t-4 ${border}`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── This Week ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Last 7 Days</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Lessons',         value: lessonsWeek,  icon: BookOpen, color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: 'Quizzes',         value: quizzesWeek,  icon: Brain,    color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'AI Conversations',value: aiMsgsWeek,   icon: Zap,      color: 'text-amber-600',  bg: 'bg-amber-50'  },
              { label: 'Badges Earned',   value: badgesWeek,   icon: Trophy,   color: 'text-orange-600', bg: 'bg-orange-50' },
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

        {/* ── 7-Day Activity Chart ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Daily Activity — Last 7 Days</h2>
              <p className="text-xs text-gray-400">Lessons (blue) · Quizzes (purple)</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {days.map((day, i) => {
              const l = lessonsByDay.get(day) ?? 0
              const q = quizzesByDay.get(day) ?? 0
              const total = l + q
              const pct = (total / dailyMax) * 100
              const isToday = day === todayKey
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className={`text-xs w-16 flex-shrink-0 font-medium ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {dayLabels[i]}{isToday ? ' ●' : ''}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    {total > 0 && (
                      <div className="h-full flex rounded-full overflow-hidden transition-all" style={{ width: `${pct}%` }}>
                        <div className="bg-blue-400" style={{ width: `${(l / total) * 100}%` }} />
                        <div className="bg-purple-400" style={{ width: `${(q / total) * 100}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-right w-20 flex-shrink-0 tabular-nums">
                    {l > 0 && <span className="text-blue-600 font-medium">{l}L</span>}
                    {l > 0 && q > 0 && <span className="text-gray-300"> · </span>}
                    {q > 0 && <span className="text-purple-600 font-medium">{q}Q</span>}
                    {total === 0 && <span className="text-gray-300">—</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-400 rounded-full" /><span className="text-xs text-gray-500">Lessons</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-400 rounded-full" /><span className="text-xs text-gray-500">Quizzes</span></div>
            <span className="text-xs text-gray-400 ml-auto">Peak day: {dailyMax} actions</span>
          </div>
        </div>

        {/* ── Quiz Performance + Topic Mastery ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Quiz Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Target size={16} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Quiz Performance</h2>
                <p className="text-xs text-gray-400">Average score: <span className="font-semibold text-gray-600">{avgScorePct}%</span></p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Excellent ≥75%', count: excellent, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Passing 50–74%', count: passing,   color: 'bg-amber-400',   textColor: 'text-amber-700',   bg: 'bg-amber-50'   },
                { label: 'Failing <50%',   count: failing,   color: 'bg-red-400',     textColor: 'text-red-700',     bg: 'bg-red-50'     },
              ].map(({ label, count, color, textColor }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={`font-semibold ${textColor}`}>{label}</span>
                    <span className="text-gray-400">{count} ({Math.round((count / scoredTotal) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${(count / scoredTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
              {totalQuizzes.toLocaleString()} total attempts · {scoredQuizzes.length.toLocaleString()} scored
            </p>
          </div>

          {/* Topic Mastery */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Topic Mastery Progress</h2>
                <p className="text-xs text-gray-400">{(masteredTopics + learningTopics + practicingTopics).toLocaleString()} topics tracked</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Mastered',   count: masteredTopics,   color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { label: 'Practicing', count: practicingTopics, color: 'bg-blue-400',    textColor: 'text-blue-700'    },
                { label: 'Learning',   count: learningTopics,   color: 'bg-amber-400',   textColor: 'text-amber-700'   },
              ].map(({ label, count, color, textColor }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={`font-semibold ${textColor}`}>{label}</span>
                    <span className="text-gray-400">{count.toLocaleString()} ({Math.round((count / totalTracked) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${(count / totalTracked) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
              {totalLessons.toLocaleString()} lessons completed all-time
            </p>
          </div>
        </div>

        {/* ── Streaks & XP ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flame size={16} className="text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Streaks &amp; XP</h2>
              <p className="text-xs text-gray-400">{activeStreaks} students currently on a streak</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'On Active Streak', value: activeStreaks,           color: 'text-orange-600' },
              { label: 'Avg Streak (days)', value: avgStreak,              color: 'text-blue-600'   },
              { label: 'Total XP Earned',  value: totalXp.toLocaleString(), color: 'text-yellow-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center py-3 bg-gray-50 rounded-xl">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {topEarners.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top XP Earners</p>
              <div className="space-y-2.5">
                {topEarners.map((earner, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-6 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        style={{ width: `${(earner.total_xp / maxXp) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-yellow-600 w-24 text-right tabular-nums">
                      {earner.total_xp.toLocaleString()} XP
                    </span>
                    {earner.current_streak > 0 && (
                      <span className="text-xs text-orange-500 w-10 flex-shrink-0">🔥{earner.current_streak}d</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Engagement Segments ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Student Engagement Segments</h2>
              <p className="text-xs text-gray-400">Based on AI Tutor usage as activity signal · {totalStudents} students total</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Active',
                sublabel: 'Used AI last 7 days',
                count: activeStudents,
                bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700', bar: 'bg-emerald-500',
              },
              {
                label: 'At Risk',
                sublabel: 'No activity 7–30 days',
                count: atRiskStudents,
                bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700', bar: 'bg-amber-400',
              },
              {
                label: 'Dormant',
                sublabel: 'No activity 30+ days',
                count: dormantStudents,
                bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700', bar: 'bg-red-400',
              },
            ].map(({ label, sublabel, count, bg, border, color, bar }) => {
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
            <span>View detailed cohort analysis & conversion opportunities</span>
            <span>→</span>
          </Link>
        </div>

        {/* ── AI Tutor Usage ────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">AI Tutor Activity</h2>
              <p className="text-xs text-gray-500">Student questions sent to the AI tutor</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Today',     value: aiMsgsToday,  color: 'text-indigo-700' },
              { label: 'This Week', value: aiMsgsWeek,   color: 'text-indigo-600' },
              { label: 'All Time',  value: totalAiMsgs,  color: 'text-indigo-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center bg-white/60 rounded-xl py-4">
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── All-Time Totals ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">All-Time Platform Totals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Lessons Completed', value: totalLessons,  icon: BookOpen, color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: 'Quiz Attempts',     value: totalQuizzes,  icon: Brain,    color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'AI Interactions',   value: totalAiMsgs,   icon: Zap,      color: 'text-amber-600',  bg: 'bg-amber-50'  },
              { label: 'Badges Awarded',    value: totalBadges,   icon: Trophy,   color: 'text-orange-600', bg: 'bg-orange-50' },
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

        {/* Footer note */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Activity size={14} className="text-gray-300 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            All figures are live database counts — no caching or estimates.
            Refresh the page to see the latest activity.
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
