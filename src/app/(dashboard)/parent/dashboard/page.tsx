import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { AlertTriangle, TrendingUp, Brain, Flame, Star, Bell, Zap } from 'lucide-react'

export default async function ParentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, plan')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect(`/${profile?.role}/dashboard`)

  const isPaid = ['starter', 'pro', 'elite'].includes(profile?.plan ?? 'free')

  type ChildRow = {
    id: string
    grade: string
    zimsec_level: string
    user: { full_name: string; email: string } | null
  }
  const { data: children } = await supabase
    .from('student_profiles')
    .select('id, grade, zimsec_level, user:profiles(full_name, email)')
    .eq('parent_id', user.id) as { data: ChildRow[] | null; error: unknown }

  type ChildStats = ChildRow & {
    lessonsCompleted: number
    quizzesDone: number
    topicsMastered: number
    topicsLearning: number
    currentStreak: number
    longestStreak: number
    totalXp: number
    recentBadges: string[]
    weakTopics: string[]
    avgQuizScore: number
    examDate: string | null
    daysToExam: number | null
    aiUsedToday: number
  }

  const childStats: ChildStats[] = []
  for (const child of children ?? []) {
    const [
      { count: lessons },
      { count: quizzes },
      { count: mastered },
      { count: learning },
      { data: streak },
      { data: badges },
      { data: weak },
      { data: quizScores },
      { data: studyPlan },
      { data: childProfile },
    ] = await Promise.all([
      supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', child.id),
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', child.id),
      supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', child.id).eq('mastery_level', 'mastered'),
      supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', child.id).eq('mastery_level', 'learning'),
      supabase.from('student_streaks').select('current_streak, longest_streak, total_xp').eq('student_id', child.id).single(),
      supabase.from('student_badges').select('badge_name').eq('student_id', child.id).order('earned_at', { ascending: false }).limit(3),
      supabase.from('topic_mastery').select('topic').eq('student_id', child.id).eq('mastery_level', 'learning').limit(5),
      supabase.from('quiz_attempts').select('score, total').eq('student_id', child.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('study_plans').select('exam_date').eq('student_id', child.id).single(),
      supabase.from('profiles').select('ai_requests_today, ai_quota_reset_at').eq('id', child.user ? (child as unknown as { user_id: string }).user_id ?? user.id : user.id).single(),
    ])

    const scores = (quizScores ?? []) as { score: number; total: number }[]
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, q) => sum + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / scores.length)
      : 0

    const examDate = (studyPlan as { exam_date: string | null } | null)?.exam_date ?? null
    const daysToExam = examDate
      ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
      : null

    const streakData = streak as { current_streak: number; longest_streak: number; total_xp: number } | null
    const profileData = childProfile as { ai_requests_today: number; ai_quota_reset_at: string } | null
    const now = new Date()
    const resetAt = new Date(profileData?.ai_quota_reset_at ?? now)
    const isNewDay = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
    const aiUsedToday = isNewDay ? 0 : (profileData?.ai_requests_today ?? 0)

    childStats.push({
      ...child,
      lessonsCompleted: lessons ?? 0,
      quizzesDone: quizzes ?? 0,
      topicsMastered: mastered ?? 0,
      topicsLearning: learning ?? 0,
      currentStreak: streakData?.current_streak ?? 0,
      longestStreak: streakData?.longest_streak ?? 0,
      totalXp: streakData?.total_xp ?? 0,
      recentBadges: (badges as { badge_name: string }[] | null)?.map(b => b.badge_name) ?? [],
      weakTopics: (weak as { topic: string }[] | null)?.map(m => m.topic) ?? [],
      avgQuizScore: avgScore,
      examDate,
      daysToExam,
      aiUsedToday,
    })
  }

  type NotifRow = { id: string; title: string; message: string; type: string; created_at: string; read: boolean }
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, created_at, read')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15) as { data: NotifRow[] | null; error: unknown }

  const allNotifs = notifications ?? []
  const unreadCount = allNotifs.filter(n => !n.read).length
  const levelLabel: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium mb-1">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile?.full_name?.split(' ')[0] ?? 'Parent'}!</h1>
              <p className="mt-1 text-purple-200 text-sm">Monitoring your {childStats.length} child{childStats.length !== 1 ? 'ren' : ''}&apos;s ZIMSEC preparation</p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-2 flex-shrink-0">
                <Bell size={14} />
                <span className="text-sm font-bold">{unreadCount} new</span>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade prompt for free parents */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Give your child the best chance at passing ZIMSEC</p>
              <p className="text-xs text-gray-500 mt-0.5">Upgrade to unlock unlimited Fundi AI tutoring, past papers, and personalised study plans — from $2/month</p>
            </div>
            <Link href="/student/upgrade" className="flex-shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap">
              Upgrade →
            </Link>
          </div>
        )}

        {/* Children cards */}
        {childStats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">👨‍👧</div>
            <p className="font-semibold text-gray-700">No linked children yet</p>
            <p className="text-sm text-gray-400 mt-2">Your child can link your account during their onboarding.</p>
          </div>
        ) : (
          childStats.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

              {/* Child header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">
                      {(child.user?.full_name ?? 'S')[0]}
                    </div>
                    <div>
                      <h2 className="text-base font-bold">{child.user?.full_name}</h2>
                      <p className="text-xs text-purple-200">{child.grade} · {levelLabel[child.zimsec_level] ?? child.zimsec_level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {child.currentStreak > 0 && (
                      <div className="text-right bg-white/10 rounded-xl px-3 py-2">
                        <p className="text-lg font-bold flex items-center gap-1"><Flame size={16} />{child.currentStreak}</p>
                        <p className="text-xs text-purple-200">day streak</p>
                      </div>
                    )}
                    {child.daysToExam !== null && (
                      <div className="text-right bg-white/10 rounded-xl px-3 py-2">
                        <p className="text-lg font-bold">{child.daysToExam}</p>
                        <p className="text-xs text-purple-200">days to exam</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: child.lessonsCompleted, label: 'Lessons done', color: 'text-gray-800', bg: 'bg-gray-50', icon: '📖' },
                    { val: child.quizzesDone, label: 'Quizzes taken', color: 'text-blue-700', bg: 'bg-blue-50', icon: '✏️' },
                    { val: child.topicsMastered, label: 'Topics mastered', color: 'text-green-700', bg: 'bg-green-50', icon: '✅' },
                    { val: `${child.avgQuizScore}%`, label: 'Avg quiz score', color: 'text-purple-700', bg: 'bg-purple-50', icon: '🎯' },
                  ].map(s => (
                    <div key={s.label} className={`text-center p-3 ${s.bg} rounded-xl`}>
                      <p className="text-lg mb-0.5">{s.icon}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar: mastered vs learning */}
                {(child.topicsMastered + child.topicsLearning) > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="flex items-center gap-1"><TrendingUp size={11} /> Topic progress</span>
                      <span>{child.topicsMastered} mastered · {child.topicsLearning} in progress</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500 rounded-l-full transition-all"
                        style={{ width: `${(child.topicsMastered / (child.topicsMastered + child.topicsLearning)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-amber-400 transition-all"
                        style={{ width: `${(child.topicsLearning / (child.topicsMastered + child.topicsLearning)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* AI usage today */}
                <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
                  <Brain size={16} className="text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-800">Fundi AI usage today</p>
                    <p className="text-xs text-indigo-600">{child.aiUsedToday} questions asked</p>
                  </div>
                  {child.aiUsedToday >= 5 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Limit reached</span>
                  )}
                </div>

                {/* Weak topics */}
                {child.weakTopics.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Needs more practice:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {child.weakTopics.map(t => (
                        <span key={t} className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges */}
                {child.recentBadges.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Star size={11} /> Recent achievements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {child.recentBadges.map((b, i) => (
                        <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* XP + longest streak footer */}
                <div className="flex items-center gap-4 pt-1 border-t border-gray-50 text-xs text-gray-400">
                  <span><Star size={11} className="inline mr-1" />{child.totalXp} XP earned</span>
                  <span><Flame size={11} className="inline mr-1" />Best streak: {child.longestStreak} days</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Activity feed
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead as unknown as (fd: FormData) => void}>
                <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">Mark all read</button>
              </form>
            )}
          </div>
          {allNotifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {allNotifs.map(n => (
                <div key={n.id} className={`flex gap-3 p-3 rounded-xl ${n.read ? 'bg-gray-50' : 'bg-purple-50 border border-purple-100'}`}>
                  <span className="text-base flex-shrink-0">🔔</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
