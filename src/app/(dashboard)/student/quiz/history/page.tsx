export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'

const MASTERY_CONFIG = {
  mastered:    { label: 'Mastered',   color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  competent:   { label: 'Competent',  color: 'bg-blue-100 text-blue-800 border-blue-200',          dot: 'bg-blue-500'    },
  learning:    { label: 'Learning',   color: 'bg-amber-100 text-amber-800 border-amber-200',        dot: 'bg-amber-400'   },
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200',          dot: 'bg-gray-300'    },
}

const BADGE_EMOJI: Record<string, string> = {
  perfect_score:  '💯',
  high_achiever:  '🏆',
  first_quiz:     '🎯',
  quiz_10:        '⭐',
  quiz_50:        '🔥',
}

function scoreRing(pct: number) {
  if (pct >= 80) return { ring: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-600' }
  if (pct >= 60) return { ring: 'border-blue-200 bg-blue-50',       text: 'text-blue-600'    }
  return              { ring: 'border-red-200 bg-red-50',           text: 'text-red-500'     }
}

export default async function QuizHistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!sp) redirect('/student/quiz')

  const [
    { data: attempts },
    { data: mastery },
    { data: streak },
    { data: badges },
  ] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id, topic, score, total, created_at, subjects(name, code)')
      .eq('student_id', sp.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('topic_mastery')
      .select('topic, mastery_level, updated_at, subjects(name, code)')
      .eq('student_id', sp.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('student_streaks')
      .select('current_streak, total_xp, longest_streak')
      .eq('student_id', sp.id)
      .single(),
    supabase
      .from('student_badges')
      .select('badge_type, badge_name, earned_at')
      .eq('student_id', sp.id)
      .order('earned_at', { ascending: false }),
  ])

  const totalQuizzes = attempts?.length ?? 0
  const avgScore = totalQuizzes > 0
    ? Math.round(attempts!.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / totalQuizzes)
    : 0
  const topicsMastered = (mastery ?? []).filter(m => m.mastery_level === 'mastered').length

  // Group mastery rows by subject
  const masteryBySubject: Record<string, { name: string; topics: NonNullable<typeof mastery> }> = {}
  for (const m of mastery ?? []) {
    const sub = m.subjects as { name: string; code: string } | null
    if (!sub) continue
    if (!masteryBySubject[sub.code]) masteryBySubject[sub.code] = { name: sub.name, topics: [] }
    masteryBySubject[sub.code].topics.push(m)
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-4 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/student/quiz" className="text-white/70 hover:text-white text-sm transition mb-4 inline-block">
            ← Back to Quizzes
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase">Quiz History</h1>
          </div>
          <p className="text-violet-200 text-sm mb-5">Your quiz performance and topic mastery</p>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Quizzes',   value: totalQuizzes,                    icon: '📝' },
              { label: 'Avg Score', value: totalQuizzes ? `${avgScore}%` : '—', icon: '🎯' },
              { label: 'Mastered',  value: topicsMastered,                  icon: '✅' },
              { label: 'Streak',    value: `${streak?.current_streak ?? 0}d`, icon: '🔥' },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-xl p-2.5 text-center">
                <p className="text-base">{s.icon}</p>
                <p className="text-white font-bold text-base leading-tight">{s.value}</p>
                <p className="text-violet-200 text-xs mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* XP + longest streak */}
        {streak && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xl font-black text-slate-800">{streak.total_xp.toLocaleString()}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total XP</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xl font-black text-slate-800">{streak.longest_streak} days</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Best Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Badges Earned</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <div key={b.badge_type} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                  <span className="text-sm">{BADGE_EMOJI[b.badge_type] ?? '🏅'}</span>
                  <span className="text-xs font-semibold text-amber-800">{b.badge_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent attempts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Recent Quizzes</h2>
            {totalQuizzes > 0 && <span className="text-xs text-slate-400">{totalQuizzes} total</span>}
          </div>

          {attempts && attempts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {attempts.map(a => {
                const pct = Math.round((a.score / a.total) * 100)
                const { ring, text } = scoreRing(pct)
                const sub = a.subjects as { name: string; code: string } | null
                const date = new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center flex-shrink-0 ${ring}`}>
                      <span className={`text-sm font-black leading-none ${text}`}>{pct}%</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{a.score}/{a.total}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.topic}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{sub?.name ?? 'Unknown'} · {date}</p>
                    </div>
                    {pct >= 80
                      ? <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                      : pct < 60
                      ? <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                      : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No quizzes taken yet.</p>
              <Link href="/student/quiz" className="inline-block mt-3 text-sm font-semibold text-violet-600 hover:underline">
                Take your first quiz →
              </Link>
            </div>
          )}
        </div>

        {/* Topic mastery breakdown */}
        {Object.keys(masteryBySubject).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide px-1">Topic Mastery</h2>
            {Object.entries(masteryBySubject).map(([code, { name, topics }]) => {
              const masteredCount = topics.filter(t => t.mastery_level === 'mastered').length
              return (
                <div key={code} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">{name}</h3>
                    <span className="text-xs text-slate-400">{masteredCount}/{topics.length} mastered</span>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {topics.map(t => {
                      const cfg = MASTERY_CONFIG[t.mastery_level as keyof typeof MASTERY_CONFIG] ?? MASTERY_CONFIG.not_started
                      return (
                        <span key={t.topic} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          {t.topic}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
