export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { Bell, CheckCircle, Megaphone } from 'lucide-react'

const NOTIF_ICONS: Record<string, string> = {
  lesson_complete:       '✅',
  quiz_complete:         '🧠',
  assignment_submitted:  '📤',
  assignment_graded:     '🎯',
  badge_earned:          '🏅',
  announcement:          '📢',
  new_resource:          '📚',
  streak_milestone:      '🔥',
}

const NOTIF_BORDER: Record<string, string> = {
  lesson_complete:       'border-l-emerald-400',
  quiz_complete:         'border-l-blue-400',
  assignment_submitted:  'border-l-indigo-400',
  assignment_graded:     'border-l-purple-400',
  badge_earned:          'border-l-amber-400',
  announcement:          'border-l-orange-400',
  new_resource:          'border-l-teal-400',
  streak_milestone:      'border-l-red-400',
}

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type NotifRow = { id: string; title: string; message: string; type: string; created_at: string; read: boolean }
  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, title, message, type, created_at, read')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50) as { data: NotifRow[] | null; error: unknown }

  type AnnouncementRow = { id: string; title: string; body: string; priority: string; created_at: string }
  let announcements: AnnouncementRow[] = []
  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, body, priority, created_at')
      .eq('is_active', true)
      .in('audience', ['all', 'students'])
      .order('created_at', { ascending: false })
      .limit(10) as { data: AnnouncementRow[] | null; error: unknown }
    announcements = data ?? []
  } catch { /* announcements table may not exist */ }

  const allNotifs = notifs ?? []
  const unreadCount = allNotifs.filter((n) => !n.read).length

  const priorityStyles: Record<string, { card: string; dot: string }> = {
    urgent: { card: 'bg-red-50 border border-red-200',    dot: 'bg-red-500'    },
    high:   { card: 'bg-amber-50 border border-amber-200', dot: 'bg-amber-500'  },
    normal: { card: 'bg-blue-50 border border-blue-200',   dot: 'bg-blue-500'   },
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div
          className="relative text-white rounded-2xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/3 translate-x-1/4"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                <Bell size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  {unreadCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {unreadCount} unread
                    </span>
                  ) : 'All caught up! ✓'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead as unknown as (fd: FormData) => void}>
                <button type="submit" className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl transition border border-white/20">
                  Mark all read
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                <Megaphone size={15} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Platform Announcements</h2>
                <p className="text-xs text-gray-400">{announcements.length} active</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 px-4 py-3 space-y-2">
              {announcements.map((a) => {
                const style = priorityStyles[a.priority] ?? { card: 'bg-gray-50 border border-gray-200', dot: 'bg-gray-400' }
                return (
                  <div key={a.id} className={`rounded-2xl p-4 ${style.card}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${style.dot}`} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notifications list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <Bell size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Activity</h2>
              <p className="text-xs text-gray-400">{allNotifs.length} notifications</p>
            </div>
          </div>

          {allNotifs.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <p className="font-bold text-gray-700">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete lessons and quizzes to earn notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allNotifs.map((n) => {
                const borderColor = NOTIF_BORDER[n.type] ?? 'border-l-gray-300'
                return (
                  <div key={n.id} className={`flex gap-3.5 px-5 py-4 transition border-l-4 ${borderColor} ${n.read ? 'bg-white' : 'bg-indigo-50/30'}`}>
                    <span className="text-xl flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                        {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
