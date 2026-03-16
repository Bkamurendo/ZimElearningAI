import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudentSubjectPage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams: { submitted?: string; error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('code', params.code)
    .single() as { data: { id: string; name: string; code: string; zimsec_level: string } | null; error: unknown }

  if (!subject) redirect('/student/dashboard')

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  // Courses with lesson counts + progress
  type CourseRow = {
    id: string
    title: string
    description: string | null
    published: boolean
    lesson_count: number
    completed_count: number
  }

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, published')
    .eq('subject_id', subject.id)
    .eq('published', true) as { data: { id: string; title: string; description: string | null; published: boolean }[] | null; error: unknown }

  const courseRows: CourseRow[] = []
  for (const c of courses ?? []) {
    const { count: lessonCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', c.id)

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentProfile?.id ?? '')
      .in('lesson_id', await getLessonIds(supabase, c.id))

    courseRows.push({
      ...c,
      lesson_count: lessonCount ?? 0,
      completed_count: completedCount ?? 0,
    })
  }

  // Assignments
  type AssignmentRow = {
    id: string
    title: string
    description: string
    due_date: string | null
    max_score: number
    submitted: boolean
    score: number | null
  }

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, max_score')
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: false }) as {
    data: { id: string; title: string; description: string; due_date: string | null; max_score: number }[] | null
    error: unknown
  }

  const assignmentRows: AssignmentRow[] = []
  for (const a of assignments ?? []) {
    const { data: sub } = await supabase
      .from('assignment_submissions')
      .select('score')
      .eq('assignment_id', a.id)
      .eq('student_id', studentProfile?.id ?? '')
      .single() as { data: { score: number | null } | null; error: unknown }

    assignmentRows.push({ ...a, submitted: !!sub, score: sub?.score ?? null })
  }

  const levelLabel =
    subject.zimsec_level === 'primary'
      ? 'Primary'
      : subject.zimsec_level === 'olevel'
      ? 'O-Level'
      : 'A-Level'

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-200">/</span>
          <h1 className="font-bold text-gray-900">{subject.name}</h1>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
            {levelLabel}
          </span>
        </div>

        {searchParams.submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-green-700 text-sm font-medium">
            ✓ Assignment submitted successfully!
          </div>
        )}

        {searchParams.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/student/quiz/${subject.code}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition shadow-sm"
          >
            🧠 Take Quiz
          </Link>
          <Link
            href={`/student/past-papers/${subject.code}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            📝 Past Papers
          </Link>
          <Link
            href={`/student/ai-tutor/${subject.code}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            💬 AI Tutor
          </Link>
        </div>

        {/* AI Tutor banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-base font-bold">AI Tutor</h2>
            <p className="text-sm opacity-90 mt-1">
              Get instant help with {subject.name} from your AI tutor
            </p>
          </div>
          <Link
            href={`/student/ai-tutor/${subject.code}`}
            className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition flex-shrink-0 shadow-sm"
          >
            Open tutor →
          </Link>
        </div>

        {/* Courses */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Courses ({courseRows.length})
          </h2>
          {courseRows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No courses published for this subject yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseRows.map((c) => {
                const pct =
                  c.lesson_count > 0
                    ? Math.round((c.completed_count / c.lesson_count) * 100)
                    : 0
                return (
                  <Link
                    key={c.id}
                    href={`/student/courses/${c.id}`}
                    className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all duration-150 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{c.title}</h3>
                        {c.description && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {c.completed_count}/{c.lesson_count} lessons completed
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-600 flex-shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Assignments */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assignments ({assignmentRows.length})
          </h2>
          {assignmentRows.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white rounded-xl border border-gray-200 p-6">
              No assignments for this subject yet.
            </p>
          ) : (
            <div className="space-y-3">
              {assignmentRows.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>Max: {a.max_score} marks</span>
                        {a.due_date && (
                          <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {a.submitted ? (
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                          Submitted
                        </span>
                        {a.score !== null && (
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {a.score}/{a.max_score}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {!a.submitted && (
                    <form
                      action={async (fd: FormData) => {
                        'use server'
                        const { submitAssignment } = await import('@/app/actions/assignments')
                        await submitAssignment(fd)
                      }}
                    >
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <input type="hidden" name="subject_code" value={params.code} />
                      <textarea
                        name="content"
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                        placeholder="Type your answer here…"
                      />
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        Submit
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

async function getLessonIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  courseId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
  return (data ?? []).map((l: { id: string }) => l.id)
}
