import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, Plus, AlertTriangle, Bell, Info, Trash2 } from 'lucide-react'
import AnnouncementActions from './AnnouncementActions'

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  normal:    { label: 'Normal',    color: 'bg-blue-50 border-blue-200 text-blue-700',   icon: Info },
  important: { label: 'Important', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Bell },
  urgent:    { label: 'Urgent',    color: 'bg-red-50 border-red-200 text-red-700',       icon: AlertTriangle },
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Everyone', students: 'Students', teachers: 'Teachers', parents: 'Parents',
}

type AnnouncementRow = {
  id: string
  title: string
  body: string
  audience: string
  priority: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  poster: { full_name: string | null; role: string } | null
}

export default async function AdminAnnouncementsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const { data } = await supabase
    .from('announcements')
    .select('id, title, body, audience, priority, is_active, expires_at, created_at, poster:profiles(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(50) as { data: AnnouncementRow[] | null; error: unknown }

  const announcements = data ?? []
  const active = announcements.filter((a) => a.is_active)
  const archived = announcements.filter((a) => !a.is_active)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500 mt-0.5">Broadcast messages to students, teachers, and parents</p>
          </div>
          <Link
            href="/admin/announcements/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            New Announcement
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: announcements.length, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Active',   value: active.length,   color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Archived', value: archived.length, color: 'text-gray-400',  bg: 'bg-gray-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active announcements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Megaphone size={15} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Active Announcements</h2>
              <p className="text-xs text-gray-400 mt-0.5">{active.length} currently visible to users</p>
            </div>
          </div>

          {active.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Megaphone size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No active announcements</p>
              <p className="text-xs text-gray-400 mt-1">Create one to notify users platform-wide</p>
              <Link
                href="/admin/announcements/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl transition hover:bg-gray-800"
              >
                <Plus size={14} /> Create Announcement
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {active.map((ann) => {
                const priorityConfig = PRIORITY_CONFIG[ann.priority] ?? PRIORITY_CONFIG.normal
                const PriorityIcon = priorityConfig.icon
                return (
                  <div key={ann.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 mt-0.5 ${priorityConfig.color}`}>
                        <PriorityIcon size={11} />
                        {priorityConfig.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{ann.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>Audience: <strong className="text-gray-600">{AUDIENCE_LABELS[ann.audience] ?? ann.audience}</strong></span>
                          <span>·</span>
                          <span>{new Date(ann.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {ann.expires_at && (
                            <>
                              <span>·</span>
                              <span>Expires {new Date(ann.expires_at).toLocaleDateString('en-GB')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <AnnouncementActions announcementId={ann.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Archived */}
        {archived.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-60">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Trash2 size={15} className="text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-500 text-sm">Archived ({archived.length})</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {archived.slice(0, 5).map((ann) => (
                <div key={ann.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 truncate">{ann.title}</p>
                  </div>
                  <span className="text-xs text-gray-300">
                    {new Date(ann.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
