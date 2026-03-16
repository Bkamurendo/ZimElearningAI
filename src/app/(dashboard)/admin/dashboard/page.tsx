import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Users, BookOpen, GraduationCap, LayoutList, FileText, Shield, Library } from 'lucide-react'

export default async function AdminDashboard() {
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

  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalSubjects },
    { count: totalCourses },
    { count: totalLessons },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Students', value: totalStudents ?? 0, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Subjects', value: totalSubjects ?? 0, icon: LayoutList, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Courses', value: totalCourses ?? 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Lessons', value: totalLessons ?? 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">ZimLearn Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{profile?.full_name}</span>
          <form action={logout}>
            <button className="text-sm text-red-500 hover:text-red-700 font-medium transition">Sign out</button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <p className="text-gray-400 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{firstName}</h1>
            <p className="mt-1 text-gray-400 text-sm">Platform administration dashboard</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Content Management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Content management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/seed-content"
              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-green-50 rounded-2xl border border-gray-100 hover:border-green-200 transition group"
            >
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition">
                <BookOpen size={20} className="text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Seed ZIMSEC Content</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload 10 courses &amp; 50 lessons
                  {(totalCourses ?? 0) > 0 && (
                    <span className="ml-1 text-green-600 font-medium">
                      ({totalCourses} uploaded)
                    </span>
                  )}
                </p>
              </div>
            </Link>
            <Link
              href="/admin/documents"
              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition group"
            >
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition">
                <Library size={20} className="text-indigo-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Document Library</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Review, approve &amp; manage ZIMSEC documents
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 opacity-50 cursor-not-allowed">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">User management</p>
                <p className="text-xs text-gray-500 mt-0.5">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
