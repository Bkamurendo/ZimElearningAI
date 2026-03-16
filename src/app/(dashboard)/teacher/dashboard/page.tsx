import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BookOpen,
  ClipboardList,
  Clock,
  ChevronRight,
  PenLine,
  Plus,
} from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect(`/${profile?.role}/dashboard`)

  const { data: teacher } = (await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()) as { data: { id: string } | null; error: unknown }

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacher?.id ?? '')

  const { count: assignmentCount } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacher?.id ?? '')

  const { data: myAssignmentIds } = (await supabase
    .from('assignments')
    .select('id')
    .eq('teacher_id', teacher?.id ?? '')) as {
    data: { id: string }[] | null
    error: unknown
  }

  const ids = (myAssignmentIds ?? []).map((a) => a.id)
  const { count: pendingSubmissions } = await supabase
    .from('assignment_submissions')
    .select('id', { count: 'exact', head: true })
    .in('assignment_id', ids.length > 0 ? ids : ['none'])
    .is('graded_at', null)

  type RecentSub = {
    id: string
    submitted_at: string
    assignment: { id: string; title: string } | null
    student: { profiles: { full_name: string | null } | null } | null
  }
  const { data: recentSubs } = (await supabase
    .from('assignment_submissions')
    .select('id, submitted_at, assignment:assignments(id, title), student:student_profiles(profiles(full_name))')
    .in('assignment_id', ids.length > 0 ? ids : ['none'])
    .is('graded_at', null)
    .order('submitted_at', { ascending: false })
    .limit(5)) as { data: RecentSub[] | null; error: unknown }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Teacher'

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{firstName}!</h1>
            <p className="mt-1 text-blue-200 text-sm">Teacher Dashboard · ZimLearn</p>

            {(pendingSubmissions ?? 0) > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                <Clock size={14} className="text-yellow-300" />
                <span className="font-semibold">
                  {pendingSubmissions} submission{(pendingSubmissions ?? 0) > 1 ? 's' : ''} awaiting grading
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: 'Courses',
              value: courseCount ?? 0,
              icon: BookOpen,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Assignments',
              value: assignmentCount ?? 0,
              icon: PenLine,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'To grade',
              value: pendingSubmissions ?? 0,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/teacher/courses"
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-150 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
                <BookOpen size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">My Courses</p>
                <p className="text-sm text-gray-500">Manage lessons &amp; content</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition" />
            </Link>

            <Link
              href="/teacher/assignments"
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all duration-150 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition">
                <ClipboardList size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Assignments</p>
                <p className="text-sm text-gray-500">Create &amp; grade student work</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-green-400 transition" />
            </Link>

            <Link
              href="/teacher/courses/new"
              className="group bg-white rounded-2xl border border-dashed border-gray-200 p-5 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                <Plus size={20} className="text-gray-400 group-hover:text-blue-500 transition" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 group-hover:text-blue-700 transition">New Course</p>
                <p className="text-sm text-gray-400">Create a new lesson course</p>
              </div>
            </Link>

            <Link
              href="/teacher/assignments/new"
              className="group bg-white rounded-2xl border border-dashed border-gray-200 p-5 hover:border-green-300 hover:bg-green-50 transition-all duration-150 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition">
                <Plus size={20} className="text-gray-400 group-hover:text-green-500 transition" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 group-hover:text-green-700 transition">New Assignment</p>
                <p className="text-sm text-gray-400">Assign work to students</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Pending submissions */}
        {(recentSubs ?? []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Submissions to Grade</h2>
              <Link
                href="/teacher/assignments"
                className="text-xs text-blue-600 font-medium hover:text-blue-700 transition"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {(recentSubs ?? []).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/teacher/assignments/${sub.assignment?.id}/submissions`}
                  className="flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-800 text-xs font-bold">
                        {(sub.student?.profiles?.full_name ?? 'S')[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {sub.student?.profiles?.full_name ?? 'Student'}
                      </p>
                      <p className="text-xs text-gray-500">{sub.assignment?.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-700 font-semibold bg-amber-200 px-2.5 py-1 rounded-full group-hover:bg-amber-300 transition">
                    Grade →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
