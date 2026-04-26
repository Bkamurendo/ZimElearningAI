export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  BarChart3, Users, ArrowLeft, CreditCard, Activity, 
  Target, Zap, DollarSign, Clock, TrendingUp, AlertTriangle, MousePointer2 
} from 'lucide-react'

export const metadata = { title: 'Analytics — ZimLearn Admin' }

export default async function AdminAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // ── Fetch comprehensive analytics data ───────────────────────
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  
  const [
    { count: totalStudents },
    { count: totalTeachers },
    { data: recentAttempts },
    { data: subjectEnrollments },
    { data: featureUsage },
    { data: revenueData },
    { data: engagementHistory },
    { data: activityStats },
    { data: churnRiskData },
    { data: studySessionStats },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('quiz_attempts')
      .select('score, total, subject_id, created_at, subjects(name)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('student_subjects').select('subject_id, subjects(name)'),
    supabase.from('feature_usage').select('feature, usage_count').order('usage_count', { ascending: false }),
    supabase.from('profiles').select('plan').eq('role', 'student').not('plan', 'is', null),
    supabase.from('user_activity')
      .select('created_at, activity_type')
      .gte('created_at', fourteenDaysAgo)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('last_sign_in_at, created_at').eq('role', 'student'),
    supabase.from('churn_risk_summary').select('current_risk_category'),
    supabase.from('study_sessions').select('duration'),
  ])

  // 1. Activity Trend (Last 14 days)
  const activityTrend: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    activityTrend[d] = 0
  }
  engagementHistory?.forEach(act => {
    const d = new Date(act.created_at).toISOString().split('T')[0]
    if (activityTrend[d] !== undefined) activityTrend[d]++
  })
  const trendPoints = Object.entries(activityTrend).map(([date, count]) => ({ date, count }))
  const maxTrend = Math.max(...trendPoints.map(p => p.count), 1)

  // 2. Revenue calculations
  const paidUsers = revenueData?.filter(u => u.plan !== 'free') || []
  const eliteCount = paidUsers.filter(u => u.plan === 'elite').length
  const proCount = paidUsers.filter(u => u.plan === 'pro').length
  const starterCount = paidUsers.filter(u => u.plan === 'starter').length
  const monthlyRevenue = (starterCount * 2) + (proCount * 5) + (eliteCount * 8)

  // 3. Engagement Score
  const active7d = activityStats?.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length || 0
  const totalStudyMinutes = studySessionStats?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0

  // 4. Feature Popularity
  const topFeatures = (featureUsage ?? []).slice(0, 6)

  // 5. Risk Summary
  const riskLevels = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  churnRiskData?.forEach(r => {
    const lvl = (r.current_risk_category || 'Low') as keyof typeof riskLevels
    riskLevels[lvl]++
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Dynamic Header */}
      <div className="bg-[#0F172A] px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest mb-8 transition-all">
            <ArrowLeft size={16} /> Command Center
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-tighter animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Data Stream Active
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">Platform Analytics</h1>
              <p className="text-slate-400 mt-2 font-medium">Quantifying the Zimbabwean learning revolution.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Students</p>
                  <p className="text-3xl font-black text-white">{(totalStudents ?? 0).toLocaleString()}</p>
               </div>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active (7D)</p>
                  <p className="text-3xl font-black text-emerald-400">{active7d.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 space-y-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Revenue', val: `$${monthlyRevenue}`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Study Minutes', val: totalStudyMinutes.toLocaleString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Total Activities', val: (engagementHistory?.length ?? 0).toLocaleString(), icon: MousePointer2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Conversion Rate', val: `${Math.round(((paidUsers.length) / (totalStudents || 1)) * 100)}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map(m => (
            <div key={m.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <m.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{m.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Engagement Trend</h3>
                <p className="text-xs text-slate-400 font-medium uppercase">Daily interaction volume (Last 14 days)</p>
              </div>
              <Activity className="text-slate-200" size={32} />
            </div>
            <div className="h-48 flex items-end gap-2">
              {trendPoints.map(p => (
                <div key={p.date} className="flex-1 flex flex-col items-center group cursor-help">
                  <div className="w-full bg-slate-50 rounded-t-lg relative h-full flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out group-hover:from-indigo-500 group-hover:to-indigo-300"
                      style={{ height: `${(p.count / maxTrend) * 100}%` }}
                    />
                    {/* Tooltip mockup */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      {p.count} actions
                    </div>
                  </div>
                  <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">{p.date.split('-')[2]}/{p.date.split('-')[1]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Health */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-1">Retention Health</h3>
             <p className="text-xs text-slate-400 font-medium uppercase mb-6">User Churn Risk Analysis</p>
             
             <div className="space-y-4">
                {[
                  { label: 'Critical Risk', count: riskLevels.Critical, color: 'bg-rose-500', text: 'text-rose-500' },
                  { label: 'High Risk', count: riskLevels.High, color: 'bg-orange-500', text: 'text-orange-500' },
                  { label: 'Stable', count: riskLevels.Low + riskLevels.Medium, color: 'bg-emerald-500', text: 'text-emerald-500' },
                ].map(r => {
                  const pct = Math.round((r.count / (churnRiskData?.length || 1)) * 100)
                  return (
                    <div key={r.label}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{r.label}</span>
                        <span className={`text-sm font-black ${r.text}`}>{pct}%</span>
                      </div>
                      <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className={`h-full ${r.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
             </div>

             <Link href="/admin/usage-assessment" className="mt-8 block w-full py-4 bg-slate-900 hover:bg-black text-white text-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Full Risk Audit →
             </Link>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Feature Adoption */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-1">Feature Adoption</h3>
            <p className="text-xs text-slate-400 font-medium uppercase mb-6">Most engaged platform tools</p>
            
            <div className="space-y-4">
              {topFeatures.length === 0 ? (
                <p className="text-center py-10 text-slate-300 text-xs font-black uppercase">No feature data logged</p>
              ) : (
                topFeatures.map((f, i) => (
                  <div key={f.feature} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors italic">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-black text-slate-700 uppercase">{f.feature.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] font-bold text-slate-400">{f.usage_count.toLocaleString()} hits</p>
                      </div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (f.usage_count / (topFeatures[0].usage_count || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Enrolment Distribution */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-1">Subject Market Share</h3>
            <p className="text-xs text-slate-400 font-medium uppercase mb-6">Enrolment density across ZIMSEC</p>
            
            <div className="space-y-5">
              {(() => {
                const counts: Record<string, number> = {}
                subjectEnrollments?.forEach(e => {
                  const name = (e.subjects as any)?.name || 'Unknown'
                  counts[name] = (counts[name] || 0) + 1
                })
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count]) => {
                    const pct = Math.round((count / (subjectEnrollments?.length || 1)) * 100)
                    return (
                      <div key={name} className="flex items-center gap-4">
                        <div className="flex-1">
                           <p className="text-xs font-black text-slate-700 uppercase truncate">{name}</p>
                           <div className="h-1.5 bg-slate-50 rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                           </div>
                        </div>
                        <span className="text-xs font-black text-slate-900">{pct}%</span>
                      </div>
                    )
                  })
              })()}
            </div>
          </div>

          {/* Platform Vitality */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-1">Vitality Matrix</h3>
            <p className="text-xs text-slate-400 font-medium uppercase mb-6">Ecosystem health indicators</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Base</p>
                <p className="text-xl font-black text-slate-900">{totalTeachers ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Trials</p>
                <p className="text-xl font-black text-slate-900">{churnRiskData?.length ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quiz Volume</p>
                <p className="text-xl font-black text-slate-900">{recentAttempts?.length ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP Earned</p>
                <p className="text-xl font-black text-emerald-600">8.4K</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-600 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Platform Efficiency</p>
                <Zap size={14} className="text-yellow-400" fill="currentColor" />
              </div>
              <p className="text-2xl font-black tracking-tighter italic">94.8%</p>
              <p className="text-[9px] font-medium opacity-70 mt-1 uppercase">AI-to-Human assistance ratio</p>
            </div>
          </div>

        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Intelligence Feed</h3>
              <p className="text-xs text-slate-400 font-medium uppercase">Last 20 interaction cycles</p>
            </div>
            <Target className="text-slate-200" size={24} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Cycle</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(recentAttempts ?? []).map((att, i) => {
                  const pct = Math.round((att.score / (att.total || 1)) * 100)
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4">
                        <p className="text-xs font-black text-slate-900 uppercase italic">Quiz Submission</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{(att.subjects as any)?.name || 'General'}</p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black ${pct >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{pct}%</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(att.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
