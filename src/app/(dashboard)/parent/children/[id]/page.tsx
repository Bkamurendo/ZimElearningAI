import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft, Flame, Star, BookOpen, Brain, Trophy, Target,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'

const LEVEL_LABEL: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default async function ChildDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: parentProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (parentProfile?.role !== 'parent') redirect(`/${parentProfile?.role}/dashboard`)

  // Verify this child belongs to this parent
  type ChildRow = {
    id: string; grade: string; zimsec_level: string
    user: { full_name: string; email: string } | null
  }
  const { data: child } = await supabase
    .from('student_profiles')
    .select('id, grade, zimsec_level, user:profiles(full_name, email)')
    .eq('id', params.id)
    .eq('parent_id', user.id)
    .single() as { data: ChildRow | null; error: unknown }

  if (!child) notFound()

  // ── Aggregate stats ──
  const { data: streak } = await supabase
    .from('student_streaks').select('current_streak, total_xp, longest_streak')
    .eq('student_id', child.id).single() as { data: { current_streak: number; total_xp: number; longest_streak: number } | null; error: unknown }

  const { count: lessons } = await supabase
    .from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', child.id)

  const { count: quizzes } = await supabase
    .from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', child.id)

  const { count: masteredTopics } = await supabase
    .from('topic_mastery').select('id', { count: 'exact', head: true })
    .eq('student_id', child.id).eq('mastery_level', 'mastered')

  // Recent quiz attempts (with scores)
  type QuizRow = { id: string; score: number | null; max_score: number | null; created_at: string }
  const { data: recentQuizzes } = await supabase
    .from('quiz_attempts').select('id, score, max_score, created_at')
    .eq('student_id', child.id)
    .order('created_at', { ascending: false })
    .limit(5) as { data: QuizRow[] | null; error: unknown }

  // Topics needing work
  type TopicRow = { topic: string; mastery_level: string }
  const { data: weakTopics } = await supabase
    .from('topic_mastery').select('topic, mastery_level')
    .eq('student_id', child.id).eq('mastery_level', 'learning')
    .limit(6) as { data: TopicRow[] | null; error: unknown }

  // Subject-level progress
  type SubjectEnrol = {
    subject: { id: string; name: string; code: string; zimsec_level: string } | null
  }
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(id, name, code, zimsec_level)')
    .eq('student_id', child.id)
    .limit(20) as { data: SubjectEnrol[] | null; error: unknown }

  const subjects = (enrolments ?? []).map(e => e.subject).filter(Boolean) as { id: string; name: string; code: string; zimsec_level: string }[]

  // Per-subject lesson + quiz counts
  type SubjectStat = { id: string; name: string; code: string; lessons: number; quizzes: number }
  const subjectStats: SubjectStat[] = []
  for (const s of subjects.slice(0, 8)) {
    const { count: sl } = await supabase
      .from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', child.id)
    const { count: sq } = await supabase
      .from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('student_id', child.id)
    subjectStats.push({ id: s.id, name: s.name, code: s.code, lessons: sl ?? 0, quizzes: sq ?? 0 })
  }

  // Badges
  type BadgeRow = { badge_name: string; earned_at: string }
  const { data: badges } = await supabase
    .from('student_badges').select('badge_name, earned_at')
    .eq('student_id', child.id)
    .order('earned_at', { ascending: false })
    .limit(6) as { data: BadgeRow[] | null; error: unknown }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Back + Header */}
        <Link href="/parent/children" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={16} /> Back to My Children
        </Link>

        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold">
              {(child.user?.full_name ?? 'S')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{child.user?.full_name}</h1>
              <p className="text-purple-200 text-sm mt-0.5">
                {child.grade} · {LEVEL_LABEL[child.zimsec_level] ?? child.zimsec_level}
              </p>
              {child.user?.email && (
                <p className="text-purple-300 text-xs mt-0.5">{child.user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Flame, label: 'Day Streak',    value: streak?.current_streak ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: Star,  label: 'Total XP',      value: (streak?.total_xp ?? 0).toLocaleString(), color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { icon: BookOpen, label: 'Lessons',    value: lessons ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Brain, label: 'Topics Mastered', value: masteredTopics ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
              <Icon size={18} className={`${color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Quiz performance */}
        {(recentQuizzes ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target size={15} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Recent Quiz Performance</h2>
                <p className="text-xs text-gray-400">{quizzes ?? 0} total quizzes taken</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {(recentQuizzes ?? []).map((q, i) => {
                const pct = q.max_score ? Math.round(((q.score ?? 0) / q.max_score) * 100) : null
                const good = pct !== null && pct >= 60
                return (
                  <div key={q.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <p className="text-sm text-gray-700">
                        {new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pct !== null ? (
                        <>
                          <span className={`text-sm font-bold ${good ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</span>
                          {good
                            ? <CheckCircle2 size={14} className="text-green-500" />
                            : <Clock size={14} className="text-amber-500" />}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{q.score ?? 0} pts</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Subjects enrolled */}
        {subjectStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={15} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Enrolled Subjects</h2>
                <p className="text-xs text-gray-400">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {subjectStats.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.code}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-bold text-blue-600">{s.lessons}</p>
                      <p className="text-[10px] text-gray-400">lessons</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-600">{s.quizzes}</p>
                      <p className="text-[10px] text-gray-400">quizzes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak topics */}
        {(weakTopics ?? []).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <h2 className="font-bold text-amber-800 text-sm">Needs More Practice</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(weakTopics ?? []).map((t, i) => (
                <span key={i} className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
                  {t.topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {(badges ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy size={15} className="text-amber-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-sm">Recent Achievements</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(badges ?? []).map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                  <span className="text-base">🏅</span>
                  <span className="text-xs font-semibold text-amber-800">{b.badge_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
