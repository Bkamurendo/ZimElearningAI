export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, GraduationCap, BookOpen, Heart, Shield, ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, onboarding_completed, created_at')
      .order('created_at', { ascending: false })
      .limit(200) as { data: UserRow[] | null; error: unknown }

    const users = usersData ?? []

    const roleBreakdown = {
      student: users.filter((u) => u.role?.toLowerCase() === 'student').length,
      teacher: users.filter((u) => u.role?.toLowerCase() === 'teacher').length,
      parent:  users.filter((u) => u.role?.toLowerCase() === 'parent').length,
      admin:   users.filter((u) => u.role?.toLowerCase() === 'admin').length,
    }

    const onboarded = users.filter((u) => u.onboarding_completed).length

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-1 uppercase">
                <ArrowLeft size={13} /> Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900 uppercase">User Management</h1>
              <p className="text-sm text-gray-500 mt-0.5 uppercase">{users.length} registered users — click any row to edit</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]][]).map(([role, cfg]) => {
              const Icon = cfg.icon
              const count = roleBreakdown[role as keyof typeof roleBreakdown] ?? 0
              return (
                <div key={role} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className={`w-9 h-9 ${cfg.bg.split(' ')[0]} rounded-xl flex items-center justify-center mb-2`}>
                    <Icon size={17} className={cfg.color} />
                  </div>
                  <p className={`text-2xl font-bold ${cfg.color} uppercase`}>{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase">{cfg.label}s</p>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1 uppercase">
                <p className="text-sm font-bold text-gray-800">Onboarding Completion</p>
                <p className="text-sm font-bold text-indigo-600">
                  {users.length > 0 ? Math.round((onboarded / users.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${users.length > 0 ? (onboarded / users.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 uppercase font-medium">{onboarded} of {users.length} users completed onboarding</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between uppercase">
              <h2 className="text-sm font-bold text-gray-900">All Users</h2>
              <span className="text-xs text-gray-400 font-medium">{users.length} total</span>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400 uppercase">No users yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map((u) => {
                  const roleKey = u.role?.toLowerCase() || 'student'
                  const roleCfg = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.student
                  const RoleIcon = roleCfg.icon
                  return (
                    <Link
                      key={u.id}
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-50/40 transition group"
                    >
                      <div className="w-9 h-9 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                        <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600 transition-colors uppercase">
                          {(u.full_name ?? u.email)[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors uppercase">
                            {u.full_name ?? 'No name'}
                          </p>
                          {!u.onboarding_completed && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 uppercase">
                              Setup incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate uppercase font-medium">{u.email}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 uppercase ${roleCfg.bg} ${roleCfg.color}`}>
                        <RoleIcon size={11} />
                        {roleCfg.label}
                      </div>
                      <span className="text-[10px] text-gray-300 flex-shrink-0 hidden sm:block uppercase font-bold">
                        {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[AdminUsers] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">User Access Unavailable</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading the user list. Please try again or contact system support.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
