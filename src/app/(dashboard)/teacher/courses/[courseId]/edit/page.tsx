import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateCourse } from '@/app/actions/courses'

export default async function EditCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type CourseData = { id: string; title: string; description: string | null; subject: { name: string } | null }
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, subject:subjects(name)')
    .eq('id', params.courseId)
    .single() as { data: CourseData | null; error: unknown }

  if (!course) redirect('/teacher/courses')

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-gray-400 hover:text-gray-600 transition">← Back to course</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Edit Course Details</h1>
          <p className="text-sm text-gray-400">{course.subject?.name}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form action={updateCourse as unknown as (fd: FormData) => void} className="space-y-5">
            <input type="hidden" name="course_id" value={course.id} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input
                name="title"
                required
                defaultValue={course.title}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={course.description ?? ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                placeholder="Brief description of what students will learn…"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Save Changes
              </button>
              <Link
                href={`/teacher/courses/${course.id}`}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
