import { createClient } from '@supabase/supabase-js'
import { Clock, AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react'

export const metadata = { title: 'Trial Management Test — Admin' }

export default async function AdminTrialsTestPage() {
  // Use admin client for data fetching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all trial users with their details
  const { data: trialUsers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone_number,
      plan,

      trial_ends_at,
      subscription_expires_at,
      created_at,
      last_sign_in_at
    `)
    .eq('role', 'student')
    .not('trial_ends_at', 'is', null)
    .order('trial_ends_at', { ascending: true })

  if (error) {
    console.error('Error fetching trial users:', error)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Trial Data</h2>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  
  // Categorize users
  const activeTrials = trialUsers?.filter(user => {
    return user.trial_ends_at && new Date(user.trial_ends_at) > now
  }) || []

  const expiredTrials = trialUsers?.filter(user => {
    return user.trial_ends_at && new Date(user.trial_ends_at) <= now
  }) || []

  const expiringSoon = trialUsers?.filter(user => {
    if (!user.trial_ends_at) return false
    const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 3
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trial Management (Test)</h1>
          <p className="text-gray-600 mt-2">This is a test version without authentication requirements</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trials</p>
                <p className="text-2xl font-bold text-gray-900">{trialUsers?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Trials</p>
                <p className="text-2xl font-bold text-gray-900">{activeTrials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired Trials</p>
                <p className="text-2xl font-bold text-gray-900">{expiredTrials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{expiringSoon.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Trial Users ({trialUsers?.length || 0})</h2>
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
                    Trial Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trialUsers?.map((user) => {
                  const isActive = user.trial_ends_at && new Date(user.trial_ends_at) > now
                  const daysLeft = user.trial_ends_at 
                    ? Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  
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
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isActive ? `${daysLeft} days` : '0 days'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : 'N/A'}
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
