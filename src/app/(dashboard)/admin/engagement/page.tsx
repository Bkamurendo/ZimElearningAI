import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Activity, Users, Clock, AlertTriangle, TrendingUp, ArrowLeft, Eye, BookOpen, Target, Zap } from 'lucide-react'

export const metadata = { title: 'User Engagement — Admin' }

export default async function AdminEngagementPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch comprehensive engagement data
  const [
    { data: allUsers },
    { data: recentActivity },
    { data: loginData },
    { data: featureUsage },
    { data: studyTime },
    { data: inactiveUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, last_sign_in_at, created_at').eq('role', 'student'),
    supabase.from('user_activity').select('user_id, activity_type, created_at, metadata').gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id, last_sign_in_at').eq('role', 'student'),
    supabase.from('feature_usage').select('user_id, feature, usage_count, last_used').gte('last_used', thirtyDaysAgo),
    supabase.from('study_sessions').select('user_id, duration, subject, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id, full_name, email, last_sign_in_at').eq('role', 'student').lt('last_sign_in_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Process engagement metrics
  const totalUsers = allUsers?.length || 0
  const activeToday = loginData?.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(oneDayAgo)) || []
  const activeThisWeek = loginData?.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(sevenDaysAgo)) || []
  const activeThisMonth = loginData?.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(thirtyDaysAgo)) || []
  const inactiveUsersCount = inactiveUsers?.length || 0

  // Activity breakdown
  const activityByType = recentActivity?.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Study time analytics
  const totalStudyMinutes = studyTime?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0
  const avgStudySession = studyTime?.length > 0 ? Math.round(totalStudyMinutes / studyTime.length) : 0

  // Feature popularity
  const featureStats = featureUsage?.reduce((acc, feature) => {
    acc[feature.feature] = (acc[feature.feature] || 0) + feature.usage_count
    return acc
  }, {} as Record<string, number>) || {}

  // At-risk users (inactive for 14+ days)
  const atRiskUsers = inactiveUsers?.slice(0, 10) || []

  const EngagementCard = ({ title, value, icon: Icon, color, trend }: {
    title: string
    value: string | number
    icon: any
    color: string
    trend?: string
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">User Engagement Analytics</h1>
              <p className="text-blue-200 text-sm">Monitor user activity and identify engagement patterns</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Engagement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EngagementCard
            title="Active Today"
            value={activeToday.length}
            icon={Zap}
            color="bg-green-500"
            trend={`${Math.round((activeToday.length / totalUsers) * 100)}% of users`}
          />
          <EngagementCard
            title="Active This Week"
            value={activeThisWeek.length}
            icon={Users}
            color="bg-blue-500"
            trend={`${Math.round((activeThisWeek.length / totalUsers) * 100)}% of users`}
          />
          <EngagementCard
            title="At-Risk Users"
            value={inactiveUsersCount}
            icon={AlertTriangle}
            color="bg-amber-500"
            trend="14+ days inactive"
          />
          <EngagementCard
            title="Avg Study Session"
            value={`${avgStudySession}m`}
            icon={Clock}
            color="bg-purple-500"
          />
        </div>

        {/* Activity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Types */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              Activity Breakdown (30 days)
            </h2>
            <div className="space-y-3">
              {Object.entries(activityByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(activityByType))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Usage */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-600" />
              Feature Popularity
            </h2>
            <div className="space-y-3">
              {Object.entries(featureStats).map(([feature, count]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{feature.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(featureStats))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* At-Risk Users Alert */}
        {atRiskUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-amber-600" />
              <h2 className="font-semibold text-amber-900">At-Risk Users (Inactive 14+ days)</h2>
            </div>
            <div className="space-y-2">
              {atRiskUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Last seen: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </span>
                    <button className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 transition">
                      Send Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Time Analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-green-600" />
            Study Time Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Total Study Time</p>
              <p className="text-2xl font-bold text-green-700">{Math.round(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Average Session</p>
              <p className="text-2xl font-bold text-blue-700">{avgStudySession} minutes</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-purple-700">{studyTime?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
