export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp, Users, RefreshCw, UserCheck, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Cohort Analytics — Admin' }

function monthLabel(key: string) {
  const [year, m] = key.split('-')
  return new Date(Number(year), Number(m) - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
}

export default async function CohortAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  // All users created in last 12 months
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, role, plan, created_at, trial_ends_at')
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  // Cohort by month
  const cohortMap: Record<string, { total: number; students: number; paid: number }> = {}
  ;(allUsers ?? []).forEach((u) => {
    const d = new Date(u.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!cohortMap[key]) cohortMap[key] = { total: 0, students: 0, paid: 0 }
    cohortMap[key].total++
    if (u.role === 'student') cohortMap[key].students++
    if (u.plan === 'pro' || u.plan === 'elite') cohortMap[key].paid++
  })

  const cohortEntries = Object.entries(cohortMap).sort(([a], [b]) => a.localeCompare(b))
  const maxCohortSize = Math.max(1, ...cohortEntries.map(([, v]) => v.total))

  // Growth: compare this month to last month
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  const thisMonthCount = cohortMap[thisMonthKey]?.total ?? 0
  const lastMonthCount = cohortMap[lastMonthKey]?.total ?? 1
  const growthPct = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)

  // Overall paid vs free
  const { count: totalPaid } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('plan', ['pro', 'elite'])

  const { count: totalFree } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('plan', 'free')

  const { count: totalTrialing } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('plan', 'free')
    .gt('trial_ends_at', now.toISOString())

  // Students who joined > 30 days ago but never used AI (churned learners)
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: dormant } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .eq('ai_requests_today', 0)

  // Role breakdown for new users this month
  const thisMonthUsersRoles: Record<string, number> = {}
  ;(allUsers ?? []).forEach((u) => {
    const d = new Date(u.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key === thisMonthKey) {
      thisMonthUsersRoles[u.role] = (thisMonthUsersRoles[u.role] ?? 0) + 1
    }
  })

  const conversionRate = totalPaid && totalFree
    ? Math.round(((totalPaid) / ((totalPaid) + (totalFree))) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-3 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cohort & Retention Analytics</h1>
              <p className="text-gray-500 text-sm">User growth, conversion, and retention over 12 months</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New This Month', value: thisMonthCount, icon: Users, color: 'indigo',
              sub: growthPct >= 0 ? `+${growthPct}% vs last month` : `${growthPct}% vs last month`,
              subColor: growthPct >= 0 ? 'text-green-600' : 'text-red-500' },
            { label: 'Paid Users', value: totalPaid ?? 0, icon: UserCheck, color: 'emerald',
              sub: `${conversionRate}% conversion rate`, subColor: 'text-slate-500' },
            { label: 'In Free Trial', value: totalTrialing ?? 0, icon: RefreshCw, color: 'amber',
              sub: 'Active trial users', subColor: 'text-slate-500' },
            { label: 'Dormant Students', value: dormant ?? 0, icon: AlertCircle, color: 'red',
              sub: 'No AI use in 30+ days', subColor: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color, sub, subColor }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 bg-${color}-50 rounded-lg flex items-center justify-center`}>
                  <Icon size={15} className={`text-${color}-600`} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{(value as number).toLocaleString()}</p>
              <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Cohort chart — monthly signups bar chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Monthly User Signups (Last 12 Months)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Total registrations per month with paid/student breakdown</p>
          </div>
          <div className="px-6 py-6">
            {cohortEntries.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No data in the last 12 months</p>
            ) : (
              <div className="space-y-3">
                {cohortEntries.map(([key, val]) => {
                  const pct = Math.round((val.total / maxCohortSize) * 100)
                  const studentPct = Math.round((val.students / Math.max(val.total, 1)) * 100)
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-20 text-xs text-gray-500 text-right flex-shrink-0">{monthLabel(key)}</div>
                      <div className="flex-1 relative h-7">
                        <div className="absolute inset-0 bg-gray-100 rounded-full" />
                        <div
                          className="absolute top-0 left-0 h-full bg-indigo-200 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${Math.round((val.students / maxCohortSize) * 100)}%` }}
                        />
                      </div>
                      <div className="w-32 flex-shrink-0 text-xs text-gray-600">
                        <span className="font-bold text-gray-900">{val.total}</span> total &bull;&nbsp;
                        <span className="text-indigo-600">{studentPct}% students</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-indigo-600" /> Students
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-indigo-200" /> Other roles
              </div>
            </div>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Plan Distribution</h2>
            {[
              { label: 'Free', count: totalFree ?? 0, color: 'bg-gray-400' },
              { label: 'In Trial', count: totalTrialing ?? 0, color: 'bg-amber-400' },
              { label: 'Paid (Pro/Elite)', count: totalPaid ?? 0, color: 'bg-emerald-500' },
            ].map(({ label, count, color }) => {
              const total = (totalFree ?? 0) + (totalPaid ?? 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{label}</span>
                    <span className="text-gray-500">{count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">New Signups This Month by Role</h2>
            {Object.entries(thisMonthUsersRoles).length === 0 ? (
              <p className="text-gray-400 text-sm">No new users this month yet</p>
            ) : (
              Object.entries(thisMonthUsersRoles).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="capitalize text-gray-700 font-medium">{role.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/trials"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            <RefreshCw size={15} /> View Trial Funnel
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            <Users size={15} /> Manage Users
          </Link>
        </div>
      </div>
    </div>
  )
}
