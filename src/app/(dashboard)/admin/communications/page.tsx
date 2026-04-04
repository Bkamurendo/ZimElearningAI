import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, MessageSquare, Users, Send, ArrowLeft, Plus, Edit, Trash2, Eye, Clock } from 'lucide-react'

export const metadata = { title: 'Communications — Admin' }

export default async function AdminCommunicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Fetch communications data
  const [
    { data: announcements },
    { data: supportTickets },
    { data: campaigns },
    { data: notifications },
  ] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('communication_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('push_notifications').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const activeAnnouncements = announcements?.filter(a => a.is_active) || []
  const openTickets = supportTickets?.filter(t => t.status === 'open') || []
  const totalSent = notifications?.length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Communications Hub</h1>
              <p className="text-indigo-200 text-sm">Manage announcements, support, and user communications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Communication Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Megaphone size={20} className="text-indigo-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeAnnouncements.length}</p>
            <p className="text-sm text-gray-500 mt-1">Active Announcements</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-amber-600" />
              </div>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Open
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{openTickets.length}</p>
            <p className="text-sm text-gray-500 mt-1">Support Tickets</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Send size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{campaigns?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Campaigns</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Eye size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
            <p className="text-sm text-gray-500 mt-1">Notifications Sent</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/announcements/new" className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition">
              <Plus size={20} className="text-indigo-600" />
              <div>
                <p className="font-medium text-indigo-900">New Announcement</p>
                <p className="text-sm text-indigo-600">Create platform-wide announcement</p>
              </div>
            </Link>
            
            <Link href="/admin/notifications/send" className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition">
              <Send size={20} className="text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Send Notification</p>
                <p className="text-sm text-purple-600">Bulk push to users</p>
              </div>
            </Link>
            
            <Link href="/admin/support" className="flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition">
              <MessageSquare size={20} className="text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">View Support</p>
                <p className="text-sm text-amber-600">Manage user tickets</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Announcements</h2>
            <Link href="/admin/announcements" className="text-sm text-indigo-600 hover:text-indigo-700 transition">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {announcements?.slice(0, 3).map(announcement => (
              <div key={announcement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    {announcement.is_active && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {(!announcements || announcements.length === 0) && (
              <p className="text-center text-gray-400 py-8">No announcements yet</p>
            )}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Support Tickets</h2>
            <Link href="/admin/support" className="text-sm text-amber-600 hover:text-amber-700 transition">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {supportTickets?.slice(0, 5).map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.status === 'open' ? 'bg-amber-50 text-amber-600' :
                      ticket.status === 'resolved' ? 'bg-green-50 text-green-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{ticket.user_email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="px-3 py-1 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition">
                  View
                </button>
              </div>
            ))}
            {(!supportTickets || supportTickets.length === 0) && (
              <p className="text-center text-gray-400 py-8">No support tickets</p>
            )}
          </div>
        </div>

        {/* Communication Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Communication Campaigns</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
              <Plus size={16} />
              New Campaign
            </button>
          </div>
          <div className="space-y-3">
            {campaigns?.slice(0, 3).map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{campaign.name}</h3>
                  <p className="text-sm text-gray-600">{campaign.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Sent: {campaign.sent_count || 0}</span>
                    <span>Opened: {campaign.opened_count || 0}</span>
                    <span>Clicked: {campaign.clicked_count || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {Math.round(((campaign.opened_count || 0) / (campaign.sent_count || 1)) * 100)}% open rate
                  </p>
                </div>
              </div>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <p className="text-center text-gray-400 py-8">No campaigns yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
