import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CreditCard, TrendingUp, Calendar, Users, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export const metadata = { title: 'Payment Tracking — Admin' }

export default async function AdminPaymentsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${profile?.role}/dashboard`)

  // Fetch all users with payment information
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      plan,
      subscription_expires_at,
      created_at,
      last_sign_in_at
    `)
    .eq('role', 'student')
    .not('plan', 'is', null)
    .order('subscription_expires_at', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
  }

  const now = new Date()
  
  // Categorize users by plan and status
  const premiumUsers = users?.filter(user => user.plan === 'premium') || []
  const basicUsers = users?.filter(user => user.plan === 'basic') || []
  const expiredSubscriptions = users?.filter(user => 
    user.subscription_expires_at && new Date(user.subscription_expires_at) < now
  ) || []
  
  const expiringSoon = users?.filter(user => {
    if (!user.subscription_expires_at) return false
    const daysLeft = Math.ceil((new Date(user.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 7
  }) || []

  const getSubscriptionStatus = (user: { plan: string; subscription_expires_at: string | null }) => {
    if (!user.subscription_expires_at) {
      return { status: 'lifetime', color: 'text-purple-600', bg: 'bg-purple-50', label: 'Lifetime' }
    }
    
    const daysLeft = Math.ceil((new Date(user.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) {
      return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' }
    } else if (daysLeft <= 7) {
      return { status: 'expiring', color: 'text-amber-600', bg: 'bg-amber-50', label: `${daysLeft} days left` }
    } else {
      return { status: 'active', color: 'text-green-600', bg: 'bg-green-50', label: `${daysLeft} days left` }
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'basic':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const UserRow = ({ user }: { user: { id: string; full_name: string | null; email: string; phone: string | null; plan: string; subscription_expires_at: string | null; created_at: string; last_sign_in_at: string | null } }) => {
    const status = getSubscriptionStatus(user)
    const lastLogin = user.last_sign_in_at 
      ? new Date(user.last_sign_in_at).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })
      : 'Never'

    return (
      <tr className="hover:bg-gray-50 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.full_name || 'Unknown'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadge(user.plan)}`}>
            {user.plan?.toUpperCase() || 'FREE'}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.status === 'expiring' && <AlertTriangle size={12} className="mr-1" />}
            {status.status === 'expired' && <XCircle size={12} className="mr-1" />}
            {status.status === 'active' && <CheckCircle size={12} className="mr-1" />}
            {status.status === 'lifetime' && <TrendingUp size={12} className="mr-1" />}
            {status.label}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {user.subscription_expires_at 
            ? new Date(user.subscription_expires_at).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })
            : 'Lifetime'
          }
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{lastLogin}</td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {user.phone || 'Not provided'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/users?filter=${user.email}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
            >
              View Details
            </Link>
          </div>
        </td>
      </tr>
    )
  }

  // Calculate revenue estimates (assuming basic: $5/month, premium: $15/month)
  const estimatedMonthlyRevenue = (basicUsers.length * 5) + (premiumUsers.length * 15)
  const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Tracking</h1>
              <p className="text-emerald-200 text-sm">
                Monitor subscriptions, track revenue, and manage user payments
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${estimatedMonthlyRevenue}</p>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${estimatedYearlyRevenue}</p>
                <p className="text-sm text-gray-500">Yearly Revenue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
                <p className="text-sm text-gray-500">Paying Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{expiringSoon.length}</p>
                <p className="text-sm text-gray-500">Expiring Soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Premium</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{premiumUsers.length} users</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Basic</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{basicUsers.length} users</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">${estimatedMonthlyRevenue}/month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active Subscriptions</span>
                <span className="text-sm font-bold text-green-600">
                  {users?.length ? users.length - expiredSubscriptions.length : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Expired Subscriptions</span>
                <span className="text-sm font-bold text-red-600">{expiredSubscriptions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Expiring Soon</span>
                <span className="text-sm font-bold text-amber-600">{expiringSoon.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for expiring subscriptions */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  {expiringSoon.length} subscription{expiringSoon.length !== 1 ? 's' : ''} expiring in the next 7 days
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Send renewal reminders to prevent service interruption
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Paying Users</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard size={16} />
                {users?.length || 0} total users
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users?.map(user => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
            
            {(!users || users.length === 0) && (
              <div className="text-center py-12">
                <CreditCard size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No paying users found</p>
                <p className="text-gray-400 text-sm mt-1">Users with paid subscriptions will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
