import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  BookOpen,
  Zap,
  Calendar,
  Plus,
  Upload,
  BarChart3,
  UserPlus,
  School,
  TrendingUp,
} from 'lucide-react'

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-ZW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function levelLabel(level: string | null | undefined): string {
  switch (level) {
    case 'olevel':  return 'O-Level'
    case 'alevel':  return 'A-Level'
    case 'primary': return 'Primary'
    default:        return '—'
  }
}

function levelBadge(level: string | null | undefined): string {
  switch (level) {
    case 'olevel':  return 'bg-indigo-100 text-indigo-700'
    case 'alevel':  return 'bg-emerald-100 text-emerald-700'
    case 'primary': return 'bg-amber-100 text-amber-700'
    default:        return 'bg-gray-100 text-gray-500'
  }
}

export default async function SchoolAdminDashboard() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch admin profile with school_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin') redirect('/login')
  if (!profile.school_id) redirect('/login')

  // Fetch school details
  const { data: school } = await supabase
    .from('schools')
    .select('name, subscription_plan, subscription_expires_at, max_students')
    .eq('id', profile.school_id)
    .single()

  // Fetch stats in parallel
  const [
    { count: totalStudents },
    { count: totalTeachers },
    { data: aiData },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('role', 'student'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('role', 'teacher'),
    supabase
      .from('profiles')
      .select('ai_requests_today')
      .eq('school_id', profile.school_id)
      .eq('role', 'student'),
  ])

  const totalAiToday = (aiData ?? []).reduce(
    (sum, row) => sum + (row.ai_requests_today ?? 0),
    0,
  )

  const daysLeft = daysUntil(school?.subscription_expires_at)

  // Fetch recent students (last 5 by join date)
  let recentStudents: Array<{
    id: string
    full_name: string | null
    created_at: string
    zimsec_level: string | null
    grade: string | null
  }> = []

  try {
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentProfiles && recentProfiles.length > 0) {
      const ids = recentProfiles.map(p => p.id)
      const { data: studentProfileRows } = await supabase
        .from('student_profiles')
        .select('user_id, zimsec_level, grade')
        .in('user_id', ids)

      const spMap = new Map(
        (studentProfileRows ?? []).map(sp => [sp.user_id, sp]),
      )

      recentStudents = recentProfiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        created_at: p.created_at,
        zimsec_level: spMap.get(p.id)?.zimsec_level ?? null,
        grade: spMap.get(p.id)?.grade ?? null,
      }))
    }
  } catch {
    // student_profiles may not have data yet — degrade gracefully
  }

  const firstName = profile.full_name?.split(' ')[0] ?? 'Admin'
  const schoolName = school?.name ?? 'My School'
  const plan = school?.subscription_plan ?? 'basic'
  const maxStudents = school?.max_students ?? 50

  const planBadge =
    plan === 'pro'
      ? 'bg-emerald-500 text-white'
      : 'bg-slate-200 text-slate-700'

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/school-admin/students',
    },
    {
      label: 'Total Teachers',
      value: totalTeachers ?? 0,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/school-admin/teachers',
    },
    {
      label: 'AI Requests Today',
      value: totalAiToday,
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: null as string | null,
    },
    {
      label: 'Days Until Renewal',
      value: school?.subscription_expires_at ? daysLeft : '—',
      icon: Calendar,
      color: daysLeft <= 7 ? 'text-red-600' : 'text-teal-600',
      bg: daysLeft <= 7 ? 'bg-red-50' : 'bg-teal-50',
      href: null as string | null,
    },
  ]

  const quickActions = [
    {
      label: 'Add Student',
      description: 'Register a new student',
      icon: UserPlus,
      href: '/school-admin/students/new',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      hoverBorder: 'hover:border-indigo-200',
      hoverBg: 'hover:bg-indigo-50',
    },
    {
      label: 'Add Teacher',
      description: 'Register a new teacher',
      icon: Plus,
      href: '/school-admin/teachers/new',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      hoverBorder: 'hover:border-emerald-200',
      hoverBg: 'hover:bg-emerald-50',
    },
    {
      label: 'Import CSV',
      description: 'Bulk upload students or staff',
      icon: Upload,
      href: '/school-admin/import',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      hoverBorder: 'hover:border-amber-200',
      hoverBg: 'hover:bg-amber-50',
    },
    {
      label: 'View Analytics',
      description: 'Usage and performance data',
      icon: BarChart3,
      href: '/school-admin/analytics',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
      hoverBorder: 'hover:border-violet-200',
      hoverBg: 'hover:bg-violet-50',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome banner */}
        <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 overflow-hidden shadow-lg">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-emerald-400/10 rounded-full translate-y-1/2 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-emerald-300 text-sm font-medium mb-1">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{firstName}</h1>
              <p className="mt-1.5 text-emerald-200/70 text-sm">School administration dashboard</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* School name badge */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5">
                <School size={14} className="text-emerald-300 flex-shrink-0" />
                <span className="text-white text-xs font-semibold truncate max-w-[140px]">
                  {schoolName}
                </span>
              </div>

              {/* Subscription plan badge */}
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl uppercase tracking-wide ${planBadge}`}
              >
                {plan}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription expiry warning */}
        {school?.subscription_expires_at && daysLeft <= 14 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">
                Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Renew by {formatDate(school.subscription_expires_at)} to avoid service interruption
              </p>
            </div>
            <Link
              href="/school-admin/settings"
              className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition flex-shrink-0"
            >
              Renew →
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, href }) =>
            href ? (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition group"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
              </Link>
            ) : (
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
            ),
          )}
        </div>

        {/* Student capacity bar */}
        {maxStudents > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" />
                <span className="text-sm font-semibold text-gray-800">Student Capacity</span>
              </div>
              <span className="text-sm font-bold text-gray-700">
                {totalStudents ?? 0}{' '}
                <span className="text-gray-400 font-normal">/ {maxStudents} students</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  (totalStudents ?? 0) / maxStudents >= 0.9
                    ? 'bg-red-500'
                    : (totalStudents ?? 0) / maxStudents >= 0.7
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (((totalStudents ?? 0) / maxStudents) * 100))}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {maxStudents - (totalStudents ?? 0)} seats remaining on your {plan} plan
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map(
              ({ label, description, icon: Icon, href, iconBg, iconColor, hoverBorder, hoverBg }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3 p-4 bg-gray-50 ${hoverBg} rounded-2xl border border-gray-100 ${hoverBorder} transition group`}
                >
                  <div
                    className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Recent students table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recently Joined Students</h2>
            <Link
              href="/school-admin/students"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              View all →
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users size={22} className="text-indigo-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No students enrolled yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Import a CSV or add students individually to get started
              </p>
              <Link
                href="/school-admin/import"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                <Upload size={13} />
                Import CSV
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Grade
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentStudents.map((student, i) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 transition ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 text-xs font-bold">
                              {(student.full_name ?? 'S')
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {student.full_name ?? 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${levelBadge(
                            student.zimsec_level,
                          )}`}
                        >
                          {levelLabel(student.zimsec_level)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 hidden sm:table-cell">
                        {student.grade ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                        {formatDate(student.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
