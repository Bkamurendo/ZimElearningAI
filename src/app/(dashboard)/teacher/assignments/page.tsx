import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, Plus } from 'lucide-react'
import AssignmentActions from './AssignmentActions'

export default async function TeacherAssignmentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  type AssignmentRow = {
    id: string
    title: string
    description: string
    due_date: string | null
    max_score: number
    created_at: string
    subject: { name: string; code: string } | null
    submission_count: number
  }

  const { data: rawAssignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, max_score, created_at, subject:subjects(name, code)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false }) as {
    data: Omit<AssignmentRow, 'submission_count'>[] | null
    error: unknown
  }

  const assignments = rawAssignments ?? []
  const ids = assignments.map(a => a.id)

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id')
    .in('assignment_id', ids.length > 0 ? ids : ['none']) as { data: { assignment_id: string }[] | null; error: unknown }

  const submissionCounts: Record<string, number> = {}
  for (const s of submissions ?? []) {
    submissionCounts[s.assignment_id] = (submissionCounts[s.assignment_id] ?? 0) + 1
  }

  const list: AssignmentRow[] = assignments.map(a => ({ ...a, submission_count: submissionCounts[a.id] ?? 0 }))

  const levelColor = (code: string | undefined) => {
    if (!code) return 'bg-gray-100 text-gray-600'
    if (code.includes('primary')) return 'bg-green-50 text-green-700'
    if (code.includes('olevel')) return 'bg-blue-50 text-blue-700'
    if (code.includes('alevel')) return 'bg-purple-50 text-purple-700'
    return 'bg-blue-50 text-blue-700'
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {list.length} assignment{list.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/teacher/assignments/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            New Assignment
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-green-400" />
            </div>
            <p className="font-semibold text-gray-700">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first assignment to get started.</p>
            <Link
              href="/teacher/assignments/new"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={15} />
              Create assignment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const isOverdue = a.due_date && new Date(a.due_date) < new Date()
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-900 text-sm">{a.title}</h2>
                        {a.subject && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(a.subject.code)}`}>
                            {a.subject.name}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{a.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                        {a.due_date && (
                          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                            📅 Due: {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>📊 Max: {a.max_score} pts</span>
                        <span className="font-medium text-gray-600">
                          {a.submission_count} submission{a.submission_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AssignmentActions
                        id={a.id}
                        title={a.title}
                        description={a.description}
                        dueDate={a.due_date}
                        maxScore={a.max_score}
                      />
                      <Link
                        href={`/teacher/assignments/${a.id}/submissions`}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                      >
                        Grade →
                      </Link>
                    </div>
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
