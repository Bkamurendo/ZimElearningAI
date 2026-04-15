import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, GraduationCap, BookOpen, Heart, Shield, ArrowLeft } from 'lucide-react'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  student: { label: 'Student',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: GraduationCap },
  teacher: { label: 'Teacher',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    icon: BookOpen },
  parent:  { label: 'Parent',   color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Heart },
  admin:   { label: 'Admin',    color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200',    icon: Shield },
}

type UserRow = {
  id: string
  full_name: string | null
  email: string
  role: string
  onboarding_completed: boolean
  created_at: string
}

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Accurate role counts — separate queries, no row limit
  const [
    { count: studentCount },
    { count: teacherCount },
    { count: parentCount },
    { count: adminCount },
    { count: onboardedCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_completed', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const roleBreakdown = {
    student: studentCount ?? 0,
    teacher: teacherCount ?? 0,
    parent:  parentCount ?? 0,
    admin:   adminCount ?? 0,
  }
  const onboarded = onboardedCount ?? 0
  const totalUsers = totalCount ?? 0

  // Recent users list — limited to 200 for display only
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, onboarding_completed, created_at')
    .order('created_at', { ascending: false })
    .limit(200) as { data: UserRow[] | null; error: unknown }

  const users = data ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-1">
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalUsers} registered users</p>
          </div>
        </div>

        {/* Role stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]][]).map(([role, cfg]) => {
            const Icon = cfg.icon
            const count = roleBreakdown[role as keyof typeof roleBreakdown] ?? 0
            return (
              <div key={role} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className={`w-9 h-9 ${cfg.bg.split(' ')[0]} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon size={17} className={cfg.color} />
                </div>
                <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cfg.label}s</p>
              </div>
            )
          })}
        </div>

        {/* Onboarding stat */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-800">Onboarding Completion</p>
              <p className="text-sm font-bold text-indigo-600">
                {totalUsers > 0 ? Math.round((onboarded / totalUsers) * 100) : 0}%
              </p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${totalUsers > 0 ? (onboarded / totalUsers) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{onboarded} of {totalUsers} users completed onboarding</p>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">All Users</h2>
            <span className="text-xs text-gray-400">{totalUsers} total</span>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No users yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u) => {
                const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.student
                const RoleIcon = roleCfg.icon
                return (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-gray-500">
                        {(u.full_name ?? u.email)[0]?.toUpperCase()}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {u.full_name ?? 'No name'}
                        </p>
                        {!u.onboarding_completed && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                            Setup incomplete
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    {/* Role badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${roleCfg.bg} ${roleCfg.color}`}>
                      <RoleIcon size={11} />
                      {roleCfg.label}
                    </div>
                    {/* Joined date */}
                    <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
                      {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
