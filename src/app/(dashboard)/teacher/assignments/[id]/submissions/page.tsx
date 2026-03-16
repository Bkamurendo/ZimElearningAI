import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { gradeSubmission } from '@/app/actions/assignments'

export default async function SubmissionsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type AssignmentData = {
    id: string
    title: string
    description: string
    max_score: number
    due_date: string | null
    subject: { name: string; code: string } | null
  }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, description, max_score, due_date, subject:subjects(name, code)')
    .eq('id', params.id)
    .single() as { data: AssignmentData | null; error: unknown }

  if (!assignment) redirect('/teacher/assignments')

  type SubmissionRow = {
    id: string
    content: string
    submitted_at: string
    score: number | null
    feedback: string | null
    graded_at: string | null
    student: {
      user_id: string
      profiles: { full_name: string | null } | null
    } | null
  }

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select(
      'id, content, submitted_at, score, feedback, graded_at, student:student_profiles(user_id, profiles(full_name))'
    )
    .eq('assignment_id', params.id)
    .order('submitted_at') as { data: SubmissionRow[] | null; error: unknown }

  const allSubmissions = submissions ?? []
  const gradedCount = allSubmissions.filter((s) => s.score !== null).length

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/teacher/assignments" className="text-gray-400 hover:text-gray-600 transition">← Assignments</Link>
          <span className="text-gray-200">/</span>
          <div>
            <h1 className="font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{assignment.subject?.name} · Max {assignment.max_score} marks</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{allSubmissions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Submissions</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Graded</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-500">
              {allSubmissions.length - gradedCount}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
        </div>

        {/* Assignment details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Instructions</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{assignment.description}</p>
          {assignment.due_date && (
            <p className="text-xs text-gray-400 mt-2">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Submissions */}
        {allSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              Submissions ({allSubmissions.length})
            </h2>
            {allSubmissions.map((sub) => {
              const studentName =
                sub.student?.profiles?.full_name ?? 'Unknown student'
              const isGraded = sub.score !== null

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm ${
                    isGraded ? 'border-green-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{studentName}</p>
                      <p className="text-xs text-gray-400">
                        Submitted {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    {isGraded && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                        {sub.score}/{assignment.max_score}
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.content}</p>
                  </div>

                  {sub.feedback && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Your feedback</p>
                      <p className="text-sm text-blue-800">{sub.feedback}</p>
                    </div>
                  )}

                  {/* Grade form */}
                  <details className={isGraded ? '' : 'open'}>
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 select-none">
                      {isGraded ? 'Update grade' : 'Grade this submission'}
                    </summary>
                    <form
                      action={gradeSubmission as unknown as (fd: FormData) => void}
                      className="mt-3 space-y-3"
                    >
                      <input type="hidden" name="submission_id" value={sub.id} />
                      <input type="hidden" name="assignment_id" value={params.id} />

                      <div className="flex gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Score (/ {assignment.max_score})
                          </label>
                          <input
                            type="number"
                            name="score"
                            min={0}
                            max={assignment.max_score}
                            defaultValue={sub.score ?? ''}
                            required
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                        >
                          Save
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Feedback <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                          name="feedback"
                          rows={3}
                          defaultValue={sub.feedback ?? ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          placeholder="Write feedback for the student…"
                        />
                      </div>
                    </form>
                  </details>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
