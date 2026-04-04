import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AlertTriangle, Users, TrendingDown, Target, Mail, Phone, MessageSquare, Calendar, BarChart3, Zap, Shield } from 'lucide-react'

export const metadata = { title: 'Churn Reduction — Admin' }

export default async function AdminChurnReductionPage() {
  // Use server client for authentication
  const serverSupabase = createServerClient()
  const {
    data: { user },
  } = await serverSupabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  // Use admin client for data fetching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch churn risk data
  const [
    { data: allUsers },
    { data: inactiveUsers },
    { data: trialUsers },
    { data: expiringTrials },
    { data: recentActivity },
    { data: supportTickets }
  ] = await Promise.all([
    // All active users
    supabase
      .from('profiles')
      .select('id, full_name, email, plan, created_at, last_sign_in_at')
      .eq('role', 'student')
      .not('last_sign_in_at', 'is', null),
    
    // Users inactive for 30+ days
    supabase
      .from('profiles')
      .select('id, full_name, email, plan, created_at, last_sign_in_at')
      .eq('role', 'student')
      .lt('last_sign_in_at', thirtyDaysAgo.toISOString())
      .order('last_sign_in_at', { ascending: true }),
    
    // Trial users
    supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at, created_at, last_sign_in_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null),
    
    // Trials expiring in 7 days
    supabase
      .from('profiles')
      .select('id, full_name, email, plan, trial_ends_at, created_at, last_sign_in_at')
      .eq('role', 'student')
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .gt('trial_ends_at', now.toISOString()),
    
    // Recent activity patterns
    supabase
      .from('user_activity')
      .select('user_id, activity_type, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    
    // Recent support tickets (indicator of dissatisfaction)
    supabase
      .from('support_tickets')
      .select('user_id, category, status, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
  ])

  // Calculate churn metrics
  const totalActiveUsers = allUsers?.length || 0
  const inactiveUsersCount = inactiveUsers?.length || 0
  const churnRate = totalActiveUsers > 0 ? (inactiveUsersCount / totalActiveUsers) * 100 : 0

  // Identify high-risk users
  const highRiskUsers = inactiveUsers?.filter(user => {
    const daysSinceLastLogin = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
    const isTrialUser = trialUsers?.some(t => t.id === user.id)
    return daysSinceLastLogin > 21 || (isTrialUser && daysSinceLastLogin > 14)
  }) || []

  // Trial conversion risk
  const expiringSoonCount = expiringTrials?.length || 0
  const totalTrialUsers = trialUsers?.length || 0
  const trialConversionRisk = totalTrialUsers > 0 ? (expiringSoonCount / totalTrialUsers) * 100 : 0

  // Engagement patterns
  const userActivityMap = recentActivity?.reduce((acc, activity) => {
    acc[activity.user_id] = (acc[activity.user_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const disengagedUsers = allUsers?.filter(user => {
    const activityCount = userActivityMap[user.id] || 0
    const daysSinceLastLogin = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
    return activityCount < 5 && daysSinceLastLogin > 14
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Churn Reduction Dashboard</h1>
          <p className="text-gray-600 mt-2">Identify at-risk users and implement retention strategies</p>
        </div>

        {/* Churn Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalActiveUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-red-600">{churnRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk Users</p>
                <p className="text-2xl font-bold text-yellow-600">{highRiskUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trial Conversion Risk</p>
                <p className="text-2xl font-bold text-purple-600">{trialConversionRisk.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 ml-2">Re-engagement Campaign</h3>
            </div>
            <p className="text-gray-600 mb-4">Send personalized emails to inactive users</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target Users:</span>
                <span className="font-medium">{inactiveUsersCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Contact:</span>
                <span className="font-medium">30+ days ago</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Launch Campaign
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 ml-2">Personal Outreach</h3>
            </div>
            <p className="text-gray-600 mb-4">Direct contact for high-value users</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Priority Users:</span>
                <span className="font-medium">{highRiskUsers.filter(u => u.plan === 'premium').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Success Rate:</span>
                <span className="font-medium">65%</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              View Contacts
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-medium text-gray-900 ml-2">Trial Conversion</h3>
            </div>
            <p className="text-gray-600 mb-4">Convert expiring trials to paid plans</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expiring Soon:</span>
                <span className="font-medium">{expiringSoonCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Conversion Rate:</span>
                <span className="font-medium">28%</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition">
              Convert Trials
            </button>
          </div>
        </div>

        {/* High Risk Users Table */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">High Risk Users ({highRiskUsers.length})</h2>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {highRiskUsers.slice(0, 10).map((user) => {
                  const daysSinceLastLogin = Math.floor((now.getTime() - new Date(user.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
                  const isTrialUser = trialUsers?.some(t => t.id === user.id)
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.plan || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          daysSinceLastLogin > 30 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {daysSinceLastLogin > 30 ? 'Critical' : 'High'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {daysSinceLastLogin} days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">Email</button>
                          <button className="text-green-600 hover:text-green-900">Call</button>
                          <button className="text-purple-600 hover:text-purple-900">Offer</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Strategies */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Automated Retention Strategies</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-medium text-gray-900 ml-2">Welcome Series</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">7-day onboarding sequence for new users</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status: Active</span>
                  <button className="text-xs text-green-600 hover:text-green-700">Configure</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-900 ml-2">Inactive Nudges</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Automatic emails after 14, 21, 30 days</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status: Active</span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Configure</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-medium text-gray-900 ml-2">Trial Expiration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">3-day countdown with special offers</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status: Active</span>
                  <button className="text-xs text-purple-600 hover:text-purple-700">Configure</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-sm font-medium text-gray-900 ml-2">Progress Reports</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Weekly learning progress summaries</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status: Active</span>
                  <button className="text-xs text-yellow-600 hover:text-yellow-700">Configure</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
