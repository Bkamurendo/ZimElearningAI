import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, AlertTriangle, Users, Lock, Activity, Eye, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'

export const metadata = { title: 'Security — Admin' }

export default async function AdminSecurityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch security-related data
  const [
    { data: auditLogs },
    { data: failedLogins },
    { data: adminActions },
    { data: suspiciousActivity },
    { data: activeSessions },
  ] = await Promise.all([
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('failed_login_attempts').select('*').gte('created_at', sevenDaysAgo),
    supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('suspicious_activity').select('*').gte('created_at', twentyFourHoursAgo),
    supabase.from('user_sessions').select('user_id, created_at, ip_address, user_agent').gte('created_at', twentyFourHoursAgo),
  ])

  // Security metrics
  const recentFailedLogins = failedLogins?.length || 0
  const suspiciousCount = suspiciousActivity?.length || 0
  const activeSessionCount = activeSessions?.length || 0
  const recentAdminActions = adminActions?.length || 0

  const SecurityCard = ({ title, value, icon: Icon, color, status }: {
    title: string
    value: string | number
    icon: any
    color: string
    status?: 'warning' | 'danger' | 'success'
  }) => (
    <div className={`bg-white rounded-xl border ${status === 'danger' ? 'border-red-200' : status === 'warning' ? 'border-amber-200' : 'border-gray-200'} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {status === 'danger' && <XCircle size={16} className="text-red-500" />}
        {status === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
        {status === 'success' && <CheckCircle size={16} className="text-green-500" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-red-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Security & Audit</h1>
              <p className="text-red-200 text-sm">Monitor platform security and admin activity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SecurityCard
            title="Failed Logins (7 days)"
            value={recentFailedLogins}
            icon={Lock}
            color="bg-red-500"
            status={recentFailedLogins > 10 ? 'danger' : recentFailedLogins > 5 ? 'warning' : 'success'}
          />
          <SecurityCard
            title="Suspicious Activity"
            value={suspiciousCount}
            icon={AlertTriangle}
            color="bg-amber-500"
            status={suspiciousCount > 0 ? 'warning' : 'success'}
          />
          <SecurityCard
            title="Active Sessions"
            value={activeSessionCount}
            icon={Users}
            color="bg-blue-500"
          />
          <SecurityCard
            title="Admin Actions (24h)"
            value={recentAdminActions}
            icon={Activity}
            color="bg-purple-500"
          />
        </div>

        {/* Security Alerts */}
        {(recentFailedLogins > 10 || suspiciousCount > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-600" />
              <h2 className="font-semibold text-red-900">Security Alerts Detected</h2>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              {recentFailedLogins > 10 && (
                <p>• High number of failed login attempts detected ({recentFailedLogins} in 7 days)</p>
              )}
              {suspiciousCount > 0 && (
                <p>• {suspiciousCount} suspicious activities detected in the last 24 hours</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                Review Details
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition">
                Enable Enhanced Monitoring
              </button>
            </div>
          </div>
        )}

        {/* Recent Admin Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-purple-600" />
            Recent Admin Actions
          </h2>
          <div className="space-y-3">
            {adminActions?.slice(0, 5).map(action => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.action}</p>
                    <p className="text-xs text-gray-500">{action.resource_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(action.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(action.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {(!adminActions || adminActions.length === 0) && (
              <p className="text-center text-gray-400 py-4">No recent admin actions</p>
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye size={18} className="text-blue-600" />
            Audit Logs
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs?.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.action.includes('DELETE') ? 'bg-red-500' :
                    log.action.includes('UPDATE') ? 'bg-amber-500' :
                    log.action.includes('CREATE') ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{log.action}</p>
                    <p className="text-xs text-gray-500">{log.resource_type} • {log.admin_id}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {(!auditLogs || auditLogs.length === 0) && (
              <p className="text-center text-gray-400 py-4">No audit logs available</p>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Session Timeout</p>
                <p className="text-sm text-gray-500">Automatically log out inactive users</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">IP Whitelist</p>
                <p className="text-sm text-gray-500">Restrict admin access to specific IPs</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
