export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus } from 'lucide-react'
import CourseActions from './CourseActions'

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
    created_at: string
    subject: { name: string; code: string } | null
    lesson_count: number
  }

  const { data: rawCourses } = (await supabase
    .from('courses')
    .select('id, title, description, published, created_at, subject:subjects(name, code)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })) as {
    data: Omit<CourseRow, 'lesson_count'>[] | null
    error: unknown
  }

  const courses = rawCourses ?? []

  // Fetch lesson counts
  const courseIds = courses.map(c => c.id)
  const { data: lessons } = await supabase
    .from('lessons')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none']) as { data: { course_id: string }[] | null; error: unknown }

  const lessonCounts: Record<string, number> = {}
  for (const l of lessons ?? []) {
    lessonCounts[l.course_id] = (lessonCounts[l.course_id] ?? 0) + 1
  }

  const coursesWithCount: CourseRow[] = courses.map(c => ({ ...c, lesson_count: lessonCounts[c.id] ?? 0 }))

  const levelColor = (code: string | undefined) => {
    if (!code) return 'from-slate-400 to-slate-600'
    if (code.includes('primary')) return 'from-green-400 to-emerald-600'
    if (code.includes('olevel')) return 'from-blue-400 to-indigo-600'
    if (code.includes('alevel')) return 'from-purple-400 to-violet-600'
    return 'from-blue-400 to-indigo-600'
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {coursesWithCount.length} course{coursesWithCount.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/teacher/courses/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            New Course
          </Link>
        </div>

        {coursesWithCount.length === 0 ? (
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
            {coursesWithCount.map((c) => (
              <div
                key={c.id}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-150 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Subject badge */}
                  <Link href={`/teacher/courses/${c.id}`} className="flex-shrink-0">
                    <div className={`w-12 h-12 bg-gradient-to-br ${levelColor(c.subject?.code)} rounded-xl flex items-center justify-center shadow-sm`}>
                      <span className="text-white text-xs font-bold">
                        {c.subject?.code?.split('-')[1]?.slice(0, 2).toUpperCase() ?? 'CO'}
                      </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <Link href={`/teacher/courses/${c.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.published ? '● Published' : '○ Draft'}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {c.subject && <span className="font-medium">{c.subject.name}</span>}
                      <span>·</span>
                      <span>{c.lesson_count} lesson{c.lesson_count !== 1 ? 's' : ''}</span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <CourseActions
                    courseId={c.id}
                    currentTitle={c.title}
                    currentDescription={c.description}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
