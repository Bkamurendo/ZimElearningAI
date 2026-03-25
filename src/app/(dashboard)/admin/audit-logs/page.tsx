import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, ArrowLeft } from 'lucide-react'

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
  const prefix = Object.keys(ACTION_COLORS).find(k => action.startsWith(k))
  return prefix ? ACTION_COLORS[prefix] : 'bg-gray-50 text-gray-600'
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { resource_type?: string; offset?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const resource_type = searchParams.resource_type ?? ''
  const offset = parseInt(searchParams.offset ?? '0')

  let query = supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_admin_id_fkey(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + 49)

  if (resource_type) query = query.eq('resource_type', resource_type)

  const { data: logs, count, error } = await query
  const total = count ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
              <p className="text-slate-400 text-sm">Read-only trail of all admin actions · {total.toLocaleString()} entries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase">Filter by resource:</span>
            <Link href="/admin/audit-logs" className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${!resource_type ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              All
            </Link>
            {RESOURCE_TYPES.map(rt => (
              <Link key={rt} href={`/admin/audit-logs?resource_type=${rt}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition capitalize ${resource_type === rt ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {rt}
              </Link>
            ))}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
            Error loading logs: {error.message}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            <p>No audit log entries yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Resource</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const adminProfile = log.profiles as { full_name: string | null; email: string } | null
                  const details = log.details as Record<string, unknown> | null
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' '}
                        {new Date(log.created_at as string).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-700 text-xs">{adminProfile?.full_name ?? 'Unknown'}</p>
                        <p className="text-gray-400 text-xs">{adminProfile?.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColor(log.action as string)}`}>
                          {(log.action as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded capitalize">
                          {log.resource_type as string}
                        </span>
                        {log.resource_id && (
                          <p className="text-gray-400 text-xs mt-0.5 font-mono">{(log.resource_id as string).slice(0, 8)}…</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs max-w-xs">
                        {details ? (
                          <details className="cursor-pointer">
                            <summary className="text-purple-600 hover:text-purple-700">View details</summary>
                            <pre className="mt-1 bg-gray-50 rounded p-2 text-xs overflow-auto max-h-32">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </details>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing {offset + 1}–{Math.min(offset + 50, total)} of {total.toLocaleString()}</span>
            <div className="flex gap-2">
              {offset > 0 && (
                <Link href={`/admin/audit-logs?${resource_type ? `resource_type=${resource_type}&` : ''}offset=${offset - 50}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">← Prev</Link>
              )}
              {offset + 50 < total && (
                <Link href={`/admin/audit-logs?${resource_type ? `resource_type=${resource_type}&` : ''}offset=${offset + 50}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">Next →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
