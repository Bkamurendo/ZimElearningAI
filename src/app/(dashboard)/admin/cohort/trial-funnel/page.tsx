import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, TrendingUp, AlertTriangle, XCircle, BarChart2, DollarSign } from 'lucide-react'

// Plan pricing for MRR calculation
const PLAN_PRICES: Record<string, number> = {
  starter: 2,
  pro: 5,
  elite: 8,
}

type ProfileRow = {
  id: string
  plan: string
  pro_expires_at: string | null
  created_at: string
}

type PaymentRow = {
  id: string
  user_id: string
  plan_id: string
  amount_usd: number
  status: string
  created_at: string
  paid_at: string | null
}

export default async function TrialFunnelPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  // Fetch profiles and payments in parallel
  const [profilesResult, paymentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, plan, pro_expires_at, created_at') as Promise<{ data: ProfileRow[] | null; error: unknown }>,
    supabase
      .from('payments')
      .select('id, user_id, plan_id, amount_usd, status, created_at, paid_at')
      .order('created_at', { ascending: false }) as Promise<{ data: PaymentRow[] | null; error: unknown }>,
  ])

  const profiles = profilesResult.data ?? []
  const payments = paymentsResult.data ?? []

  // ── Section A: Trial Funnel ───────────────────────────────────────────────────

  // Active trials: users on a timed pro subscription that hasn't expired
  const activeTrials = profiles.filter(p =>
    p.plan === 'pro' &&
    p.pro_expires_at != null &&
    new Date(p.pro_expires_at) > now
  )

  // Trials ending today
  const endingToday = activeTrials.filter(p => {
    const exp = new Date(p.pro_expires_at!)
    return exp >= today && exp < tomorrow
  })

  // Trials ending within 7 days (excluding today)
  const endingThisWeek = activeTrials.filter(p => {
    const exp = new Date(p.pro_expires_at!)
    return exp >= tomorrow && exp <= in7Days
  })

  // Churned trials: users who HAD a paid payment but are now on the free plan
  const paidUserIds = new Set(
    payments.filter(p => p.status === 'paid').map(p => p.user_id)
  )
  const paidUserProfiles = profiles.filter(p => paidUserIds.has(p.id))
  const churnedTrials = paidUserProfiles.filter(p => p.plan === 'free')
  const convertedTrials = paidUserProfiles.filter(p => p.plan !== 'free')
  const totalTrialed = paidUserIds.size
  const stillInTrial = activeTrials.length

  const conversionRate = totalTrialed > 0
    ? Math.round(convertedTrials.length / totalTrialed * 100)
    : 0

  // ── Section B: Trials ending within 7 days ───────────────────────────────────
  const upcomingExpirations = activeTrials
    .filter(p => new Date(p.pro_expires_at!) <= in7Days)
    .sort((a, b) => new Date(a.pro_expires_at!).getTime() - new Date(b.pro_expires_at!).getTime())
    .slice(0, 10)

  // ── Section C: Revenue Metrics ────────────────────────────────────────────────

  // MRR by plan
  const planDistribution = profiles.reduce<Record<string, number>>((acc, p) => {
    if (p.plan !== 'free') acc[p.plan] = (acc[p.plan] ?? 0) + 1
    return acc
  }, {})

  const mrrByPlan = Object.entries(PLAN_PRICES).map(([plan, price]) => ({
    plan,
    price,
    users: planDistribution[plan] ?? 0,
    mrr: (planDistribution[plan] ?? 0) * price,
  }))

  const totalMrr = mrrByPlan.reduce((sum, p) => sum + p.mrr, 0)

  // New paid this month vs last month
  const newPaidThisMonth = payments.filter(p => {
    if (p.status !== 'paid') return false
    const d = new Date(p.paid_at ?? p.created_at)
    return d >= startOfMonth
  })

  const newPaidLastMonth = payments.filter(p => {
    if (p.status !== 'paid') return false
    const d = new Date(p.paid_at ?? p.created_at)
    return d >= startOfLastMonth && d < startOfMonth
  })

  // Unique paying users this month
  const newPaidUsersThisMonth = new Set(newPaidThisMonth.map(p => p.user_id)).size
  const newPaidUsersLastMonth = new Set(newPaidLastMonth.map(p => p.user_id)).size

  // Trial → paid conversion rate
  const trialToPaidRate = totalTrialed > 0
    ? Math.round(convertedTrials.length / totalTrialed * 100)
    : 0

  // ── Section D: Plan Distribution ─────────────────────────────────────────────
  const totalUsers = profiles.length
  const paidPlans = ['starter', 'pro', 'elite']
  const planRows = [
    { label: 'Free', plan: 'free', color: 'bg-gray-400', count: profiles.filter(p => p.plan === 'free').length },
    { label: 'Starter', plan: 'starter', color: 'bg-sky-500', count: profiles.filter(p => p.plan === 'starter').length },
    { label: 'Pro', plan: 'pro', color: 'bg-indigo-500', count: profiles.filter(p => p.plan === 'pro').length },
    { label: 'Elite', plan: 'elite', color: 'bg-violet-500', count: profiles.filter(p => p.plan === 'elite').length },
  ]
  const totalPaid = profiles.filter(p => paidPlans.includes(p.plan)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Header */}
        <div>
          <Link href="/admin/cohort" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-2">
            <ArrowLeft size={13} /> Cohort Analytics
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Trial Funnel &amp; Revenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Subscription conversion, trial tracking, and MRR metrics</p>
        </div>

        {/* SECTION A — Trial Funnel */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section A — Trial Funnel</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Active Trials */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Clock size={18} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{activeTrials.length}</p>
              <p className="text-sm text-gray-500 mt-1">Active Trials</p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">{conversionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Conversion Rate</p>
            </div>

            {/* Ending Today */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <AlertTriangle size={18} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-700">{endingToday.length}</p>
              <p className="text-sm text-gray-500 mt-1">Ending Today</p>
            </div>

            {/* Ending This Week */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <Clock size={18} className="text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-600">{endingThisWeek.length}</p>
              <p className="text-sm text-gray-500 mt-1">Ending This Week</p>
            </div>

            {/* Churned Trials */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <XCircle size={18} className="text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{churnedTrials.length}</p>
              <p className="text-sm text-gray-500 mt-1">Churned Trials</p>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {[
                { label: 'Total trialed', count: totalTrialed, pct: 100, color: 'bg-blue-500' },
                { label: 'Converted to paid', count: convertedTrials.length, pct: totalTrialed > 0 ? Math.round(convertedTrials.length / totalTrialed * 100) : 0, color: 'bg-emerald-500' },
                { label: 'Churned (expired, free)', count: churnedTrials.length, pct: totalTrialed > 0 ? Math.round(churnedTrials.length / totalTrialed * 100) : 0, color: 'bg-red-400' },
                { label: 'Still in trial', count: stillInTrial, pct: totalTrialed > 0 ? Math.round(stillInTrial / totalTrialed * 100) : 0, color: 'bg-gray-300' },
              ].map(({ label, count, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${Math.max(pct, pct > 0 ? 1 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION B — Trials Ending Within 7 Days */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section B — Trials Ending Within 7 Days</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {upcomingExpirations.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No trials expiring in the next 7 days</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingExpirations.map(p => {
                  const expiresAt = new Date(p.pro_expires_at!)
                  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">User {p.id.slice(0, 8)}…</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Expires {expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        daysLeft <= 1 ? 'bg-red-100 text-red-700' :
                        daysLeft <= 3 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION C — Revenue Metrics */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section C — Revenue Metrics</p>

          {/* Est. MRR */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Est. MRR</p>
            <p className="text-4xl font-black text-emerald-600">${totalMrr.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Based on active plan counts</p>
          </div>

          {/* New Paid This Month */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">New Paid — This Month</p>
            <p className="text-3xl font-bold text-indigo-600">{newPaidUsersThisMonth}</p>
            <p className="text-xs text-gray-400 mt-1">vs {newPaidUsersLastMonth} last month</p>
          </div>

          {/* Trial → Paid Rate */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Trial → Paid Rate</p>
            <p className="text-3xl font-bold text-violet-600">{trialToPaidRate}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {convertedTrials.length} of {totalTrialed} trialist{totalTrialed !== 1 ? 's' : ''}
            </p>
          </div>

          {/* MRR Contribution by Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">MRR Contribution by Plan</h3>
            <div className="space-y-4">
              {mrrByPlan.map(({ plan, price, users, mrr }) => {
                const pct = totalMrr > 0 ? (mrr / totalMrr * 100) : 0
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">{plan} (${price}/mo)</span>
                      <span className="text-gray-500">
                        {users} user{users !== 1 ? 's' : ''} · <span className="font-bold text-gray-900">${mrr}/mo</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, pct > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SECTION D — Plan Distribution */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Section D — Plan Distribution</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="space-y-3 mb-5">
              {planRows.map(({ label, plan, color, count }) => {
                const pct = totalUsers > 0 ? Math.round(count / totalUsers * 100) : 0
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-400">{count} users ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${Math.max(pct, pct > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
              <div>Total users: <span className="font-bold text-gray-900">{totalUsers}</span></div>
              <div>Paid subscribers: <span className="font-bold text-gray-900">{totalPaid}</span></div>
              <div>Est. MRR: <span className="font-bold text-gray-900">${totalMrr.toFixed(2)}/mo</span></div>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/admin/revenue" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition">
            <BarChart2 size={15} />
            Revenue Dashboard
          </Link>
          <Link href="/admin/cohort" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft size={13} />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
