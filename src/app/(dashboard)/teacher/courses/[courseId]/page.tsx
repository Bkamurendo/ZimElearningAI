import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createLesson, togglePublishCourse } from '@/app/actions/courses'
import { DeleteLessonButton } from './delete-lesson-button'

export default async function TeacherCourseDetailPage({
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
    published: boolean
    subject: { name: string; code: string } | null
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, published, subject:subjects(name, code)')
    .eq('id', params.courseId)
    .single() as { data: CourseData | null; error: unknown }

  if (!course) redirect('/teacher/courses')

  type LessonRow = {
    id: string
    title: string
    content_type: string
    order_index: number
  }
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content_type, order_index')
    .eq('course_id', params.courseId)
    .order('order_index') as { data: LessonRow[] | null; error: unknown }

  const contentTypeLabels: Record<string, string> = {
    text: 'Text lesson',
    video: 'Video',
    pdf: 'PDF',
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb + publish toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/teacher/courses" className="text-gray-400 hover:text-gray-600 transition">← My courses</Link>
            <span className="text-gray-200">/</span>
            <div>
              <h1 className="font-bold text-gray-900">{course.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{course.subject?.name}</p>
            </div>
          </div>
          <form action={togglePublishCourse as unknown as (fd: FormData) => void} className="flex-shrink-0">
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="published" value={String(course.published)} />
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition shadow-sm ${
                course.published
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {course.published ? 'Unpublish' : 'Publish'}
            </button>
          </form>
        </div>

        {/* Lessons list */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Lessons ({lessons?.length ?? 0})
          </h2>
          <div className="space-y-2">
            {(lessons ?? []).map((lesson, idx) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm"
              >
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-400">{contentTypeLabels[lesson.content_type]}</p>
                </div>
                <DeleteLessonButton lessonId={lesson.id} courseId={params.courseId} />
              </div>
            ))}
          </div>
        </section>

        {/* Add lesson form */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add lesson</h2>
          <form action={createLesson as unknown as (fd: FormData) => void} className="space-y-4">
            <input type="hidden" name="course_id" value={params.courseId} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Lesson title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="content_type"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="text">Text (Markdown)</option>
                <option value="video">Video (YouTube URL)</option>
                <option value="pdf">PDF (URL)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-gray-400 font-normal">(text or URL)</span>
              </label>
              <textarea
                name="content"
                required
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                placeholder="Paste your lesson content or URL here…"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Add lesson
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
