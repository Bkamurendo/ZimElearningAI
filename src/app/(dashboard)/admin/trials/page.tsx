import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, AlertTriangle, CheckCircle, XCircle, MessageSquare, Users, CreditCard } from 'lucide-react'

export const metadata = { title: 'Trial Management — Admin' }

export default async function AdminTrialsPage() {
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

  // Fetch all trial users with their details
  const { data: trialUsers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
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
  }

  const now = new Date()
  
  // Categorize users
  const activeTrials = trialUsers?.filter(user => {
    // Active trials are users with trial_ends_at in the future
    // regardless of their current plan (they might have upgraded during trial)
    return new Date(user.trial_ends_at) > now
  }) || []
  
  const expiredTrials = trialUsers?.filter(user => 
    new Date(user.trial_ends_at) <= now
  ) || []
  
  const paidUsers = trialUsers?.filter(user => 
    user.plan !== 'free'
  ) || []

  const expiringSoon = activeTrials.filter(user => {
    const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 3
  })

  const getDaysLeft = (trialEndsAt: string) => {
    const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 ? daysLeft : 0
  }

  const getTrialStatus = (user: { plan: string; trial_ends_at: string | null }) => {
    if (user.plan !== 'free') {
      return { status: 'paid', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Paid User' }
    }
    
    const daysLeft = getDaysLeft(user.trial_ends_at || '')
    if (daysLeft <= 0) {
      return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' }
    } else if (daysLeft <= 3) {
      return { status: 'expiring', color: 'text-amber-600', bg: 'bg-amber-50', label: `${daysLeft} days left` }
    } else {
      return { status: 'active', color: 'text-green-600', bg: 'bg-green-50', label: `${daysLeft} days left` }
    }
  }

  const UserRow = ({ user }: { user: { id: string; full_name: string | null; email: string; phone: string | null; plan: string; trial_ends_at: string | null; subscription_expires_at: string | null; created_at: string; last_sign_in_at: string | null } }) => {
    const status = getTrialStatus(user)
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.status === 'paid' && <CreditCard size={12} className="mr-1" />}
            {status.status === 'expiring' && <AlertTriangle size={12} className="mr-1" />}
            {status.status === 'expired' && <XCircle size={12} className="mr-1" />}
            {status.status === 'active' && <CheckCircle size={12} className="mr-1" />}
            {status.label}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {user.trial_ends_at 
            ? new Date(user.trial_ends_at).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })
            : 'N/A'
          }
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {user.subscription_expires_at 
            ? new Date(user.subscription_expires_at).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })
            : 'N/A'
          }
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{lastLogin}</td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {user.phone || 'Not provided'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {user.plan === 'free' && (
              <Link
                href={`/api/admin/send-sms?userId=${user.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <MessageSquare size={12} />
                Send SMS
              </Link>
            )}
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Trial Management</h1>
              <p className="text-amber-200 text-sm">
                Monitor trial users, send reminders, and track conversions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeTrials.length}</p>
                <p className="text-sm text-gray-500">Active Trials</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{expiringSoon.length}</p>
                <p className="text-sm text-gray-500">Expiring Soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{expiredTrials.length}</p>
                <p className="text-sm text-gray-500">Expired Trials</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{paidUsers.length}</p>
                <p className="text-sm text-gray-500">Converted Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for expiring trials */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  {expiringSoon.length} trial{expiringSoon.length !== 1 ? 's' : ''} expiring in the next 3 days
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Send SMS reminders to encourage conversion before they expire
                </p>
              </div>
              <button
                onClick={() => {
                  // Send bulk SMS to expiring trials
                  expiringSoon.forEach(user => {
                    fetch(`/api/admin/send-sms?userId=${user.id}`)
                  })
                }}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition"
              >
                Send All Reminders
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Trial Users</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={16} />
                {trialUsers?.length || 0} total users
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial Ends
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
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
                {trialUsers?.map(user => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
            
            {(!trialUsers || trialUsers.length === 0) && (
              <div className="text-center py-12">
                <Clock size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No trial users found</p>
                <p className="text-gray-400 text-sm mt-1">Trial users will appear here when they register</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
