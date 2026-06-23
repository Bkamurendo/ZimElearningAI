export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { submitAssignment } from '@/app/actions/assignments'
import { ClipboardList, ChevronDown } from 'lucide-react'

export const metadata = { title: 'My Assignments — ZimLearn' }

export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: { tab?: string; submitted?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentProfile } = await supabase
    .from('student_profiles').select('id').eq('user_id', user.id).single() as {
    data: { id: string } | null; error: unknown
  }
  if (!studentProfile) redirect('/student/dashboard')

  // Enrolled subjects
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject_id, subjects(id, name, code, zimsec_level)')
    .eq('student_id', studentProfile.id) as {
    data: { subject_id: string; subjects: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null
    error: unknown
  }

  const subjectIds = (enrolments ?? []).map(e => e.subject_id)

  // All assignments for enrolled subjects
  const { data: assignmentsRaw } = subjectIds.length > 0
    ? await supabase
        .from('assignments')
        .select('id, title, description, due_date, max_score, subject_id, subjects(name, code, zimsec_level)')
        .in('subject_id', subjectIds)
        .order('created_at', { ascending: false }) as {
        data: {
          id: string; title: string; description: string; due_date: string | null
          max_score: number; subject_id: string
          subjects: { name: string; code: string; zimsec_level: string } | null
        }[] | null; error: unknown
      }
    : { data: [] as never[] }

  const assignments = assignmentsRaw ?? []
  const assignmentIds = assignments.map(a => a.id)

  // All submissions for this student
  const { data: submissionsRaw } = assignmentIds.length > 0
    ? await supabase
        .from('assignment_submissions')
        .select('assignment_id, score, feedback, submitted_at, graded_at, content')
        .eq('student_id', studentProfile.id)
        .in('assignment_id', assignmentIds) as {
        data: {
          assignment_id: string; score: number | null; feedback: string | null
          submitted_at: string; graded_at: string | null; content: string
        }[] | null; error: unknown
      }
    : { data: [] as never[] }

  const subMap: Record<string, typeof submissionsRaw extends (infer T)[] | null ? T : never> = {}
  for (const s of (submissionsRaw ?? [])) {
    subMap[s.assignment_id] = s
  }

  type AssignmentRow = {
    id: string; title: string; description: string; due_date: string | null
    max_score: number; subject_id: string
    subject: { name: string; code: string; zimsec_level: string } | null
    submitted: boolean; graded: boolean
    score: number | null; feedback: string | null; content: string | null
    overdue: boolean
  }

  const rows: AssignmentRow[] = assignments.map(a => {
    const sub = subMap[a.id]
    const subj = a.subjects as unknown as { name: string; code: string; zimsec_level: string } | null
    return {
      id: a.id, title: a.title, description: a.description,
      due_date: a.due_date, max_score: a.max_score, subject_id: a.subject_id,
      subject: subj,
      submitted: !!sub,
      graded: sub?.graded_at != null,
      score: sub?.score ?? null,
      feedback: sub?.feedback ?? null,
      content: sub?.content ?? null,
      overdue: !sub && !!a.due_date && new Date(a.due_date) < new Date(),
    }
  })

  const tab = searchParams.tab ?? 'all'
  const filtered = rows.filter(r => {
    if (tab === 'pending') return !r.submitted
    if (tab === 'submitted') return r.submitted && !r.graded
    if (tab === 'graded') return r.graded
    return true
  })

  const pendingCount = rows.filter(r => !r.submitted).length
  const submittedCount = rows.filter(r => r.submitted && !r.graded).length
  const gradedCount = rows.filter(r => r.graded).length

  const levelColors: Record<string, string> = {
    primary: 'bg-green-100 text-green-700',
    olevel: 'bg-blue-100 text-blue-700',
    alevel: 'bg-purple-100 text-purple-700',
  }

  const TABS = [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'submitted', label: 'Submitted', count: submittedCount },
    { key: 'graded', label: 'Graded', count: gradedCount },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-orange-100 hover:text-white text-sm mb-4 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Assignments</h1>
              <p className="text-orange-100 text-sm">{rows.length} total · {pendingCount} pending</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {searchParams.submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-green-700 text-sm font-medium">
            ✓ Assignment submitted successfully!
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <Link key={t.key} href={`/student/assignments?tab=${t.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                tab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            </Link>
          ))}
        </div>

        {/* Assignment cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <ClipboardList size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No {tab === 'all' ? '' : tab} assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {a.subject && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[a.subject.zimsec_level] ?? 'bg-gray-100 text-gray-600'}`}>
                            {a.subject.name}
                          </span>
                        )}
                        {a.overdue && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Overdue</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Max: {a.max_score} marks</span>
                        {a.due_date && (
                          <span className={a.overdue ? 'text-red-500 font-medium' : ''}>
                            Due: {new Date(a.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {a.graded ? (
                        <div>
                          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Graded</span>
                          {a.score !== null && (
                            <p className="text-lg font-bold text-gray-900 mt-1">{a.score}<span className="text-xs text-gray-400">/{a.max_score}</span></p>
                          )}
                        </div>
                      ) : a.submitted ? (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Submitted</span>
                      ) : (
                        <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Pending</span>
                      )}
                    </div>
                  </div>

                  {/* Feedback */}
                  {a.graded && a.feedback && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        <ChevronDown size={14} /> View feedback
                      </summary>
                      <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-gray-700">
                        {a.feedback}
                      </div>
                    </details>
                  )}

                  {/* Submit form */}
                  {!a.submitted && a.subject && (
                    <form action={submitAssignment as unknown as (fd: FormData) => void} className="mt-4 pt-4 border-t border-gray-50">
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <input type="hidden" name="subject_code" value={a.subject.code} />
                      <input type="hidden" name="redirect_to" value="/student/assignments?submitted=1" />
                      <textarea
                        name="content"
                        required
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none"
                        placeholder="Type your answer here…"
                      />
                      <button type="submit"
                        className="mt-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                        Submit Answer
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
