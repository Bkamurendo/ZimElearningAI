export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookMarked } from 'lucide-react'

export default async function GradebookPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type TeacherRow = { id: string }
  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: TeacherRow | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  // Get all assignments for this teacher
  type AssignRow = { id: string; title: string; max_score: number; subject: { name: string } | null }
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, max_score, subject:subjects(name)')
    .eq('teacher_id', teacher.id)
    .order('created_at') as { data: AssignRow[] | null; error: unknown }

  const assignList = assignments ?? []

  // Get all submissions for those assignments
  type SubRow = {
    id: string
    assignment_id: string
    student_id: string
    score: number | null
    graded_at: string | null
    student_profiles: { id: string; profiles: { full_name: string | null; email: string } | null } | null
  }

  const assignIds = assignList.map(a => a.id)
  const { data: rawSubs } = await supabase
    .from('assignment_submissions')
    .select('id, assignment_id, student_id, score, graded_at, student_profiles(id, profiles(full_name, email))')
    .in('assignment_id', assignIds.length > 0 ? assignIds : ['none']) as { data: SubRow[] | null; error: unknown }

  const subs = rawSubs ?? []

  // Build student map
  const studentMap = new Map<string, { id: string; name: string }>()
  for (const s of subs) {
    const sp = s.student_profiles
    if (!sp) continue
    const p = Array.isArray(sp.profiles) ? sp.profiles[0] : sp.profiles
    if (!p) continue
    if (!studentMap.has(sp.id)) {
      studentMap.set(sp.id, { id: sp.id, name: p.full_name ?? p.email })
    }
  }

  // Build grade matrix: studentId → assignmentId → { score, maxScore }
  const gradeMatrix: Record<string, Record<string, { score: number | null; graded: boolean }>> = {}
  for (const s of subs) {
    const sp = s.student_profiles
    if (!sp) continue
    if (!gradeMatrix[sp.id]) gradeMatrix[sp.id] = {}
    gradeMatrix[sp.id][s.assignment_id] = { score: s.score, graded: !!s.graded_at }
  }

  const students = Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  function cellColor(score: number | null, max: number, graded: boolean) {
    if (!graded) return 'bg-amber-50 text-amber-600' // submitted not graded
    if (score === null) return 'bg-gray-50 text-gray-400'
    const pct = (score / max) * 100
    if (pct >= 75) return 'bg-green-50 text-green-700 font-semibold'
    if (pct >= 50) return 'bg-blue-50 text-blue-700'
    if (pct >= 40) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-700'
  }

  function calcAverage(studentId: string) {
    const scores: number[] = []
    for (const a of assignList) {
      const cell = gradeMatrix[studentId]?.[a.id]
      if (cell?.score !== null && cell?.score !== undefined) {
        scores.push((cell.score / a.max_score) * 100)
      }
    }
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 max-w-5xl">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked size={22} className="text-blue-500" />
            Grade Book
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} students · {assignList.length} assignments</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-xs mb-4 max-w-5xl">
          <span className="font-semibold text-gray-500">Key:</span>
          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded font-medium">≥75% Pass with credit</span>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">50–74% Pass</span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded">40–49% Borderline</span>
          <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">&lt;40% Fail</span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded">Submitted (ungraded)</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded">— Not submitted</span>
        </div>

        {assignList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm max-w-5xl">
            <p className="font-semibold text-gray-700">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Create assignments to populate the grade book</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm max-w-5xl">
            <p className="font-semibold text-gray-700">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Grade book will populate when students submit assignments</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[160px] sticky left-0 bg-gray-50 z-10">Student</th>
                  {assignList.map(a => (
                    <th key={a.id} className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[100px]">
                      <div className="truncate max-w-[90px] mx-auto" title={a.title}>{a.title}</div>
                      <div className="font-normal text-gray-400">/{a.max_score}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold text-gray-600 text-center min-w-[70px]">Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => {
                  const avg = calcAverage(s.id)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                            {s.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span className="truncate max-w-[110px]" title={s.name}>{s.name}</span>
                        </div>
                      </td>
                      {assignList.map(a => {
                        const cell = gradeMatrix[s.id]?.[a.id]
                        if (!cell) return (
                          <td key={a.id} className="px-3 py-3 text-center text-gray-300">—</td>
                        )
                        return (
                          <td key={a.id} className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs ${cellColor(cell.score, a.max_score, cell.graded)}`}>
                              {cell.graded ? (cell.score ?? '?') : 'Pending'}
                            </span>
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-center">
                        {avg !== null ? (
                          <span className={`font-bold ${avg >= 75 ? 'text-green-600' : avg >= 50 ? 'text-blue-600' : avg >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            {avg}%
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
