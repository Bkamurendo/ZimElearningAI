export const dynamic = 'force-dynamic';
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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { isRedirectError } from 'next/dist/client/components/redirect'

export default async function TeacherDashboard() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'teacher') {
      const safeRole = profile?.role?.toLowerCase() || 'teacher'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

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
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    const stats = [
      {
        label: 'Courses',
        value: courseCount ?? 0,
        icon: BookOpen,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-t-blue-500',
      },
      {
        label: 'Assignments',
        value: assignmentCount ?? 0,
        icon: PenLine,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-t-emerald-500',
      },
      {
        label: 'To grade',
        value: pendingSubmissions ?? 0,
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-t-amber-500',
      },
    ]

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Welcome banner */}
          <div
            className="relative text-white rounded-2xl p-6 sm:p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)' }}
          >
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/3 translate-x-1/4"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1 uppercase">{greeting},</p>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
                    👨‍🏫 {firstName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                      Teacher Portal
                    </span>
                    {(pendingSubmissions ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-400/30 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                        <Clock size={11} />
                        {pendingSubmissions} to grade
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-center hidden sm:block border border-white/20">
                  <p className="text-2xl font-bold">{(courseCount ?? 0) + (assignmentCount ?? 0)}</p>
                  <p className="text-blue-100 text-xs mt-0.5 font-medium uppercase">Total content</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg, border }, _idx) => (
              <div
                key={label}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 border-t-4 ${border}`}
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium uppercase">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/teacher/courses"
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
                  <BookOpen size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 uppercase">My Courses</p>
                  <p className="text-sm text-gray-400 uppercase">Manage lessons &amp; content</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition" />
              </Link>

              <Link
                href="/teacher/assignments"
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                  <ClipboardList size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 uppercase">Assignments</p>
                  <p className="text-sm text-gray-400 uppercase">Create &amp; grade student work</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition" />
              </Link>

              <Link
                href="/teacher/resources/generate"
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-200 group-hover:scale-105 transition-transform">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 uppercase">AI Generator</p>
                  <p className="text-sm text-gray-400 uppercase">Generate teaching materials</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-violet-500 transition" />
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/teacher/courses/new"
                  className="group bg-white rounded-2xl border border-dashed border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-150 flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
                    <Plus size={18} className="text-gray-400 group-hover:text-blue-500 transition" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 group-hover:text-blue-700 transition text-sm uppercase">New Course</p>
                    <p className="text-xs text-gray-400 uppercase">Create course</p>
                  </div>
                </Link>

                <Link
                  href="/teacher/assignments/new"
                  className="group bg-white rounded-2xl border border-dashed border-gray-200 p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-150 flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition">
                    <Plus size={18} className="text-gray-400 group-hover:text-emerald-500 transition" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 group-hover:text-emerald-700 transition text-sm uppercase">New Task</p>
                    <p className="text-xs text-gray-400 uppercase">Assign work</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {(recentSubs ?? []).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Clock size={13} className="text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800 uppercase">Submissions to Grade</h2>
                  <span className="text-xs bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {pendingSubmissions}
                  </span>
                </div>
                <Link href="/teacher/assignments" className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition flex items-center gap-1 uppercase">
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {(recentSubs ?? []).map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/teacher/assignments/${sub.assignment?.id}/submissions`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-amber-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {(sub.student?.profiles?.full_name ?? 'S')[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 uppercase">
                          {sub.student?.profiles?.full_name ?? 'Student'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">{sub.assignment?.title}</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-3 py-1.5 rounded-full group-hover:bg-amber-200 transition flex items-center gap-1 uppercase">
                      Grade <ChevronRight size={11} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[TeacherDashboard] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <ClipboardList size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Dashboard Unavailable</h2>
        <p className="text-slate-500 max-w-xs">We encountered an error while loading your teacher dashboard. Please try again or contact support.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
