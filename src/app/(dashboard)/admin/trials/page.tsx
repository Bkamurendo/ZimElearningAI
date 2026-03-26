import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle,
  XCircle, BarChart2, ArrowLeft, Mail,
} from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function DaysChip({ days }: { days: number }) {
  if (days <= 1)
    return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{days}d left</span>
  if (days <= 4)
    return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{days}d left</span>
  return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{days}d left</span>
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function TrialsRetentionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') redirect('/student/dashboard')

  const now = new Date().toISOString()

  // ── Trial funnel counts ───────────────────────────────────────────────────
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const sevenDaysEnd = new Date()
  sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 7)
  sevenDaysEnd.setHours(23, 59, 59, 999)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const startOfLastMonth = new Date(startOfMonth)
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)

  const [
    { count: activeTrials },
    { count: expiredNotConverted },
    { count: converted },
    { count: totalEverTrialed },
    { count: freeUsers },
    { count: starterUsers },
    { count: proUsers },
    { count: eliteUsers },
    { count: totalUsers },
    { count: newPaidThisMonth },
    { count: newPaidLastMonth },
  ] = await Promise.all([
    // active free trials
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .gt('trial_ends_at', now)
      .eq('plan', 'free'),

    // expired & never converted
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', now)
      .eq('plan', 'free'),

    // had a trial AND is now on paid plan
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null)
      .not('plan', 'in', '("free")'),

    // total who ever had a trial
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('trial_ends_at', 'is', null),

    // plan distribution
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'starter'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'elite'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),

    // new paid this month (created_at proxy — not perfect but no plan_changed_at column assumed)
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('plan', 'in', '("free")')
      .gte('updated_at', startOfMonth.toISOString()),

    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('plan', 'in', '("free")')
      .gte('updated_at', startOfLastMonth.toISOString())
      .lt('updated_at', startOfMonth.toISOString()),
  ])

  // Ending today (full rows for the list)
  type TrialRow = { id: string; full_name: string | null; email: string | null; trial_ends_at: string; zimsec_level?: string | null }
  const { data: endingToday } = await supabase
    .from('profiles')
    .select('id, full_name, email, trial_ends_at')
    .not('trial_ends_at', 'is', null)
    .gt('trial_ends_at', now)
    .lt('trial_ends_at', todayEnd.toISOString())
    .eq('plan', 'free') as { data: TrialRow[] | null; error: unknown }

  // Ending within 7 days
  const { data: endingSoon } = await supabase
    .from('profiles')
    .select('id, full_name, email, trial_ends_at')
    .not('trial_ends_at', 'is', null)
    .gt('trial_ends_at', now)
    .lt('trial_ends_at', sevenDaysEnd.toISOString())
    .eq('plan', 'free')
    .order('trial_ends_at', { ascending: true })
    .limit(50) as { data: TrialRow[] | null; error: unknown }

  const conversionRate = (totalEverTrialed ?? 0) > 0
    ? Math.round(((converted ?? 0) / (totalEverTrialed ?? 1)) * 100)
    : 0

  const estimatedMRR = (starterUsers ?? 0) * 2 + (proUsers ?? 0) * 5 + (eliteUsers ?? 0) * 8
  const total = totalUsers ?? 1

  const planRows = [
    { label: 'Free',    count: freeUsers ?? 0,    bar: 'bg-gray-400',                                       price: 0 },
    { label: 'Starter', count: starterUsers ?? 0, bar: 'bg-blue-500',                                       price: 2 },
    { label: 'Pro',     count: proUsers ?? 0,     bar: 'bg-gradient-to-r from-indigo-500 to-purple-500',    price: 5 },
    { label: 'Elite',   count: eliteUsers ?? 0,   bar: 'bg-gradient-to-r from-amber-500 to-orange-500',     price: 8 },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trials &amp; Retention</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitor trial funnels, conversions, and churn risk</p>
          </div>
        </div>

        {/* Urgent alert */}
        {(endingToday ?? []).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-red-800">
                  {(endingToday ?? []).length} trial{(endingToday ?? []).length !== 1 ? 's' : ''} expiring today
                </p>
                <p className="text-sm text-red-600">Send reminders now to prevent churn</p>
              </div>
            </div>
            <a
              href="#ending-today"
              className="text-sm font-semibold text-red-700 hover:text-red-900 border border-red-300 rounded-lg px-3 py-1.5 transition hover:bg-red-100"
            >
              View Users
            </a>
          </div>
        )}

        {/* ── Section A: Trial Funnel ───────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section A — Trial Funnel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: 'Active Trials',
                value: activeTrials ?? 0,
                icon: Clock,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Conversion Rate',
                value: `${conversionRate}%`,
                icon: TrendingUp,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Ending Today',
                value: (endingToday ?? []).length,
                icon: AlertTriangle,
                color: (endingToday ?? []).length > 0 ? 'text-red-600' : 'text-gray-400',
                bg: (endingToday ?? []).length > 0 ? 'bg-red-50' : 'bg-gray-50',
              },
              {
                label: 'Ending This Week',
                value: (endingSoon ?? []).length,
                icon: Clock,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                label: 'Churned Trials',
                value: expiredNotConverted ?? 0,
                icon: XCircle,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Conversion funnel bar */}
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversion Funnel</h3>
            <div className="space-y-2">
              {[
                { label: 'Total trialed', count: totalEverTrialed ?? 0, base: totalEverTrialed ?? 1, bar: 'bg-blue-400' },
                { label: 'Converted to paid', count: converted ?? 0, base: totalEverTrialed ?? 1, bar: 'bg-emerald-500' },
                { label: 'Churned (expired, free)', count: expiredNotConverted ?? 0, base: totalEverTrialed ?? 1, bar: 'bg-rose-400' },
                { label: 'Still in trial', count: activeTrials ?? 0, base: totalEverTrialed ?? 1, bar: 'bg-amber-400' },
              ].map(({ label, count, base, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{label}</span>
                    <span className="font-medium text-gray-700">{count} ({base > 0 ? Math.round(count / base * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${base > 0 ? count / base * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section B: Trials Ending Soon Table ──────────────────────────── */}
        <div id="ending-today">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section B — Trials Ending Within 7 Days</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {(endingSoon ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No trials expiring in the next 7 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/70">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time Left</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(endingSoon ?? []).map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {row.full_name ?? 'Unknown'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{row.email ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(row.trial_ends_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <DaysChip days={daysLeft(row.trial_ends_at)} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <a
                            href={`/api/admin/send-sms?userId=${row.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition"
                          >
                            <Mail size={12} />
                            Send SMS Reminder
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Section C: Revenue Metrics ───────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section C — Revenue Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Est. MRR</p>
              <p className="text-3xl font-bold text-emerald-600">${estimatedMRR.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">Based on active plan counts</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">New Paid — This Month</p>
              <p className="text-3xl font-bold text-blue-600">{newPaidThisMonth ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">vs {newPaidLastMonth ?? 0} last month</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Trial → Paid Rate</p>
              <p className="text-3xl font-bold text-purple-600">{conversionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{converted ?? 0} of {totalEverTrialed ?? 0} trialists</p>
            </div>
          </div>

          {/* MRR breakdown bar */}
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">MRR Contribution by Plan</h3>
            <div className="space-y-3">
              {[
                { label: 'Starter ($2/mo)',  count: starterUsers ?? 0, mrr: (starterUsers ?? 0) * 2,  bar: 'bg-blue-500' },
                { label: 'Pro ($5/mo)',      count: proUsers ?? 0,     mrr: (proUsers ?? 0) * 5,      bar: 'bg-indigo-500' },
                { label: 'Elite ($8/mo)',    count: eliteUsers ?? 0,   mrr: (eliteUsers ?? 0) * 8,    bar: 'bg-amber-500' },
              ].map(({ label, count, mrr, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-500">{count} users · <span className="font-semibold text-gray-700">${mrr}/mo</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full`}
                      style={{ width: estimatedMRR > 0 ? `${(mrr / estimatedMRR) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section D: Plan Distribution ─────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Section D — Plan Distribution</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="space-y-3">
              {planRows.map(({ label, count, bar }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-500">
                      {count} users ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all`}
                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-6 text-xs text-gray-400">
              <span>Total users: <span className="font-semibold text-gray-600">{totalUsers ?? 0}</span></span>
              <span>Paid subscribers: <span className="font-semibold text-gray-600">{(starterUsers ?? 0) + (proUsers ?? 0) + (eliteUsers ?? 0)}</span></span>
              <span>Est. MRR: <span className="font-semibold text-gray-600">${estimatedMRR.toFixed(2)}/mo</span></span>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-3 pt-2">
          <Link href="/admin/revenue" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition flex items-center gap-1">
            <BarChart2 size={14} /> Revenue Dashboard
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
