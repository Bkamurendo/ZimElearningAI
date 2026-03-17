'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, Inbox, ArrowLeft, X, Loader2, RefreshCw, Search } from 'lucide-react'

type MessageRow = {
  id: string
  content: string
  read: boolean
  created_at: string
  subject_id: string | null
  sender: { full_name: string; role: string } | null
  recipient: { full_name: string; role: string } | null
  subject: { name: string; code: string } | null
}

type StudentRow = { id: string; full_name: string }

export default function TeacherMessagesPage() {
  const supabase = createClient()
  const [box, setBox] = useState<'inbox' | 'sent'>('inbox')
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MessageRow | null>(null)
  const [composing, setComposing] = useState(false)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ recipient_id: '', content: '' })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [inboxUnread, setInboxUnread] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?box=${box}`)
      const json = await res.json()
      const msgs: MessageRow[] = json.messages ?? []
      setMessages(msgs)
      if (box === 'inbox') setInboxUnread(msgs.filter(m => !m.read).length)
    } catch { /* ignore */ }
    setLoading(false)
  }, [box])

  useEffect(() => { load() }, [load])

  // Load students from teacher's assigned subjects
  useEffect(() => {
    async function loadStudents() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get teacher profile
      const { data: tp } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single() as { data: { id: string } | null; error: unknown }

      if (!tp) return

      // Get subject ids
      const { data: ts } = await supabase
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', tp.id) as { data: { subject_id: string }[] | null; error: unknown }

      const subjectIds = (ts ?? []).map(r => r.subject_id)
      if (subjectIds.length === 0) return

      // Get student profiles enrolled in those subjects
      const { data: enrolments } = await supabase
        .from('student_subjects')
        .select('student:student_profiles(user:profiles(id, full_name))')
        .in('subject_id', subjectIds)
        .limit(200) as { data: { student: { user: { id: string; full_name: string } | null } | null }[] | null; error: unknown }

      const seen = new Set<string>()
      const list: StudentRow[] = []
      for (const e of enrolments ?? []) {
        const u = e.student?.user
        if (u && !seen.has(u.id)) {
          seen.add(u.id)
          list.push({ id: u.id, full_name: u.full_name })
        }
      }
      list.sort((a, b) => a.full_name.localeCompare(b.full_name))
      setStudents(list)
    }
    loadStudents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/messages/${id}/read`, { method: 'PATCH' })
    setMessages(ms => ms.map(m => m.id === id ? { ...m, read: true } : m))
    setInboxUnread(prev => Math.max(0, prev - 1))
  }

  async function send() {
    if (!form.recipient_id) { setSendError('Please select a student'); return }
    if (!form.content.trim()) { setSendError('Please write a message'); return }
    setSending(true); setSendError('')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: form.recipient_id, content: form.content.trim() }),
    })
    const json = await res.json()
    if (!res.ok) { setSendError(json.error ?? 'Failed to send'); setSending(false); return }
    setComposing(false)
    setForm({ recipient_id: '', content: '' })
    setSearch('')
    setSending(false)
    if (box === 'sent') load()
  }

  function openMessage(msg: MessageRow) {
    setSelected(msg)
    if (box === 'inbox' && !msg.read) markRead(msg.id)
  }

  const filteredStudents = search.trim()
    ? students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))
    : students

  // ── Message detail view ──
  if (selected) {
    const other = box === 'inbox' ? selected.sender : selected.recipient
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft size={16} /> Back to {box === 'inbox' ? 'Inbox' : 'Sent'}
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-sm">
                    {(other?.full_name ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{other?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-400 capitalize">{other?.role}</p>
                </div>
              </div>
              {selected.subject && (
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  {selected.subject.name} ({selected.subject.code})
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                {new Date(selected.created_at).toLocaleString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main list view ──
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  {inboxUnread > 0 ? `${inboxUnread} unread` : 'Chat with your students'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setComposing(true); setSendError(''); setSearch('') }}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm flex-shrink-0"
            >
              <Send size={15} />
              New Message
            </button>
          </div>
        </div>

        {/* Compose modal */}
        {composing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">New Message</h2>
                <button
                  onClick={() => { setComposing(false); setSendError(''); setForm({ recipient_id: '', content: '' }); setSearch('') }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    To (Student)
                  </label>
                  {/* Search + select student */}
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <select
                    value={form.recipient_id}
                    onChange={e => setForm(f => ({ ...f, recipient_id: e.target.value }))}
                    size={Math.min(6, filteredStudents.length + 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">— Select a student —</option>
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  {students.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No students enrolled in your subjects yet.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Type your message here…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                {sendError && <p className="text-xs text-red-600 font-medium">{sendError}</p>}
                <button
                  onClick={send}
                  disabled={sending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs + message list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-0 px-4 pt-4 border-b border-gray-100">
            {([
              { key: 'inbox', label: 'Inbox', icon: Inbox },
              { key: 'sent',  label: 'Sent',  icon: Send  },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setBox(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition -mb-px border-b-2 ${
                  box === key
                    ? 'text-blue-700 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Icon size={15} />
                {label}
                {key === 'inbox' && inboxUnread > 0 && (
                  <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {inboxUnread > 99 ? '99+' : inboxUnread}
                  </span>
                )}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg transition mb-1 mr-1" title="Refresh">
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600">
                {box === 'inbox' ? 'No messages yet' : 'Nothing sent yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {box === 'inbox'
                  ? 'Messages from students will appear here'
                  : 'Messages you send to students will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {messages.map(msg => {
                const other = box === 'inbox' ? msg.sender : msg.recipient
                const isUnread = box === 'inbox' && !msg.read
                return (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`w-full text-left flex gap-3 px-5 py-4 hover:bg-gray-50/80 transition ${isUnread ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-600 font-bold text-xs">
                        {(other?.full_name ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {other?.full_name ?? 'Unknown'}
                        </p>
                        <p className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      {msg.subject && (
                        <p className="text-[11px] text-gray-400 mb-0.5">{msg.subject.name}</p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-1">{msg.content}</p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
