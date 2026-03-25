import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createLesson, togglePublishCourse } from '@/app/actions/courses'
import LessonRow from './LessonRow'
import { BookOpen, Plus } from 'lucide-react'

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

  type LessonRow2 = {
    id: string
    title: string
    content_type: string
    content: string
    order_index: number
  }
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content_type, content, order_index')
    .eq('course_id', params.courseId)
    .order('order_index') as { data: LessonRow2[] | null; error: unknown }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <Link href="/teacher/courses" className="text-gray-400 hover:text-gray-600 transition">← My courses</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500 truncate max-w-[200px]">{course.subject?.name}</span>
            </div>
            <h1 className="font-bold text-gray-900 text-xl">{course.title}</h1>
            {course.description && <p className="text-sm text-gray-400 mt-0.5">{course.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/teacher/courses/${course.id}/edit`}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Edit details
            </Link>
            <form action={togglePublishCourse as unknown as (fd: FormData) => void}>
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
                {course.published ? 'Unpublish' : '● Publish'}
              </button>
            </form>
          </div>
        </div>

        {/* Lessons list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" />
              Lessons <span className="text-gray-400 font-normal text-sm">({lessons?.length ?? 0})</span>
            </h2>
          </div>

          {(lessons ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No lessons yet. Add your first lesson below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(lessons ?? []).map((lesson, idx) => (
                <LessonRow key={lesson.id} lesson={lesson} courseId={params.courseId} idx={idx} />
              ))}
            </div>
          )}
        </section>

        {/* Add lesson form */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-500" />
            Add New Lesson
          </h2>
          <form action={createLesson as unknown as (fd: FormData) => void} className="space-y-4">
            <input type="hidden" name="course_id" value={params.courseId} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
              <input
                name="title"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="e.g. Introduction to Photosynthesis"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  name="content_type"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="text">Text / Markdown</option>
                  <option value="video">Video (YouTube URL)</option>
                  <option value="pdf">PDF (URL)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-gray-400 font-normal">(write lesson text or paste URL)</span>
              </label>
              <textarea
                name="content"
                required
                rows={7}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                placeholder="Paste your lesson content or a YouTube/PDF URL here…"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Lesson
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
