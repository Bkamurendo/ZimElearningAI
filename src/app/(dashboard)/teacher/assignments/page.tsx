import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  // Fetch submission counts
  const assignmentIds = assignments.map((a) => a.id)
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id')
    .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['none']) as {
    data: { assignment_id: string }[] | null
    error: unknown
  }

  const submissionCounts: Record<string, number> = {}
  for (const s of submissions ?? []) {
    submissionCounts[s.assignment_id] = (submissionCounts[s.assignment_id] ?? 0) + 1
  }

  const assignmentsWithCount: AssignmentRow[] = assignments.map((a) => ({
    ...a,
    submission_count: submissionCounts[a.id] ?? 0,
  }))

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {assignmentsWithCount.length} assignment{assignmentsWithCount.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/teacher/assignments/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            + New assignment
          </Link>
        </div>

        {assignmentsWithCount.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📋
            </div>
            <p className="font-semibold text-gray-700">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first assignment to get started.</p>
            <Link
              href="/teacher/assignments/new"
              className="inline-block mt-5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              Create assignment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assignmentsWithCount.map((assignment) => {
              const isOverdue =
                assignment.due_date && new Date(assignment.due_date) < new Date()
              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-900">{assignment.title}</h2>
                        {assignment.subject && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {assignment.subject.name}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                        {assignment.due_date && (
                          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                            📅 Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>Max: {assignment.max_score} pts</span>
                        <span className="font-medium text-gray-600">
                          {assignment.submission_count} submission{assignment.submission_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/teacher/assignments/${assignment.id}/submissions`}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                    >
                      View →
                    </Link>
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
