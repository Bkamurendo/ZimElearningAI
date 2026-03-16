import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const MASTERY_CONFIG = {
  mastered:    { label: 'Mastered',   color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  },
  competent:   { label: 'Competent',  color: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
  learning:    { label: 'Learning',   color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  not_started: { label: 'Not Started',color: 'bg-gray-200',   text: 'text-gray-500',   bg: 'bg-gray-50'   },
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

  // All subject enrolments
  type SubjectRow = { name: string; code: string } | null
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(name, code)')
    .eq('student_id', studentProfile.id) as { data: { subject: SubjectRow }[] | null; error: unknown }

  const subjects = (enrolments?.map((e) => e.subject).filter(Boolean) ?? []) as NonNullable<SubjectRow>[]

  // All topic mastery records
  const { data: masteryRows } = await supabase
    .from('topic_mastery')
    .select('subject_id, topic, mastery_level, updated_at')
    .eq('student_id', studentProfile.id) as {
      data: { subject_id: string; topic: string; mastery_level: string; updated_at: string }[] | null
      error: unknown
    }

  // Subject id map
  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id, code')
    .in('code', subjects.map((s) => s.code))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const codeToId = Object.fromEntries((subjectData ?? []).map((s) => [s.code, s.id]))
  const idToCode = Object.fromEntries((subjectData ?? []).map((s) => [s.id, s.code]))

  // Group mastery by subject code
  const masteryBySubject: Record<string, { topic: string; mastery_level: string }[]> = {}
  for (const row of masteryRows ?? []) {
    const code = idToCode[row.subject_id]
    if (!code) continue
    if (!masteryBySubject[code]) masteryBySubject[code] = []
    masteryBySubject[code].push({ topic: row.topic, mastery_level: row.mastery_level })
  }

  // Streak & XP
  const { data: streak } = await supabase
    .from('student_streaks')
    .select('*')
    .eq('student_id', studentProfile.id)
    .single() as { data: { current_streak: number; longest_streak: number; total_xp: number } | null; error: unknown }

  // Badges
  const { data: badges } = await supabase
    .from('student_badges')
    .select('badge_name, earned_at')
    .eq('student_id', studentProfile.id)
    .order('earned_at', { ascending: false }) as {
      data: { badge_name: string; earned_at: string }[] | null
      error: unknown
    }

  // Quiz attempts count
  const { count: totalQuizzes } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentProfile.id)

  // Overall mastery counts
  const allMastery = masteryRows ?? []
  const masteredCount = allMastery.filter((m) => m.mastery_level === 'mastered').length
  const competentCount = allMastery.filter((m) => m.mastery_level === 'competent').length
  const learningCount = allMastery.filter((m) => m.mastery_level === 'learning').length

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Progress</h1>
          <p className="text-sm text-gray-500 mt-0.5">Knowledge profile &amp; achievements</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: streak?.current_streak ?? 0, label: 'Day streak', emoji: '🔥', color: 'text-orange-500', bg: 'bg-orange-50' },
            { value: streak?.total_xp ?? 0, label: 'Total XP', emoji: '⭐', color: 'text-purple-600', bg: 'bg-purple-50' },
            { value: totalQuizzes ?? 0, label: 'Quizzes done', emoji: '🧠', color: 'text-blue-600', bg: 'bg-blue-50' },
            { value: masteredCount, label: 'Topics mastered', emoji: '🎯', color: 'text-green-600', bg: 'bg-green-50' },
          ].map(({ value, label, emoji, color, bg }) => (
            <div key={label} className={`bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm`}>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2 text-lg`}>
                {emoji}
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Mastery overview bar */}
        {allMastery.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Overall Knowledge</h2>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {masteredCount > 0 && <div className="bg-green-500 rounded-full" style={{ flex: masteredCount }} />}
              {competentCount > 0 && <div className="bg-blue-500 rounded-full" style={{ flex: competentCount }} />}
              {learningCount > 0 && <div className="bg-yellow-400 rounded-full" style={{ flex: learningCount }} />}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { label: 'Mastered', count: masteredCount, color: 'bg-green-500' },
                { label: 'Competent', count: competentCount, color: 'bg-blue-500' },
                { label: 'Learning', count: learningCount, color: 'bg-yellow-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs text-gray-600">{item.label} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade Predictor CTA */}
        <Link
          href="/student/grade-predictor"
          className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-5 sm:p-6 hover:opacity-95 transition shadow-sm"
        >
          <div>
            <p className="font-bold text-base">Grade Predictor</p>
            <p className="text-sm opacity-85 mt-0.5">See your predicted ZIMSEC exam grade + action plan</p>
          </div>
          <span className="text-3xl flex-shrink-0">🎯</span>
        </Link>

        {/* Per-subject knowledge profiles */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Subject Knowledge Profiles</h2>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No subjects enrolled.</p>
          ) : (
            subjects.map((subject) => {
              const topics = masteryBySubject[subject.code] ?? []
              return (
                <div key={subject.code} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <Link
                      href={`/student/quiz/${subject.code}`}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Take Quiz
                    </Link>
                  </div>
                  {topics.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No quiz attempts yet. Take a quiz to build your profile!</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topics.map((t) => {
                        const cfg = MASTERY_CONFIG[t.mastery_level as keyof typeof MASTERY_CONFIG] ?? MASTERY_CONFIG.not_started
                        return (
                          <span key={t.topic} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                            {t.topic}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-full font-medium">
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
