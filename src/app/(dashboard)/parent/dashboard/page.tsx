import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { SmsSummaryButton } from './sms-button'
import { Zap, Phone, BarChart3, CheckCircle2, ShieldAlert, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default async function ParentDashboard() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, phone_number')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'parent') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    type ChildRow = {
      id: string
      grade: string
      zimsec_level: string
      user_id: string
      user: { full_name: string; email: string } | null
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: childProfiles } = await serviceClient
      .from('student_profiles')
      .select('id, grade, zimsec_level, user_id')
      .eq('parent_id', user.id)

    const children: ChildRow[] = []
    for (const cp of childProfiles ?? []) {
      const { data: prof } = await serviceClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', cp.user_id)
        .single()
      children.push({ ...cp, user: prof ?? null })
    }

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
      const [{ count: lessons }, { count: quizzes }, { count: mastered }, { data: streak }, { data: badges }, { data: weak }] = await Promise.all([
        supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', child.id),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', child.id),
        supabase.from('topic_mastery').select('id', { count: 'exact', head: true }).eq('student_id', child.id).eq('mastery_level', 'mastered'),
        supabase.from('student_streaks').select('current_streak, total_xp').eq('student_id', child.id).single(),
        supabase.from('student_badges').select('badge_name').eq('student_id', child.id).order('earned_at', { ascending: false }).limit(3),
        supabase.from('topic_mastery').select('topic').eq('student_id', child.id).eq('mastery_level', 'learning').limit(4),
      ])

      childStats.push({
        ...child,
        lessonsCompleted: lessons ?? 0,
        quizzesDone: quizzes ?? 0,
        topicsMastered: mastered ?? 0,
        currentStreak: streak?.current_streak ?? 0,
        totalXp: streak?.total_xp ?? 0,
        recentBadges: badges?.map((b: any) => b.badge_name) ?? [],
        weakTopics: weak?.map((m: any) => m.topic) ?? [],
        readyPulse: 0,
        cycleProgress: [],
      })
    }

    for (const stats of childStats) {
      const { data: cycles } = await supabase
        .from('syllabus_cycles')
        .select('subject_name, pass_number')
        .eq('student_id', stats.id)

      if (cycles && cycles.length > 0) {
        stats.cycleProgress = cycles.map((c: any) => ({ subject: c.subject_name, pass_number: c.pass_number }))
        const avgPass = cycles.reduce((acc: number, c: any) => acc + c.pass_number, 0) / cycles.length
        const masteryScore = (stats.topicsMastered / 30) * 100
        stats.readyPulse = Math.min(100, Math.round((masteryScore * 0.5) + ((avgPass / 3) * 50)))
      } else {
        stats.readyPulse = Math.min(100, Math.round((stats.topicsMastered / 30) * 100))
      }
    }

    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, title, message, type, created_at, read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const allNotifs = notifications ?? []
    const unreadCount = allNotifs.filter((n) => !n.read).length
    const notifIcon: Record<string, string> = {
      lesson_complete: '✅',
      assignment_submitted: '📤',
      assignment_graded: '🎯',
    }
    const levelLabel: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

    return (
      <div className="min-h-screen bg-slate-50/50 pb-20 font-bold uppercase">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          
          {/* Welcome banner */}
          <div className="relative bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white rounded-3xl p-8 sm:p-10 overflow-hidden shadow-2xl border border-white/10 uppercase">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="relative z-10">
              <p className="text-purple-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Guardian Command Center</p>
              <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase">
                HELLO, {profile?.full_name?.split(' ')[0] || 'GUARDIAN'}!
              </h1>
              <p className="mt-2 text-purple-100 text-[10px] font-black uppercase tracking-widest italic leading-none">
                Monitoring cohort performance & preparation status.
              </p>
            </div>
          </div>

          {/* Children progress cards */}
          {childStats.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center shadow-xl uppercase font-bold">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-100 shadow-inner">
                <Users size={40} className="text-purple-400" />
              </div>
              <p className="text-lg font-black text-slate-800 uppercase tracking-tight">No linked dependents detected</p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold italic">Dependents must link your authorized guardian UID during onboarding.</p>
            </div>
          ) : (
            childStats.map((child) => (
              <div key={child.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl transition-all hover:shadow-purple-500/10 hover:border-purple-200 uppercase font-bold">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 border border-white/20 shadow-lg uppercase italic">
                      {(child.user?.full_name ?? 'S')[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight uppercase italic">{child.user?.full_name}</h2>
                      <p className="text-[10px] text-purple-200 font-bold uppercase tracking-widest mt-1 italic leading-none">{child.grade} &bull; {levelLabel[child.zimsec_level] ?? child.zimsec_level}</p>
                    </div>
                  </div>
                  {child.currentStreak > 0 && (
                    <div className="text-right bg-white/10 rounded-2xl px-5 py-3 border border-white/10 shadow-inner">
                      <p className="text-2xl font-black uppercase italic tracking-tighter">🔥 {child.currentStreak}</p>
                      <p className="text-[9px] text-purple-200 font-black uppercase tracking-widest leading-none mt-1">DAY STREAK</p>
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 uppercase">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 flex-shrink-0 group">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`${child.readyPulse > 80 ? 'text-emerald-500' : 'text-amber-500'} transition-all duration-1000 ease-out`} strokeDasharray={`${child.readyPulse}, 100`} strokeWidth="3.5" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{child.readyPulse}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                        <Zap size={16} className="text-yellow-500 fill-current" /> READY PULSE INDEX
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight mt-1 italic">Preparation score based on repetition cycles.</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <SmsSummaryButton
                      studentId={child.id}
                      studentName={child.user?.full_name?.split(' ')[0] || 'Student'}
                      phoneNumber={profile?.phone_number || ''}
                      averagePulse={child.readyPulse}
                    />
                    {!profile?.phone_number && (
                      <span className="text-[8px] text-rose-500 font-black uppercase tracking-tighter italic">IDENTITY VERIFY: ADD PHONE TO PROFILE</span>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-8 uppercase">
                  {child.cycleProgress.length > 0 && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 shadow-inner font-black uppercase">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart3 size={14} className="text-purple-500" /> CALIBRATION STATUS: 3-CYCLE SYNC
                      </p>
                      <div className="space-y-3">
                        {child.cycleProgress.map((cp, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{cp.subject}</span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map(step => (
                                <div key={step} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${
                                  cp.pass_number >= step ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-300'
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 uppercase font-black">
                    {[
                      { val: child.lessonsCompleted, label: 'LESSONS', color: 'text-slate-800', bg: 'bg-slate-50/50 border-slate-100' },
                      { val: child.quizzesDone, label: 'QUIZZES', color: 'text-indigo-600', bg: 'bg-indigo-50/50 border-indigo-100' },
                      { val: child.topicsMastered, label: 'MASTERED', color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100' },
                      { val: child.totalXp, label: 'XP RANK', color: 'text-purple-600', bg: 'bg-purple-50/50 border-purple-100' },
                    ].map((s) => (
                      <div key={s.label} className={`text-center p-4 ${s.bg} rounded-2xl border shadow-sm transition-all hover:shadow-md uppercase`}>
                        <p className={`text-2xl font-black italic tracking-tighter ${s.color} uppercase`}>{s.val}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {child.weakTopics.length > 0 && (
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 shadow-inner uppercase font-bold">
                      <p className="text-[10px] font-black text-rose-800 mb-3 tracking-widest leading-none">⚠ MISSION CRITICAL: PRACTICE REQUIRED</p>
                      <div className="flex flex-wrap gap-2 uppercase">
                        {child.weakTopics.map((t) => (
                          <span key={t} className="text-[9px] bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-black border border-rose-200 tracking-tight shadow-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl uppercase font-bold">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black italic tracking-tight uppercase">
                COHORT ACTIVITY FEED
                {unreadCount > 0 && (
                  <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full shadow-sm tracking-widest">
                   {unreadCount} NEW
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead as any}>
                  <button type="submit" className="text-[10px] text-slate-400 hover:text-slate-800 font-black tracking-widest transition uppercase underline underline-offset-4 decoration-slate-200">
                    MARK ALL VERIFIED
                  </button>
                </form>
              )}
            </div>

            {allNotifs.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest">No recent cohort activity detected.</p>
            ) : (
              <div className="space-y-3 uppercase font-bold">
                {allNotifs.map((n) => (
                  <div key={n.id} className={`flex gap-4 p-4 rounded-2xl transition-all shadow-sm ${n.read ? 'bg-slate-50 border border-slate-100' : 'bg-purple-50 border border-purple-200 shadow-purple-500/5'}`}>
                    <span className="text-xl flex-shrink-0 filter drop-shadow-sm">{notifIcon[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0 uppercase font-bold">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">{n.title}</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase italic font-medium leading-none">{n.message}</p>
                      <p className="text-[8px] text-slate-400 mt-2 font-black uppercase tracking-tighter italic">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full flex-shrink-0 mt-1 shadow-lg shadow-purple-500/50" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ParentDashboard] Runtime error:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50 uppercase font-black">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Custodian access error</h2>
        <p className="text-slate-500 max-w-xs uppercase font-bold italic">We encountered a critical error while synchronizing cohort data. Security protocols have blocked access.</p>
        <Link href="/login">
          <Button variant="outline">Re-authenticate</Button>
        </Link>
      </div>
    )
  }
}
