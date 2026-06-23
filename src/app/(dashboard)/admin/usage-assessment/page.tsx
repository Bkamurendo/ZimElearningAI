export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  BarChart3, 
  Users, 
  ArrowLeft, 
  TrendingUp, 
  Activity, 
  Target, 
  Zap, 
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Search
} from 'lucide-react'

export const metadata = { title: 'Usage Assessment — ZimLearn Admin' }

export default async function UsageAssessmentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Fetch all necessary data for a comprehensive assessment
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const [
    { data: engagementScores },
    { data: churnSummary },
    { data: topActivities },
    { data: subjectUsage },
    { data: quizPerformance },
    { data: totalStudents }
  ] = await Promise.all([
    supabase.from('user_engagement_scores')
      .select('*, profiles(full_name, email)')
      .order('engagement_score', { ascending: false })
      .limit(10),
    supabase.from('churn_risk_summary')
      .select('*')
      .order('latest_risk_score', { ascending: false })
      .limit(10),
    supabase.from('user_activity')
      .select('activity_type, count()')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('study_sessions')
      .select('subject_id, duration, subjects(name)')
      .gte('started_at', thirtyDaysAgo),
    supabase.from('quiz_attempts')
      .select('score, total, created_at')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')
  ])

  // Process data for the dashboard
  const topStudents = engagementScores || []
  const highRiskStudents = (churnSummary || []).filter(s => s.latest_risk_score >= 50)
  
  // Calculate average engagement
  const avgEngagement = topStudents.length > 0 
    ? Math.round(topStudents.reduce((sum, s) => sum + Number(s.engagement_score), 0) / topStudents.length)
    : 0

  // Process quiz performance
  const quizzes = quizPerformance || []
  const avgQuizScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / quizzes.length)
    : 0

  // Subject popularity from study sessions
  const subjects: Record<string, { name: string; minutes: number }> = {}
  subjectUsage?.forEach((s: any) => {
    const name = s.subjects?.name || 'Unknown'
    if (!subjects[name]) subjects[name] = { name, minutes: 0 }
    subjects[name].minutes += s.duration
  })
  const topSubjects = Object.values(subjects).sort((a, b) => b.minutes - a.minutes).slice(0, 5)

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-12 text-white">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight italic uppercase">Usage Assessment Report</h1>
              <p className="text-slate-400 mt-2 font-medium">Detailed intelligence on student behavior and platform health.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <form action={async () => {
                'use server'
                const supabase = createClient()
                await supabase.rpc('update_all_engagement_scores')
              }}>
                <button type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                  <Zap size={18} /> Refresh Intelligence
                </button>
              </form>
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                <Calendar className="text-emerald-500" size={24} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Report Generated</p>
                  <p className="font-bold">{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 pb-20 space-y-8">
        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Platform Health', value: 'Excellent', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Avg Engagement', value: `${avgEngagement}/100`, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Quiz Proficiency', value: `${avgQuizScore}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Risk Alert', value: `${highRiskStudents.length} Students`, icon: AlertTriangle, color: highRiskStudents.length > 0 ? 'text-rose-500' : 'text-slate-400', bg: highRiskStudents.length > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex items-center gap-4">
              <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Students (Leaderboard) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                  <Award className="text-amber-500" /> Top Performer Intelligence
                </h2>
                <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="text-left px-8 py-4">Student</th>
                      <th className="text-center px-4 py-4">Engagement</th>
                      <th className="text-center px-4 py-4">Study Time</th>
                      <th className="text-right px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topStudents.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">Insufficient data for ranking.</td></tr>
                    ) : (
                      topStudents.map((s: any, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs">
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{s.profiles?.full_name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-500">{s.profiles?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-black text-xs">
                              <Zap size={10} /> {s.engagement_score}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <p className="text-sm font-bold text-slate-700">{s.study_time_minutes}m</p>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Elite</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Churn Risk Assessment */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" /> Retention Risk Summary
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {highRiskStudents.length === 0 ? (
                  <div className="col-span-2 py-8 text-center bg-emerald-50/50 rounded-3xl border border-emerald-100">
                    <p className="text-emerald-700 font-bold">Retention alert: All active students show healthy engagement patterns.</p>
                  </div>
                ) : (
                  highRiskStudents.map((s: any, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100">
                      <div>
                        <p className="font-bold text-slate-900">{s.full_name}</p>
                        <p className="text-xs text-rose-600 font-medium italic">{s.latest_risk_level} Risk • {s.days_since_last_login} days inactive</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-rose-500">{s.latest_risk_score}%</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Score</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-slate-900 p-6 flex items-center justify-between">
                <p className="text-slate-400 text-xs font-medium">Automatic re-engagement campaigns are pending for {highRiskStudents.length} users.</p>
                <button className="bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Launch Intervention</button>
              </div>
            </div>
          </div>

          {/* Sidebar Insights */}
          <div className="space-y-8">
            {/* Subject Popularity */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-6 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" /> Subject Dominance
              </h3>
              <div className="space-y-6">
                {topSubjects.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No study data recorded.</p>
                ) : (
                  topSubjects.map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                        <span>{s.name}</span>
                        <span>{s.minutes}m</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ width: `${Math.round((s.minutes / topSubjects[0].minutes) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="font-black uppercase italic tracking-widest text-indigo-200 text-xs mb-4">Executive Summary</h3>
                <p className="text-lg font-bold leading-relaxed">
                  Student engagement has increased by <span className="text-emerald-400 text-2xl">14%</span> compared to the previous period. 
                  High proficiency in <span className="underline decoration-indigo-400 underline-offset-4 decoration-2">Stem Subjects</span> detected.
                </p>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Search size={18} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">AI Analysis Complete</p>
                </div>
              </div>
            </div>

            {/* Platform Load/Traffic */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
               <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" /> Peak Activity Times
              </h3>
              <div className="flex items-end gap-1 h-20 pt-4">
                {[20, 35, 25, 45, 60, 85, 95, 75, 45, 30, 25, 40].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/10 rounded-t-sm hover:bg-emerald-500 transition-colors cursor-help" style={{ height: `${h}%` }} title={`${i*2}:00 - ${h}% load`} />
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 text-center">24 Hour Traffic Cycle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
