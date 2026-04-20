export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudentCoursePage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type CourseData = {
    id: string
    title: string
    description: string | null
    subject: { name: string; code: string; zimsec_level: string } | null
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, subject:subjects(name, code, zimsec_level)')
    .eq('id', params.courseId)
    .eq('published', true)
    .single() as { data: CourseData | null; error: unknown }

  if (!course) redirect('/student/dashboard')

  type LessonRow = { id: string; title: string; content_type: string; order_index: number }
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content_type, order_index')
    .eq('course_id', params.courseId)
    .order('order_index') as { data: LessonRow[] | null; error: unknown }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  const lessonIds = (lessons ?? []).map((l) => l.id)
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', studentProfile?.id ?? '')
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['none']) as {
    data: { lesson_id: string }[] | null
    error: unknown
  }

  const completedIds = new Set((progressData ?? []).map((p) => p.lesson_id))
  const totalLessons = lessons?.length ?? 0
  const completedCount = completedIds.size
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const contentTypeIcon: Record<string, string> = {
    text: '📄',
    video: '▶️',
    pdf: '📎',
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/student/subjects/${course.subject?.code}`}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ← {course.subject?.name}
          </Link>
          <span className="text-gray-200">/</span>
          <span className="font-bold text-gray-900 truncate">{course.title}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="text-gray-600 mt-2">{course.description}</p>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">
                {completedCount}/{totalLessons} lessons completed
              </span>
              <span className="font-bold text-green-600">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 px-1">Lessons</h2>
          {(lessons ?? []).map((lesson, idx) => {
            const done = completedIds.has(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={`/student/lessons/${lesson.id}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition ${
                  done
                    ? 'bg-green-50 border-green-200 hover:border-green-400'
                    : 'bg-white border-gray-100 hover:border-green-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    done
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {done ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                </div>
                <span className="text-lg flex-shrink-0">
                  {contentTypeIcon[lesson.content_type] ?? '📄'}
                </span>
              </Link>
            )
          })}
          {totalLessons === 0 && (
            <p className="text-gray-500 text-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              No lessons yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
