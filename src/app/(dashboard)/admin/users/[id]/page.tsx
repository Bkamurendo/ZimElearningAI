export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  ArrowLeft, GraduationCap, BookOpen, Heart, Shield, Mail, Calendar, CheckCircle2, Clock,
} from 'lucide-react'
import UserEditForm from './UserEditForm'
import { SuspendUserButton } from './SuspendUserButton'
import { DeleteUserButton } from './DeleteUserButton'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  student: { label: 'Student', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', icon: GraduationCap },
  teacher: { label: 'Teacher', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',  icon: BookOpen },
  parent:  { label: 'Parent',  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Heart },
  admin:   { label: 'Admin',   color: 'text-gray-700',   bg: 'bg-gray-100',  border: 'border-gray-300',  icon: Shield },
}

type UserRow = {
  id: string
  full_name: string | null
  email: string
  role: string
  onboarding_completed: boolean
  created_at: string
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/admin/dashboard')

  // Use service client to read any user's profile (bypasses RLS)
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: target } = await svc
    .from('profiles')
    .select('id, full_name, email, role, plan, onboarding_completed, created_at, suspended, suspension_reason, suspended_at')
    .eq('id', params.id)
    .single() as { data: (UserRow & { plan?: string; suspended?: boolean; suspension_reason?: string | null; suspended_at?: string | null }) | null; error: unknown }

  if (!target) notFound()

  const roleCfg = ROLE_CONFIG[target.role] ?? ROLE_CONFIG.student
  const RoleIcon = roleCfg.icon
  const initials = (target.full_name ?? target.email).slice(0, 2).toUpperCase()
  const isCurrentUser = user.id === target.id

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Breadcrumb */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowLeft size={14} /> Back to User Management
        </Link>

        {/* User header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                {target.full_name ?? 'No name set'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail size={12} className="text-indigo-200 flex-shrink-0" />
                <p className="text-indigo-200 text-sm truncate">{target.email}</p>
              </div>
            </div>
            {isCurrentUser && (
              <span className="flex-shrink-0 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">
                You
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 px-6 py-3.5 bg-gray-50 border-t border-gray-100">
            {/* Role */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.bg} ${roleCfg.border} ${roleCfg.color}`}>
              <RoleIcon size={11} />
              {roleCfg.label}
            </div>

            {/* Onboarding */}
            {target.onboarding_completed ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
                <CheckCircle2 size={13} className="text-green-500" /> Onboarding complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <Clock size={13} className="text-amber-500" /> Setup incomplete
              </span>
            )}

            {/* Joined */}
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={12} />
              Joined {new Date(target.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Suspension status */}
        {target.suspended && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-red-700 font-semibold text-sm">⚠️ This account is suspended</p>
            {target.suspension_reason && <p className="text-red-600 text-xs mt-1">Reason: {target.suspension_reason}</p>}
            {target.suspended_at && <p className="text-red-400 text-xs mt-0.5">Suspended on {new Date(target.suspended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          </div>
        )}

        {/* Edit form + password reset (client component) */}
        <UserEditForm
          userId={target.id}
          initialName={target.full_name ?? ''}
          initialRole={target.role}
          initialPlan={target.plan ?? 'free'}
          initialOnboarded={target.onboarding_completed}
          isCurrentUser={isCurrentUser}
        />

        {/* Suspend / Unsuspend */}
        {!isCurrentUser && (
          <SuspendUserButton
            userId={target.id}
            isSuspended={target.suspended ?? false}
          />
        )}

        {/* Delete */}
        {!isCurrentUser && (
          <DeleteUserButton userId={target.id} />
        )}

      </div>
    </div>
  )
}
