import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Users, BookOpen, GraduationCap, LayoutList, Shield, Library, Megaphone, Globe, BarChart2, BarChart3, Settings, Bell, ClipboardList, HelpCircle, Building2, CreditCard, Clock, TrendingUp, Activity, FileText, Monitor, Brain, MessageSquare, AlertTriangle } from 'lucide-react'

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
    { data: trialStats },
    { data: paymentStats },
    { data: cohortData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'ai_reviewed'),
    supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }).eq('moderation_status', 'published'),
    // Trial statistics
    supabase.from('profiles').select('id, full_name, email, plan, trial_ends_at, subscription_expires_at').eq('role', 'student').not('trial_ends_at', 'is', null),
    // Payment statistics  
    supabase.from('profiles').select('plan, subscription_expires_at').eq('role', 'student').not('plan', 'is', null),
    // Cohort data (registrations by month)
    supabase.from('profiles').select('created_at, role').gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Trial stats
  const trialNow = new Date().toISOString()
  const trialTodayEnd = new Date()
  trialTodayEnd.setHours(23, 59, 59, 999)

  let activeTrialsCount = 0
  let endingTodayCount = 0
  try {
    const { count: at } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .gt('trial_ends_at', trialNow)
      .eq('plan', 'free')
    activeTrialsCount = at ?? 0
  } catch { /* trial_ends_at column may not exist yet */ }
  try {
    const { count: et } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .gt('trial_ends_at', trialNow)
      .lt('trial_ends_at', trialTodayEnd.toISOString())
      .eq('plan', 'free')
    endingTodayCount = et ?? 0
  } catch { /* trial_ends_at column may not exist yet */ }

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

  // Process trial and payment statistics
  const now = new Date()
  const trialUsers = trialStats?.filter(p => p.trial_ends_at) || []
  const activeTrials = trialUsers.filter(p => new Date(p.trial_ends_at) > now)
  const expiredTrials = trialUsers.filter(p => new Date(p.trial_ends_at) <= now)
  const expiringSoon = trialUsers.filter(p => {
    const daysLeft = Math.ceil((new Date(p.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 3
  })

  const paidUsers = paymentStats?.filter(p => p.plan !== 'free') || []
  const premiumUsers = paidUsers.filter(p => p.plan === 'premium')
  const expiredSubscriptions = paidUsers.filter(p => p.subscription_expires_at && new Date(p.subscription_expires_at) < now)

  // Process cohort data
  const cohortByMonth = cohortData?.reduce((acc, user) => {
    const month = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const stats = [
    { label: 'Total users',    value: totalUsers ?? 0,        icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/users' },
    { label: 'Students',       value: totalStudents ?? 0,     icon: GraduationCap, color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/users' },
    { label: 'Subjects',       value: totalSubjects ?? 0,     icon: LayoutList,    color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/subjects' },
    { label: 'Active Trials',  value: activeTrials.length,    icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/trials' },
    { label: 'Paid Users',     value: paidUsers.length,       icon: CreditCard,    color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/payments' },
    { label: 'Published Docs', value: publishedDocuments ?? 0, icon: FileText,     color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/admin/documents' },
    { label: 'Need review',    value: pendingModeration ?? 0, icon: BarChart2,     color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/admin/documents' },
    { label: 'Trials ending today', value: endingTodayCount,  icon: AlertTriangle, color: endingTodayCount > 0 ? 'text-red-600' : 'text-gray-400', bg: endingTodayCount > 0 ? 'bg-red-50' : 'bg-gray-50', href: '/admin/trials' },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
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

        {/* Churn alert banner */}
        {endingTodayCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-red-800">
                  {endingTodayCount} trial{endingTodayCount !== 1 ? 's' : ''} expiring today
                </p>
                <p className="text-sm text-red-600">Send reminders to prevent churn</p>
              </div>
            </div>
            <Link href="/admin/trials" className="text-sm font-semibold text-red-700 hover:text-red-900 border border-red-300 rounded-lg px-3 py-1.5 transition hover:bg-red-100 flex-shrink-0">
              View Users
            </Link>
          </div>
        )}

        {/* Trial and Payment Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {expiringSoon.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900 text-sm">
                  {expiringSoon.length} trial{expiringSoon.length !== 1 ? 's' : ''} expiring soon
                </p>
                <p className="text-xs text-red-700 mt-0.5">Send reminders before they expire</p>
              </div>
              <Link href="/admin/trials" className="text-sm font-semibold text-red-700 hover:text-red-900 transition flex-shrink-0">
                Manage →
              </Link>
            </div>
          )}
          
          {expiredSubscriptions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm">
                  {expiredSubscriptions.length} subscription{expiredSubscriptions.length !== 1 ? 's' : ''} expired
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Users need to renew access</p>
              </div>
              <Link href="/admin/payments" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition flex-shrink-0">
                Review →
              </Link>
            </div>
          )}
        </div>

        {/* Cohort Analysis */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Cohort Analysis (Last 90 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{Object.values(cohortByMonth).reduce((a, b) => a + b, 0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">New Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeTrials.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active Trials</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{paidUsers.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Paid Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{premiumUsers.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Premium Users</p>
            </div>
          </div>
          {Object.keys(cohortByMonth).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Monthly Signups</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(cohortByMonth).map(([month, count]) => (
                  <div key={month} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{month}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <Link href="/admin/trials" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-amber-50 rounded-2xl border border-gray-100 hover:border-amber-200 transition group">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition">
                <Clock size={20} className="text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Trial Dashboard</p>
                <p className="text-xs text-gray-500 mt-0.5">{activeTrials.length} active · {expiredTrials.length} expired</p>
              </div>
            </Link>
            <Link href="/admin/payments" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition group">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition">
                <CreditCard size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Payment Tracking</p>
                <p className="text-xs text-gray-500 mt-0.5">{paidUsers.length} paid users</p>
              </div>
            </Link>
            <Link href="/admin/engagement" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition group">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
                <Activity size={20} className="text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">User Engagement</p>
                <p className="text-xs text-gray-500 mt-0.5">Activity insights</p>
              </div>
            </Link>
            <Link href="/admin/reports" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-green-50 rounded-2xl border border-gray-100 hover:border-green-200 transition group">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition">
                <FileText size={20} className="text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Reports & Export</p>
                <p className="text-xs text-gray-500 mt-0.5">Data analytics</p>
              </div>
            </Link>
            <Link href="/admin/security" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-red-50 rounded-2xl border border-gray-100 hover:border-red-200 transition group">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition">
                <Shield size={20} className="text-red-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Security & Audit</p>
                <p className="text-xs text-gray-500 mt-0.5">Monitoring logs</p>
              </div>
            </Link>
            <Link href="/admin/notifications/sms" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition group">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition">
                <MessageSquare size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Bulk SMS</p>
                <p className="text-xs text-gray-500 mt-0.5">Africa&apos;s Talking</p>
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
            <Link href="/admin/trials" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition group relative">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition relative">
                <TrendingUp size={20} className="text-emerald-700" />
                {endingTodayCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {endingTodayCount}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Trials &amp; Retention</p>
                <p className="text-xs text-gray-500 mt-0.5">{activeTrials.length} active trials</p>
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
            <Link href="/admin/monitoring" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-cyan-50 rounded-2xl border border-gray-100 hover:border-cyan-200 transition group">
              <div className="w-11 h-11 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-200 transition">
                <Monitor size={20} className="text-cyan-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Real-Time Monitoring</p>
                <p className="text-xs text-gray-500 mt-0.5">Live system performance</p>
              </div>
            </Link>
            <Link href="/admin/content" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition group">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition">
                <FileText size={20} className="text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Content Management</p>
                <p className="text-xs text-gray-500 mt-0.5">Bulk operations & moderation</p>
              </div>
            </Link>
            <Link href="/admin/insights" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-purple-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition group">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition">
                <Brain size={20} className="text-purple-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">AI Insights</p>
                <p className="text-xs text-gray-500 mt-0.5">Predictive analytics</p>
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
            <Link href="/admin/cohort" className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition group">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition">
                <TrendingUp size={20} className="text-indigo-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Cohort Analytics</p>
                <p className="text-xs text-gray-500 mt-0.5">Growth, retention &amp; conversion</p>
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
