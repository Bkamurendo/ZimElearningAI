import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, MessageSquare, BookOpen, Clock } from 'lucide-react'

export default async function TeacherStudentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type TeacherRow = { id: string; teacher_subjects: { subject_id: string; subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null }
  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id, teacher_subjects(subject_id, subjects(id, name, code, zimsec_level))')
    .eq('user_id', user.id)
    .single() as { data: TeacherRow | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  const subjects = (teacher.teacher_subjects ?? [])
    .map(ts => ts.subjects)
    .filter(Boolean) as { id: string; name: string; code: string; zimsec_level: string }[]

  const subjectIds = subjects.map(s => s.id)

  // Get enrolled students across all subjects
  type EnrolledRow = {
    student_id: string
    subject_id: string
    student_profiles: {
      id: string
      grade: string | null
      zimsec_level: string
      profiles: { id: string; full_name: string | null; email: string } | null
    } | null
  }

  const { data: enrolled } = await supabase
    .from('student_subjects')
    .select('student_id, subject_id, student_profiles(id, grade, zimsec_level, profiles(id, full_name, email))')
    .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none']) as { data: EnrolledRow[] | null; error: unknown }

  // Deduplicate students
  const studentMap = new Map<string, {
    studentId: string
    profileId: string
    name: string
    email: string
    grade: string | null
    level: string
    subjectIds: string[]
  }>()

  for (const row of enrolled ?? []) {
    const sp = row.student_profiles
    if (!sp) continue
    const p = Array.isArray(sp.profiles) ? sp.profiles[0] : sp.profiles
    if (!p) continue
    if (!studentMap.has(sp.id)) {
      studentMap.set(sp.id, {
        studentId: sp.id,
        profileId: p.id,
        name: p.full_name ?? p.email,
        email: p.email,
        grade: sp.grade,
        level: sp.zimsec_level,
        subjectIds: [],
      })
    }
    studentMap.get(sp.id)!.subjectIds.push(row.subject_id)
  }

  const students = Array.from(studentMap.values())

  // Fetch assignment submission stats per student
  const studentProfileIds = students.map(s => s.studentId)
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('student_id, score, assignment_id, graded_at')
    .in('student_id', studentProfileIds.length > 0 ? studentProfileIds : ['none']) as {
    data: { student_id: string; score: number | null; assignment_id: string; graded_at: string | null }[] | null
    error: unknown
  }

  // Fetch streak / last active info
  const { data: streaks } = await supabase
    .from('student_streaks')
    .select('student_id, current_streak, last_activity_date')
    .in('student_id', studentProfileIds.length > 0 ? studentProfileIds : ['none']) as {
    data: { student_id: string; current_streak: number; last_activity_date: string | null }[] | null
    error: unknown
  }

  const streakMap: Record<string, { streak: number; lastActive: string | null }> = {}
  for (const s of streaks ?? []) {
    streakMap[s.student_id] = { streak: s.current_streak, lastActive: s.last_activity_date }
  }

  const subMap: Record<string, number[]> = {}
  const totalSubMap: Record<string, number> = {}
  for (const s of submissions ?? []) {
    if (!subMap[s.student_id]) subMap[s.student_id] = []
    if (s.score !== null) subMap[s.student_id].push(s.score)
    totalSubMap[s.student_id] = (totalSubMap[s.student_id] ?? 0) + 1
  }

  const levelLabels: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }
  const levelColors: Record<string, string> = {
    primary: 'bg-green-100 text-green-700',
    olevel: 'bg-blue-100 text-blue-700',
    alevel: 'bg-purple-100 text-purple-700',
  }

  function daysSince(dateStr: string | null) {
    if (!dateStr) return null
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    return Math.floor(diff)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Subject overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {subjects.map(s => {
            const count = (enrolled ?? []).filter(e => e.subject_id === s.id).length
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 truncate">{s.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[s.zimsec_level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {levelLabels[s.zimsec_level] ?? s.zimsec_level}
                </span>
              </div>
            )
          })}
        </div>

        {/* Students table */}
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">No students enrolled yet</p>
            <p className="text-sm text-gray-400 mt-1">Students will appear here once they enrol in your subjects</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <h2 className="font-semibold text-gray-900 text-sm">All Students</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {students.map(s => {
                const scores = subMap[s.studentId] ?? []
                const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
                const totalSubs = totalSubMap[s.studentId] ?? 0
                const streak = streakMap[s.studentId]?.streak ?? 0
                const lastActive = streakMap[s.studentId]?.lastActive ?? null
                const days = daysSince(lastActive)
                const inactive = days === null || days > 7
                const initials = s.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <div key={s.studentId} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                      {initials}
                    </div>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelColors[s.level] ?? 'bg-gray-100 text-gray-600'}`}>
                          {levelLabels[s.level] ?? s.level}{s.grade ? ` · ${s.grade}` : ''}
                        </span>
                        <span className="text-xs text-gray-400">{s.subjectIds.length} subject{s.subjectIds.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-5 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <TrendingUp size={12} />
                        <span>{avg !== null ? `${avg}%` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <BookOpen size={12} />
                        <span>{totalSubs} sub{totalSubs !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={12} />
                        <span className={inactive ? 'text-red-500' : 'text-green-600'}>
                          {days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`}
                        </span>
                      </div>
                      {streak > 0 && (
                        <span className="text-orange-500 font-semibold">🔥 {streak}</span>
                      )}
                    </div>

                    {/* Message */}
                    <Link
                      href="/teacher/messages"
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title={`Message ${s.name}`}
                    >
                      <MessageSquare size={14} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
