import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, Users, ArrowLeft, CreditCard, Activity, Target, Zap, DollarSign } from 'lucide-react'

export const metadata = { title: 'Analytics — ZimLearn Admin' }

export default async function AdminAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // ── Fetch comprehensive analytics data ───────────────────────
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const [
    { count: totalStudents },
    { count: totalTeachers },
    { data: recentAttempts },
    { data: subjectEnrollments },
    { data: masteryStats },
    { data: revenueData },
    { data: engagementData },
    { data: activityData },
    { data: conversionData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('quiz_attempts')
      .select('score, total, subject_id, created_at, student_id, subjects(name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('student_subjects').select('subject_id, subjects(name)', { count: 'exact' }),
    supabase.from('topic_mastery').select('mastery_level'),
    // Revenue analytics
    supabase.from('profiles').select('plan, subscription_expires_at, created_at').eq('role', 'student').not('plan', 'is', null),
    // Engagement metrics (user_activity table may not exist yet)
    Promise.resolve({ data: [] }),
    // Activity tracking
    supabase.from('profiles').select('last_sign_in_at, created_at').eq('role', 'student'),
    // Conversion tracking
    supabase.from('profiles').select('plan, trial_ends_at, subscription_expires_at').eq('role', 'student').not('trial_ends_at', 'is', null),
  ])

  // Process comprehensive analytics
  const attempts = recentAttempts ?? []
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.total > 0 ? (a.score / a.total) * 100 : 0), 0) / attempts.length)
    : 0

  // Revenue calculations (Matching lib/subscription.ts)
  const paidUsers = revenueData?.filter(u => u.plan !== 'free') || []
  const eliteUsers = paidUsers.filter(u => u.plan === 'elite')
  const proUsers = paidUsers.filter(u => u.plan === 'pro')
  const starterUsers = paidUsers.filter(u => u.plan === 'starter')
  
  const monthlyRevenue = (starterUsers.length * 2) + (proUsers.length * 5) + (eliteUsers.length * 8)
  const yearlyRevenue = monthlyRevenue * 12

  // Engagement metrics
  const activeUsers = activityData?.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) || []
  const newUsers = activityData?.filter(u => new Date(u.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) || []
  const totalActivities = engagementData?.length || 0

  // Conversion analytics
  const trialUsers = conversionData || []
  const convertedUsers = trialUsers.filter(u => u.plan !== 'free')
  const conversionRate = trialUsers.length > 0 ? Math.round((convertedUsers.length / trialUsers.length) * 100) : 0

  // Subject popularity
  const subjectCounts: Record<string, { name: string; count: number }> = {}
  for (const row of (subjectEnrollments ?? [])) {
    const subj = row.subjects as unknown as { name: string } | null
    if (!subj || Array.isArray(subj)) continue
    const key = row.subject_id as string
    if (!subjectCounts[key]) subjectCounts[key] = { name: subj.name, count: 0 }
    subjectCounts[key].count++
  }
  const topSubjects = Object.values(subjectCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxSubjectCount = topSubjects[0]?.count ?? 1

  // Mastery distribution
  const masteryDist = { not_started: 0, learning: 0, practicing: 0, mastered: 0 }
  for (const row of (masteryStats ?? [])) {
    const lvl = row.mastery_level as keyof typeof masteryDist
    if (lvl in masteryDist) masteryDist[lvl]++
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
              <p className="text-indigo-200 text-sm">Real-time insights across the platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: totalStudents ?? 0, icon: Users, color: 'emerald', border: 'border-emerald-500' },
            { label: 'Active This Week', value: activeUsers.length, icon: Activity, color: 'blue', border: 'border-blue-500' },
            { label: 'Monthly Revenue', value: `$${monthlyRevenue}`, icon: DollarSign, color: 'purple', border: 'border-purple-500' },
            { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Target, color: 'amber', border: 'border-amber-500' },
          ].map(({ label, value, icon: Icon, border }) => (
            <div key={label} className={`bg-white rounded-2xl shadow-sm border-t-4 ${border} p-5`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              <Icon size={16} className="text-gray-300 mt-2" />
            </div>
          ))}
        </div>

        {/* Revenue & Engagement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Analytics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-purple-600" />
              Revenue Analytics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <span className="text-xl font-bold text-purple-600">${monthlyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Yearly Projection</span>
                <span className="text-lg font-semibold text-gray-900">${yearlyRevenue.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Starter Plans ($2)</p>
                  <p className="text-lg font-bold text-blue-700">{starterUsers.length}</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-3">
                  <p className="text-xs text-indigo-600 font-medium">Pro Plans ($5)</p>
                  <p className="text-lg font-bold text-indigo-700">{proUsers.length}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Elite Plans ($8)</p>
                  <p className="text-lg font-bold text-purple-700">{eliteUsers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-600" />
              Engagement Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users (7 days)</span>
                <span className="text-xl font-bold text-blue-600">{activeUsers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Users (30 days)</span>
                <span className="text-lg font-semibold text-gray-900">{newUsers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Activities</span>
                <span className="text-lg font-semibold text-gray-900">{totalActivities}</span>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-amber-600 font-medium">Avg Quiz Score</p>
                <p className="text-lg font-bold text-amber-700">{avgScore}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top subjects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Top Subjects by Enrolment</h2>
            {topSubjects.length === 0 ? (
              <p className="text-gray-400 text-sm">No enrolment data yet</p>
            ) : (
              <div className="space-y-3">
                {topSubjects.map(({ name, count }) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{name}</span>
                      <span className="text-gray-500">{count} students</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((count / maxSubjectCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mastery distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Topic Mastery Distribution</h2>
            <div className="space-y-3">
              {[
                { key: 'mastered', label: 'Mastered', color: 'bg-emerald-500' },
                { key: 'practicing', label: 'Practicing', color: 'bg-blue-500' },
                { key: 'learning', label: 'Learning', color: 'bg-amber-500' },
                { key: 'not_started', label: 'Not Started', color: 'bg-gray-300' },
              ].map(({ key, label, color }) => {
                const count = masteryDist[key as keyof typeof masteryDist]
                const total = Object.values(masteryDist).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent quiz attempts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Quiz Attempts</h2>
            <p className="text-sm text-gray-500">Last 50 attempts across the platform</p>
          </div>
          {attempts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No quiz attempts yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attempts.map((a, i) => {
                    const subj = a.subjects as unknown as { name: string } | null
                    const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-700">{subj?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-gray-600">{a.score}/{a.total}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pct >= 70 ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-400">
                          {new Date(a.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Teacher stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-2">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTeachers ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Teachers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Recent Quizzes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{topSubjects.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active Subjects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
