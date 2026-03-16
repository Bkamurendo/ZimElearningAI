import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus, ChevronRight } from 'lucide-react'

export default async function TeacherCoursesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = (await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  type CourseRow = {
    id: string
    title: string
    description: string | null
    published: boolean
    subject: { name: string; code: string } | null
  }

  const { data: courses } = (await supabase
    .from('courses')
    .select('id, title, description, published, subject:subjects(name, code)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })) as {
    data: CourseRow[] | null
    error: unknown
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Courses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {courses?.length ?? 0} course{(courses?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/teacher/courses/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            New course
          </Link>
        </div>

        {!courses || courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700 text-base">No courses yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first course to start teaching</p>
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={16} />
              Create course
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/courses/${c.id}`}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-150 shadow-sm"
              >
                {/* Subject badge */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-xs font-bold">
                    {c.subject?.code?.split('-')[1]?.slice(0, 2) ?? 'CO'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-400 mt-0.5 truncate">{c.description}</p>
                  )}
                  {c.subject && (
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {c.subject.name}
                    </p>
                  )}
                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-blue-400 transition flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
