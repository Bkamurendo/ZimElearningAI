import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Users, CreditCard, RefreshCw, AlertCircle, ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type ProfileRow = {
  id: string
  created_at: string
  role: string
  plan: string
  ai_quota_reset_at: string | null
}

export default async function CohortAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, created_at, role, plan, ai_quota_reset_at')
    .order('created_at', { ascending: false }) as { data: ProfileRow[] | null; error: unknown }

  const profiles = allProfiles ?? []
  const totalUsers = profiles.length

  // Month-over-month signup growth
  const newThisMonth = profiles.filter(p => new Date(p.created_at) >= startOfMonth)
  const newLastMonth = profiles.filter(p => {
    const d = new Date(p.created_at)
    return d >= startOfLastMonth && d < startOfMonth
  })
  const signupGrowth = newLastMonth.length > 0
    ? ((newThisMonth.length - newLastMonth.length) / newLastMonth.length * 100)
    : newThisMonth.length > 0 ? 100 : 0

  // Paid users across all paid plans
  const paidProfiles = profiles.filter(p => p.plan === 'pro' || p.plan === 'starter' || p.plan === 'elite')
  const conversionRate = totalUsers > 0 ? (paidProfiles.length / totalUsers * 100).toFixed(1) : '0'

  // Dormant: students with no AI activity in 30+ days (ai_quota_reset_at not updated)
  const dormantStudents = profiles.filter(p =>
    p.role === 'student' &&
    p.ai_quota_reset_at != null &&
    new Date(p.ai_quota_reset_at) < thirtyDaysAgo
  )

  // Monthly signups — build full 12-month array including empty months
  const monthlySignups: { month: string; label: string; total: number; students: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthProfiles = profiles.filter(p => {
      const d = new Date(p.created_at)
      return d >= monthStart && d < monthEnd
    })
    monthlySignups.push({
      month: monthStart.toISOString(),
      label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      total: monthProfiles.length,
      students: monthProfiles.filter(p => p.role === 'student').length,
    })
  }
  const maxMonthlySignups = Math.max(...monthlySignups.map(m => m.total), 1)

  // Plan distribution
  const planCounts = {
    free: profiles.filter(p => p.plan === 'free').length,
    trial: 0,
    starter: profiles.filter(p => p.plan === 'starter').length,
    pro: profiles.filter(p => p.plan === 'pro').length,
    elite: profiles.filter(p => p.plan === 'elite').length,
  }

  // New signups this month by role
  const roleBreakdown = newThisMonth.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  // Fetch profiles registered in last 12 months for chart scope
  const recentSignupCount = profiles.filter(p => new Date(p.created_at) >= twelveMonthsAgo).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-2">
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cohort &amp; Retention Analytics</h1>
              <p className="text-sm text-gray-500 mt-0.5">User growth, conversion, and retention over 12 months</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">New This Month</p>
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Users size={16} className="text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{newThisMonth.length}</p>
            {newLastMonth.length > 0 || newThisMonth.length > 0 ? (
              <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${signupGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {signupGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {signupGrowth > 0 ? '+' : ''}{signupGrowth.toFixed(0)}% vs last month
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">No signups last month</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Paid Users</p>
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CreditCard size={16} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{paidProfiles.length}</p>
            <p className="text-xs text-gray-400 mt-1">{conversionRate}% conversion rate</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">In Free Trial</p>
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <RefreshCw size={16} className="text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{planCounts.trial}</p>
            <p className="text-xs text-gray-400 mt-1">Active trial users</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dormant Students</p>
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{dormantStudents.length}</p>
            <p className="text-xs text-red-400 mt-1">No AI use in 30+ days</p>
          </div>
        </div>

        {/* Monthly signups chart — all 12 months */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-1">Monthly User Signups (Last 12 Months)</h2>
          <p className="text-xs text-gray-400 mb-5">
            Total registrations per month with paid/student breakdown
            {recentSignupCount > 0 && <span className="ml-1">· {recentSignupCount} total in period</span>}
          </p>
          <div className="space-y-2.5">
            {monthlySignups.map(({ month, label, total, students }) => {
              const barPct = total > 0 ? (total / maxMonthlySignups * 100) : 0
              const studentPct = total > 0 ? Math.round(students / total * 100) : 0
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-[72px] flex-shrink-0 text-right">{label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    {barPct > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    )}
                  </div>
                  <div className="flex-shrink-0 w-[150px] text-right">
                    {total > 0 ? (
                      <>
                        <span className="text-sm font-bold text-gray-900">{total} total</span>
                        <span className="text-xs text-indigo-600 ml-1">· {studentPct}% students</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs text-gray-500">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-500">Other roles</span>
            </div>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Free', count: planCounts.free, color: 'bg-gray-400' },
              { label: 'In Trial', count: planCounts.trial, color: 'bg-amber-400' },
              { label: 'Paid (Pro/Elite)', count: paidProfiles.length, color: 'bg-emerald-500' },
            ].map(({ label, count, color }) => {
              const pct = totalUsers > 0 ? Math.round(count / totalUsers * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.max(pct, pct > 0 ? 1 : 0)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* New signups this month by role */}
        {Object.keys(roleBreakdown).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">New Signups This Month by Role</h2>
            <div className="divide-y divide-gray-50">
              {Object.entries(roleBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/cohort/trial-funnel"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl transition"
          >
            <RefreshCw size={16} />
            View Trial Funnel
          </Link>
          <Link
            href="/admin/users"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl transition"
          >
            <Users size={16} />
            Manage Users
          </Link>
        </div>

      </div>
    </div>
  )
}
