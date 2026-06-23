export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DollarSign, TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default async function AdminRevenuePage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null; error: unknown }
    
    if (profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    // Total users
    const { count: totalUsers }   = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const { count: freeUsers }    = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'free')
    const { count: starterUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'starter')
    const { count: proUsers }     = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro')
    const { count: eliteUsers }   = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'elite')

    // Payments
    type PayRow = { id: string; amount: number; currency: string; status: string; created_at: string; user_id: string }
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, currency, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50) as { data: PayRow[] | null; error: unknown }

    const successfulPayments = (payments ?? []).filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'completed')
    const totalRevenue = successfulPayments.reduce((s, p) => s + (p.amount ?? 0), 0)

    // This month
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const thisMonthPayments = successfulPayments.filter(p => new Date(p.created_at) >= startOfMonth)
    const thisMonthRevenue = thisMonthPayments.reduce((s, p) => s + (p.amount ?? 0), 0)

    // Last month
    const startOfLastMonth = new Date(startOfMonth); startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
    const lastMonthPayments = successfulPayments.filter(p => {
      const d = new Date(p.created_at)
      return d >= startOfLastMonth && d < startOfMonth
    })
    const lastMonthRevenue = lastMonthPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0

    const paidUsers  = (starterUsers ?? 0) + (proUsers ?? 0) + (eliteUsers ?? 0)
    const estimatedMRR = (starterUsers ?? 0) * 2 + (proUsers ?? 0) * 5 + (eliteUsers ?? 0) * 8

    // Coupon usage
    type CouponRow = { code: string; discount_amount: number; times_used: number }
    let topCoupons: CouponRow[] = []
    let totalCouponSavings = 0
    try {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('code, discount_amount, times_used')
        .order('times_used', { ascending: false })
        .limit(5) as { data: CouponRow[] | null; error: unknown }
      topCoupons = coupons ?? []
      totalCouponSavings = topCoupons.reduce((s, c) => s + (c.discount_amount ?? 0) * (c.times_used ?? 0), 0)
    } catch { /* coupons table may not exist yet */ }

    const stats = [
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-t-emerald-500' },
      { label: 'This Month', value: `$${thisMonthRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-t-blue-500', trend: revenueGrowth },
      { label: 'Paid Subscribers', value: String(paidUsers), icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-t-purple-500' },
      { label: 'Total Users', value: String(totalUsers ?? 0), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-t-amber-500' },
    ]

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Revenue Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 uppercase font-medium">Financial overview and subscription metrics</p>
            </div>
            <Link
              href="/admin/trials"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-2 transition uppercase"
            >
              <TrendingUp size={15} />
              Trials &amp; Retention →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg, border, trend }) => (
              <div key={label} className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 border-t-4 ${border}`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 shadow-inner`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color} uppercase`}>{value}</p>
                <div className="flex items-center justify-between mt-1 uppercase">
                  <p className="text-[10px] text-gray-400 font-bold">{label}</p>
                  {trend !== undefined && (
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase">User Plan Distribution</h2>
            <div className="space-y-4">
              {[
                { label: 'Free',    count: freeUsers ?? 0,    barClass: 'bg-gray-400' },
                { label: 'Starter', count: starterUsers ?? 0, barClass: 'bg-blue-500' },
                { label: 'Pro',     count: proUsers ?? 0,     barClass: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
                { label: 'Elite',   count: eliteUsers ?? 0,   barClass: 'bg-gradient-to-r from-amber-500 to-orange-500' },
              ].map(({ label, count, barClass }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-[10px] mb-1.5 uppercase font-bold">
                    <span className="text-gray-700">{label}</span>
                    <span className="text-gray-400">{count} users ({totalUsers ? Math.round(count / totalUsers * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${barClass} rounded-full transition-all`} style={{ width: `${totalUsers ? count / totalUsers * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold">Estimated MRR: <span className="text-gray-600">${estimatedMRR.toFixed(2)}/month</span></p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between uppercase">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-purple-500" />
                <h2 className="text-sm font-bold text-gray-800">Coupon Usage</h2>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">
                Total savings: <span className="text-gray-600">${totalCouponSavings.toFixed(2)}</span>
              </span>
            </div>
            {topCoupons.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-[10px] uppercase font-bold">No coupon data available</div>
            ) : (
              <div className="divide-y divide-gray-50 uppercase">
                {topCoupons.map((c) => (
                  <div key={c.code} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                        <Tag size={14} className="text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-gray-900">{c.code}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{c.times_used ?? 0} uses</p>
                      </div>
                    </div>
                    <div className="text-right font-bold">
                      <p className="text-xs text-purple-600">-${(c.discount_amount ?? 0).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">
                        ${((c.discount_amount ?? 0) * (c.times_used ?? 0)).toFixed(2)} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 uppercase">
              <h2 className="text-sm font-bold text-gray-800">Recent Transactions</h2>
            </div>
            {successfulPayments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-[10px] uppercase font-bold">No transactions yet</div>
            ) : (
              <div className="divide-y divide-gray-50 uppercase shadow-sm">
                {successfulPayments.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center border border-emerald-200 shadow-sm">
                        <DollarSign size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Payment #{p.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right font-bold">
                      <p className="text-xs text-emerald-600 font-bold">${(p.amount ?? 0).toFixed(2)}</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">PAID</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[AdminRevenue] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <DollarSign size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Revenue Access Error</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading financial metrics. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
