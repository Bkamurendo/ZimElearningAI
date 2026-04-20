export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, TrendingDown, AlertTriangle, CheckCircle2, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function TeacherAnalyticsPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
    if (profile?.role?.toLowerCase() !== 'teacher') {
      const safeRole = profile?.role?.toLowerCase() || 'teacher'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const { data: teacher } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single() as { data: { id: string } | null; error: unknown }

    // Get teacher's subjects
    type SubRow = { subject: { id: string; name: string; code: string } | null }
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name, code)')
      .eq('teacher_id', teacher?.id ?? '') as { data: SubRow[] | null; error: unknown }

    const subjectIds = teacherSubjects?.map(ts => ts.subject?.id).filter(Boolean) as string[] ?? []

    // Get students enrolled in teacher's subjects
    type StudentSubRow = { student_id: string; subject_id: string }
    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('student_id, subject_id')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none']) as { data: StudentSubRow[] | null; error: unknown }

    const studentIds = Array.from(new Set((enrolments ?? []).map(e => e.student_id)))

    // Get student profiles with names
    type StudentProfile = { id: string; user_id: string; profiles: { full_name: string | null } | null }
    const { data: studentProfiles } = await supabase
      .from('student_profiles')
      .select('id, user_id, profiles(full_name)')
      .in('id', studentIds.length > 0 ? studentIds : ['none']) as { data: StudentProfile[] | null; error: unknown }

    // Get quiz attempts for analysis
    type QuizRow = { student_id: string; subject_id: string; score: number; total: number; created_at: string }
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('student_id, subject_id, score, total, created_at')
      .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none'])
      .order('created_at', { ascending: false }) as { data: QuizRow[] | null; error: unknown }

    // Get streaks (last activity)
    type StreakRow = { student_id: string; current_streak: number; updated_at: string }
    const { data: streaks } = await supabase
      .from('student_streaks')
      .select('student_id, current_streak, updated_at')
      .in('student_id', studentIds.length > 0 ? studentIds : ['none']) as { data: StreakRow[] | null; error: unknown }

    // Get topic mastery
    type MasteryRow = { student_id: string; subject_id: string; topic: string; mastery_level: string }
    const { data: mastery } = await supabase
      .from('topic_mastery')
      .select('student_id, subject_id, topic, mastery_level')
      .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none']) as { data: MasteryRow[] | null; error: unknown }

    // Compute per-student analytics
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const analytics = (studentProfiles ?? []).map(sp => {
      const name = sp.profiles?.full_name ?? 'Unknown Student'
      const attempts = (quizAttempts ?? []).filter(q => q.student_id === sp.id)
      const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((s, q) => s + (q.score / q.total * 100), 0) / attempts.length)
        : null
      const streak = streaks?.find(s => s.student_id === sp.id)
      const lastActive = streak?.updated_at ? new Date(streak.updated_at) : null
      const inactive = lastActive ? lastActive < sevenDaysAgo : true
      const studentMastery = (mastery ?? []).filter(m => m.student_id === sp.id)
      const struggling = studentMastery.filter(m => m.mastery_level === 'learning').length
      const mastered = studentMastery.filter(m => m.mastery_level === 'mastered').length
      return { id: sp.id, name, avgScore, streak: streak?.current_streak ?? 0, inactive, struggling, mastered, attemptCount: attempts.length }
    })

    const avgClassScore = analytics.filter(s => s.avgScore !== null).length > 0
      ? Math.round(analytics.filter(s => s.avgScore !== null).reduce((s, a) => s + (a.avgScore ?? 0), 0) / analytics.filter(s => s.avgScore !== null).length)
      : 0

    const strugglingStudents = analytics.filter(s => (s.avgScore !== null && s.avgScore < 50) || s.struggling > 3).sort((a, b) => (a.avgScore ?? 100) - (b.avgScore ?? 100))
    const inactiveStudents = analytics.filter(s => s.inactive)
    const topStudents = analytics.filter(s => s.avgScore !== null && s.avgScore >= 70).sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase">Student Analytics</h1>
            <p className="text-sm text-gray-500 mt-1 uppercase">Performance insights across your subjects</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Students', value: studentIds.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Class Average', value: `${avgClassScore}%`, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Struggling', value: strugglingStudents.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Inactive 7d', value: inactiveStudents.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon size={17} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase">{label}</p>
              </div>
            ))}
          </div>

          {strugglingStudents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-red-50/50">
                <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-red-800 uppercase">Needs Attention ({strugglingStudents.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {strugglingStudents.slice(0, 8).map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold uppercase">{s.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 uppercase">{s.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{s.struggling} weak topics · {s.attemptCount} quizzes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {s.avgScore !== null ? (
                        <span className={`text-sm font-bold ${s.avgScore < 40 ? 'text-red-600' : 'text-amber-600'}`}>{s.avgScore}%</span>
                      ) : (
                        <span className="text-xs text-gray-400 uppercase">No quizzes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveStudents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-amber-50/50">
                <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Clock size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-amber-800 uppercase">Inactive 7+ Days ({inactiveStudents.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {inactiveStudents.slice(0, 6).map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold uppercase">{s.name[0]}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 uppercase">{s.name}</p>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium uppercase">
                      {s.streak === 0 ? 'No streak' : `${s.streak}d streak`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topStudents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 bg-emerald-50/50">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-emerald-800 uppercase">Top Performers ({topStudents.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {topStudents.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold uppercase">{s.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 uppercase">{s.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{s.mastered} topics mastered · {s.streak}d streak</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{s.avgScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentIds.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 uppercase">No student data yet</p>
              <p className="text-sm text-gray-400 mt-1 uppercase">Students will appear here once they enrol in your subjects</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (err) {
    console.error('[TeacherAnalytics] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <BarChart3 size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Analytics Unavailable</h2>
        <p className="text-slate-500 max-w-xs">We encountered an error while loading your class analytics. Please try again or contact support.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
