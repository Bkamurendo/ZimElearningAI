import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { SmsSummaryButton } from './sms-button'
import { Zap, Phone, BarChart3, CheckCircle2 } from 'lucide-react'


export default async function ParentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, phone_number')
    .eq('id', user.id)
    .single()


  if (profile?.role !== 'parent') redirect(`/${profile?.role}/dashboard`)

  type ChildRow = {
    id: string
    grade: string
    zimsec_level: string
    user_id: string
    user: { full_name: string; email: string } | null
  }

  // Use service client to bypass RLS for the profiles join
  // (parent RLS allows reading student_profiles, but not the child's profile row)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: childProfiles } = await serviceClient
    .from('student_profiles')
    .select('id, grade, zimsec_level, user_id')
    .eq('parent_id', user.id) as { data: { id: string; grade: string; zimsec_level: string; user_id: string }[] | null; error: unknown }

  // Fetch each child's public profile
  const children: ChildRow[] = []
  for (const cp of childProfiles ?? []) {
    const { data: prof } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', cp.user_id)
      .single() as { data: { full_name: string; email: string } | null; error: unknown }
    children.push({ ...cp, user: prof ?? null })
  }

  // Rich stats for each child
  type ChildStats = ChildRow & {
    lessonsCompleted: number
    quizzesDone: number
    topicsMastered: number
    currentStreak: number
    totalXp: number
    recentBadges: string[]
    weakTopics: string[]
    readyPulse: number
    cycleProgress: { subject: string; pass_number: number }[]
  }

  const childStats: ChildStats[] = []
  for (const child of children) {
    const { count: lessons } = await supabase
      .from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', child.id)
    const { count: quizzes } = await supabase
      .from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', child.id)
    const { count: mastered } = await supabase
      .from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', child.id).eq('mastery_level', 'mastered')
    const { data: streak } = await supabase
      .from('student_streaks').select('current_streak, total_xp').eq('student_id', child.id).single() as { data: { current_streak: number; total_xp: number } | null; error: unknown }
    const { data: badges } = await supabase
      .from('student_badges').select('badge_name').eq('student_id', child.id).order('earned_at', { ascending: false }).limit(3) as { data: { badge_name: string }[] | null; error: unknown }
    const { data: weak } = await supabase
      .from('topic_mastery').select('topic').eq('student_id', child.id).eq('mastery_level', 'learning').limit(4) as { data: { topic: string }[] | null; error: unknown }

    childStats.push({
      ...child,
      lessonsCompleted: lessons ?? 0,
      quizzesDone: quizzes ?? 0,
      topicsMastered: mastered ?? 0,
      currentStreak: streak?.current_streak ?? 0,
      totalXp: streak?.total_xp ?? 0,
      recentBadges: badges?.map((b) => b.badge_name) ?? [],
      weakTopics: weak?.map((m) => m.topic) ?? [],
      readyPulse: 0,
      cycleProgress: [],
    })
  }


  // Fetch cycles and calculate pulse
  for (const stats of childStats) {
    const { data: cycles } = await supabase
      .from('syllabus_cycles')
      .select('subject_name, pass_number')
      .eq('student_id', stats.id)

    if (cycles && cycles.length > 0) {
      stats.cycleProgress = cycles.map((c: any) => ({ subject: c.subject_name, pass_number: c.pass_number }))
      const avgPass = cycles.reduce((acc: number, c: any) => acc + c.pass_number, 0) / cycles.length
      const masteryScore = (stats.topicsMastered / 30) * 100 // Assume 30 target topics
      stats.readyPulse = Math.min(100, Math.round((masteryScore * 0.5) + ((avgPass / 3) * 50)))
    } else {
      stats.readyPulse = Math.min(100, Math.round((stats.topicsMastered / 30) * 100))
    }

  }


  // Notifications
  type NotifRow = { id: string; title: string; message: string; type: string; created_at: string; read: boolean }
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, created_at, read')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20) as { data: NotifRow[] | null; error: unknown }

  const allNotifs = notifications ?? []
  const unreadCount = allNotifs.filter((n) => !n.read).length

  const notifIcon: Record<string, string> = {
    lesson_complete: '✅',
    assignment_submitted: '📤',
    assignment_graded: '🎯',
  }

  const levelLabel: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <p className="text-purple-200 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profile?.full_name?.split(' ')[0] ?? 'Parent'}!
            </h1>
            <p className="mt-1 text-purple-200 text-sm">
              Monitoring your children&apos;s ZIMSEC preparation
            </p>
          </div>
        </div>

        {/* Children progress cards */}
        {childStats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">👨‍👧</div>
            <p className="font-semibold text-gray-700">No linked children yet</p>
            <p className="text-sm text-gray-400 mt-2">Children can link your account during their onboarding.</p>
          </div>
        ) : (
          childStats.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Child header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {(child.user?.full_name ?? 'S')[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold">{child.user?.full_name}</h2>
                    <p className="text-xs text-purple-200">{child.grade} &bull; {levelLabel[child.zimsec_level] ?? child.zimsec_level}</p>
                  </div>
                </div>
                {child.currentStreak > 0 && (
                  <div className="text-right bg-white/10 rounded-xl px-4 py-2">
                    <p className="text-xl font-bold">🔥 {child.currentStreak}</p>
                    <p className="text-xs text-purple-200">day streak</p>
                  </div>
                )}
              </div>

              {/* Ready Pulse & Syllabus Mastery */}
              <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`${child.readyPulse > 80 ? 'text-green-500' : 'text-amber-500'}`} strokeDasharray={`${child.readyPulse}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{child.readyPulse}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Zap size={14} className="text-yellow-500" /> Ready Pulse
                    </h3>
                    <p className="text-xs text-gray-400">Exam preparation score based on repetition cycles</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SmsSummaryButton
                    studentId={child.id}
                    studentName={child.user?.full_name?.split(' ')[0] || 'Student'}
                    phoneNumber={profile?.phone_number || ''}
                    averagePulse={child.readyPulse}
                  />
                  {!profile?.phone_number && (
                    <span className="text-[10px] text-red-400 font-medium italic">Add phone in profile to receive alerts</span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Cycles Table (New ZIMSEC Style) */}
                {child.cycleProgress.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <BarChart3 size={12} /> Three-Cycle Strategy Status
                    </p>
                    <div className="space-y-2">
                      {child.cycleProgress.map((cp, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100">
                          <span className="text-xs font-semibold text-gray-700">{cp.subject}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(step => (
                              <div key={step} className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                cp.pass_number >= step ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
                              }`}>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: child.lessonsCompleted, label: 'Lessons', color: 'text-gray-700', bg: 'bg-gray-50' },
                    { val: child.quizzesDone, label: 'Quizzes', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { val: child.topicsMastered, label: 'Mastered', color: 'text-green-600', bg: 'bg-green-50' },
                    { val: child.totalXp, label: 'XP ⭐', color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((s) => (
                    <div key={s.label} className={`text-center p-3 ${s.bg} rounded-xl`}>
                      <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Weak topics alert */}
                {child.weakTopics.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Needs more practice:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {child.weakTopics.map((t) => (
                        <span key={t} className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges */}
                {child.recentBadges.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🏅 Recent achievements</p>
                    <div className="flex flex-wrap gap-2">
                      {child.recentBadges.map((b, i) => (
                        <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
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
                <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">
                  Mark all read
                </button>
              </form>
            )}
          </div>

          {allNotifs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {allNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-3 rounded-lg ${n.read ? 'bg-gray-50' : 'bg-purple-50 border border-purple-100'}`}
                >
                  <span className="text-lg flex-shrink-0">{notifIcon[n.type] ?? '🔔'}</span>
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
