import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'Audit Logs — ZimLearn Admin' }

const RESOURCE_TYPES = ['user', 'document', 'subject', 'question', 'setting', 'announcement', 'notification']

const ACTION_COLORS: Record<string, string> = {
  approve: 'bg-emerald-50 text-emerald-700',
  create: 'bg-blue-50 text-blue-700',
  update: 'bg-amber-50 text-amber-700',
  delete: 'bg-red-50 text-red-600',
  suspend: 'bg-red-50 text-red-600',
  unsuspend: 'bg-emerald-50 text-emerald-700',
  reject: 'bg-red-50 text-red-600',
  bulk: 'bg-purple-50 text-purple-700',
}

function actionColor(action: string) {
  const lower = action?.toLowerCase() || ''
  const prefix = Object.keys(ACTION_COLORS).find(k => lower.startsWith(k))
  return prefix ? ACTION_COLORS[prefix] : 'bg-gray-50 text-gray-600'
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { resource_type?: string; offset?: string }
}) {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    
    if (profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const resource_type = searchParams.resource_type ?? ''
    const offset = parseInt(searchParams.offset ?? '0')

    let query = supabase
      .from('audit_logs')
      .select('*, profiles!audit_logs_admin_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + 49)

    if (resource_type) query = query.eq('resource_type', resource_type)

    const { data: logs, count, error: queryError } = await query
    
    if (queryError) throw queryError
    
    const total = count ?? 0

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-[10px] mb-4 transition uppercase font-bold">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Audit logs</h1>
                <p className="text-slate-400 text-[10px] uppercase font-medium">Read-only trail of admin actions · {total.toLocaleString()} entries</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-2 items-center uppercase">
              <span className="text-[10px] font-bold text-gray-400">Filter by Resource:</span>
              <Link href="/admin/audit-logs" className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition shadow-sm border ${!resource_type ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
                All
              </Link>
              {RESOURCE_TYPES.map(rt => (
                <Link key={rt} href={`/admin/audit-logs?resource_type=${rt}`}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition shadow-sm border ${resource_type === rt ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
                  {rt}
                </Link>
              ))}
            </div>
          </div>

          {!logs || logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100 uppercase">
              <Shield size={32} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm">No entries found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50 uppercase">
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Time</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Admin</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Action</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Resource</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {logs.map(log => {
                      const adminData = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles
                      const adminProfile = adminData as { full_name: string | null; email: string } | null
                      const details = log.details as Record<string, unknown> | null
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors uppercase">
                          <td className="px-6 py-4 text-gray-400 text-[10px] whitespace-nowrap font-bold">
                            {new Date(log.created_at as string).toLocaleDateString()} {new Date(log.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-[10px]">{adminProfile?.full_name ?? 'Unknown'}</p>
                            <p className="text-gray-400 text-[10px]">{adminProfile?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${actionColor(log.action as string)}`}>
                              {(log.action as string).replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">
                              {log.resource_type as string}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-[10px] max-w-xs truncate font-bold">
                            {details ? JSON.stringify(details).slice(0, 50) + '...' : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {total > 50 && (
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
              <span>Showing {offset + 1}–{Math.min(offset + 50, total)} of {total.toLocaleString()}</span>
              <div className="flex gap-2">
                {offset > 0 && (
                  <Link href={`/admin/audit-logs?${resource_type ? `resource_type=${resource_type}&` : ''}offset=${offset - 50}`}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">← Prev</Link>
                )}
                {offset + 50 < total && (
                  <Link href={`/admin/audit-logs?${resource_type ? `resource_type=${resource_type}&` : ''}offset=${offset + 50}`}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">Next →</Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch (err) {
    console.error('[AdminAudit] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Audit Trail Unavailable</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading the system logs. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
