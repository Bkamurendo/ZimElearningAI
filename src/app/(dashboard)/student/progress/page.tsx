import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Target } from 'lucide-react'

const SUBJECT_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-500',
  'from-red-500 to-rose-600',
]

const MASTERY_CONFIG = {
  mastered:    { label: 'Mastered',    color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  competent:   { label: 'Competent',   color: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
  learning:    { label: 'Learning',    color: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  not_started: { label: 'Not Started', color: 'bg-gray-200',    text: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200'    },
}

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, zimsec_level, grade')
    .eq('user_id', user.id)
    .single() as { data: { id: string; zimsec_level: string; grade: string } | null; error: unknown }

  if (!studentProfile) redirect('/student/dashboard')

  type SubjectRow = { name: string; code: string } | null
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(name, code)')
    .eq('student_id', studentProfile.id) as { data: { subject: SubjectRow }[] | null; error: unknown }

  const subjects = (enrolments?.map((e) => e.subject).filter(Boolean) ?? []) as NonNullable<SubjectRow>[]

  const { data: masteryRows } = await supabase
    .from('topic_mastery')
    .select('subject_id, topic, mastery_level, updated_at')
    .eq('student_id', studentProfile.id) as {
      data: { subject_id: string; topic: string; mastery_level: string; updated_at: string }[] | null
      error: unknown
    }

  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id, code')
    .in('code', subjects.map((s) => s.code))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const codeToId = Object.fromEntries((subjectData ?? []).map((s) => [s.code, s.id]))
  const idToCode = Object.fromEntries((subjectData ?? []).map((s) => [s.id, s.code]))

  const masteryBySubject: Record<string, { topic: string; mastery_level: string }[]> = {}
  for (const row of masteryRows ?? []) {
    const code = idToCode[row.subject_id]
    if (!code) continue
    if (!masteryBySubject[code]) masteryBySubject[code] = []
    masteryBySubject[code].push({ topic: row.topic, mastery_level: row.mastery_level })
  }

  const { data: streak } = await supabase
    .from('student_streaks')
    .select('*')
    .eq('student_id', studentProfile.id)
    .single() as { data: { current_streak: number; longest_streak: number; total_xp: number } | null; error: unknown }

  const { data: badges } = await supabase
    .from('student_badges')
    .select('badge_name, earned_at')
    .eq('student_id', studentProfile.id)
    .order('earned_at', { ascending: false }) as {
      data: { badge_name: string; earned_at: string }[] | null
      error: unknown
    }

  const { count: totalQuizzes } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentProfile.id)

  const allMastery = masteryRows ?? []
  const masteredCount  = allMastery.filter((m) => m.mastery_level === 'mastered').length
  const competentCount = allMastery.filter((m) => m.mastery_level === 'competent').length
  const learningCount  = allMastery.filter((m) => m.mastery_level === 'learning').length
  const totalTopics    = masteredCount + competentCount + learningCount

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Progress</h1>
          <p className="text-sm text-gray-400 mt-0.5">Knowledge profile &amp; achievements</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: streak?.current_streak ?? 0, label: 'Day streak',      emoji: '🔥', border: 'border-t-orange-500', color: 'text-orange-500'  },
            { value: streak?.total_xp ?? 0,       label: 'Total XP',        emoji: '⭐', border: 'border-t-purple-500', color: 'text-purple-600'  },
            { value: totalQuizzes ?? 0,            label: 'Quizzes done',    emoji: '🧠', border: 'border-t-blue-500',   color: 'text-blue-600'    },
            { value: masteredCount,                label: 'Topics mastered', emoji: '🎯', border: 'border-t-emerald-500',color: 'text-emerald-600' },
          ].map(({ value, label, emoji, border, color }, idx) => (
            <div key={label} className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${border} p-4 text-center shadow-sm animate-fade-in-up stagger-${idx + 1}`}>
              <div className="text-2xl mb-1.5">{emoji}</div>
              <p className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Mastery overview bar */}
        {totalTopics > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Overall Knowledge</h2>
              <span className="text-xs text-gray-400">{totalTopics} topics tracked</span>
            </div>
            <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5 mb-4">
              {masteredCount  > 0 && <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700" style={{ flex: masteredCount  }} />}
              {competentCount > 0 && <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700"    style={{ flex: competentCount }} />}
              {learningCount  > 0 && <div className="bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-700"  style={{ flex: learningCount  }} />}
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Mastered',  count: masteredCount,  dotColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { label: 'Competent', count: competentCount, dotColor: 'bg-blue-500',    textColor: 'text-blue-700'    },
                { label: 'Learning',  count: learningCount,  dotColor: 'bg-amber-400',   textColor: 'text-amber-700'   },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                  <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
                  <span className="text-xs text-gray-400">({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade Predictor CTA */}
        <Link
          href="/student/grade-predictor"
          className="flex items-center justify-between rounded-2xl p-5 sm:p-6 hover:scale-[1.01] hover:shadow-lg transition-all duration-200 shadow-sm text-white group"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)' }}
        >
          <div>
            <p className="font-bold text-base">🎯 Grade Predictor</p>
            <p className="text-sm opacity-85 mt-0.5">See your predicted ZIMSEC exam grade + action plan</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition">
            <Target size={22} className="text-white" />
          </div>
        </Link>

        {/* Per-subject knowledge profiles */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Subject Knowledge Profiles</h2>
          {subjects.length === 0 ? (
            <p className="text-gray-400 text-sm">No subjects enrolled.</p>
          ) : (
            subjects.map((subject, idx) => {
              const topics = masteryBySubject[subject.code] ?? []
              const gradient = SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length]
              return (
                <div key={subject.code} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Subject header strip */}
                  <div className={`bg-gradient-to-r ${gradient} px-5 py-3.5 flex items-center justify-between`}>
                    <h3 className="font-bold text-white text-sm">{subject.name}</h3>
                    <Link
                      href={`/student/quiz/${subject.code}`}
                      className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg transition border border-white/20"
                    >
                      Take Quiz
                    </Link>
                  </div>
                  <div className="p-4">
                    {topics.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No quiz attempts yet — take a quiz to build your profile!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((t) => {
                          const cfg = MASTERY_CONFIG[t.mastery_level as keyof typeof MASTERY_CONFIG] ?? MASTERY_CONFIG.not_started
                          return (
                            <span key={t.topic} className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              {t.topic}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3">🏆 Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
                  🏅 {b.badge_name}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
