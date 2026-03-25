import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Users, BookOpen, GraduationCap, LayoutList, FileText, Shield, Library, Megaphone, Globe, BarChart2, BarChart3, Settings, Bell, ClipboardList, HelpCircle, Building2 } from 'lucide-react'

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
    { count: totalDocuments },
    { count: pendingModeration },
    { count: publishedDocuments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'ai_reviewed'),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'published'),
  ])

  // Fetch announcement count separately (table may not exist yet)
  let activeAnnouncements = 0
  let pendingTeachers = 0
  let totalQuestions = 0
  try {
    const { count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    activeAnnouncements = count ?? 0
  } catch { /* announcements table not yet created */ }
  try {
    const { count } = await supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)
    pendingTeachers = count ?? 0
  } catch { /* column may not exist yet */ }
  try {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
    totalQuestions = count ?? 0
  } catch { /* table may not exist yet */ }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const stats = [
    { label: 'Total users',    value: totalUsers ?? 0,        icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/users' },
    { label: 'Students',       value: totalStudents ?? 0,     icon: GraduationCap, color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/users' },
    { label: 'Subjects',       value: totalSubjects ?? 0,     icon: LayoutList,    color: 'text-purple-600', bg: 'bg-purple-50', href: null as string | null },
    { label: 'Documents',      value: totalDocuments ?? 0,    icon: Library,       color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/admin/documents' },
    { label: 'Published',      value: publishedDocuments ?? 0, icon: FileText,     color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/admin/documents' },
    { label: 'Need review',    value: pendingModeration ?? 0, icon: BarChart2,     color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/documents' },
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
            href ? (
              <Link key={label} href={href} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition group">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
              </Link>
            ) : (
              <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
              </div>
            )
          ))}
        </div>

        {/* Moderation alert */}
        {(pendingModeration ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">
                {pendingModeration} document{pendingModeration !== 1 ? 's' : ''} awaiting moderation review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Review AI-processed submissions before they go live</p>
            </div>
            <Link href="/admin/documents" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition flex-shrink-0">
              Review →
            </Link>
          </div>
        )}

        {/* Content Management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Content Management</h2>
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
                <p className="text-xs text-gray-500 mt-0.5">Upload courses &amp; lessons</p>
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
                  {totalDocuments ?? 0} docs · {publishedDocuments ?? 0} published
                </p>
              </div>
            </Link>
            <Link
              href="/admin/documents/fetch-web"
              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-purple-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition group"
            >
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition">
                <Globe size={20} className="text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Fetch from Web</p>
                <p className="text-xs text-gray-500 mt-0.5">Import content from URLs</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Platform Management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Platform Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/users" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition group">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
                <Users size={20} className="text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">User Management</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalUsers ?? 0} registered users</p>
              </div>
            </Link>
            <Link href="/admin/teachers" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition group">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition relative">
                <GraduationCap size={20} className="text-indigo-700" />
                {pendingTeachers > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingTeachers}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Teacher Approvals</p>
                <p className="text-xs text-gray-500 mt-0.5">{pendingTeachers > 0 ? `${pendingTeachers} pending` : 'All reviewed'}</p>
              </div>
            </Link>
            <Link href="/admin/announcements" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-amber-50 rounded-2xl border border-gray-100 hover:border-amber-200 transition group">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition">
                <Megaphone size={20} className="text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Announcements</p>
                <p className="text-xs text-gray-500 mt-0.5">{activeAnnouncements} active</p>
              </div>
            </Link>
            <Link href="/admin/notifications/send" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-orange-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition group">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition">
                <Bell size={20} className="text-orange-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Send Notification</p>
                <p className="text-xs text-gray-500 mt-0.5">Bulk push to users</p>
              </div>
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-violet-50 rounded-2xl border border-gray-100 hover:border-violet-200 transition group">
              <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition">
                <BarChart3 size={20} className="text-violet-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Analytics</p>
                <p className="text-xs text-gray-500 mt-0.5">Platform insights</p>
              </div>
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-slate-50 rounded-2xl border border-gray-100 hover:border-slate-200 transition group">
              <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition">
                <Settings size={20} className="text-slate-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Platform Settings</p>
                <p className="text-xs text-gray-500 mt-0.5">Feature flags &amp; limits</p>
              </div>
            </Link>
            <Link href="/admin/schools" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition group">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition">
                <Building2 size={20} className="text-indigo-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">School Licensing</p>
                <p className="text-xs text-gray-500 mt-0.5">Manage school accounts</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Curriculum & Learning */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Curriculum &amp; Learning</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/subjects" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-teal-50 rounded-2xl border border-gray-100 hover:border-teal-200 transition group">
              <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition">
                <LayoutList size={20} className="text-teal-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Curriculum Manager</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalSubjects ?? 0} subjects</p>
              </div>
            </Link>
            <Link href="/admin/questions" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-purple-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition group">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition">
                <HelpCircle size={20} className="text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Question Bank</p>
                <p className="text-xs text-gray-500 mt-0.5">{totalQuestions} questions</p>
              </div>
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 hover:border-gray-300 transition group">
              <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition">
                <ClipboardList size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Audit Logs</p>
                <p className="text-xs text-gray-500 mt-0.5">Admin action trail</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
