'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, Loader2, User } from 'lucide-react'

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
}

type TeacherProfile = {
  full_name: string
  email: string
}

export default function MessageThreadPage() {
  const params = useParams()
  const router = useRouter()
  const teacherId = params.teacherId as string

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const supabase = createClient()

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Mark messages from teacher as read
  const markRead = useCallback(async (userId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', teacherId)
      .eq('recipient_id', userId)
      .eq('read', false)
  }, [supabase, teacherId])

  // Fetch initial data
  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Fetch teacher profile
      const { data: tp } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', teacherId)
        .single()
      setTeacher(tp as TeacherProfile | null)

      // Fetch thread messages
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, read, created_at')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${teacherId}),and(sender_id.eq.${teacherId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (msgsErr) {
        setError('Could not load messages.')
      } else {
        setMessages((msgs as Message[]) ?? [])
        await markRead(user.id)
      }

      setLoading(false)
    }

    load()
  }, [teacherId, router, supabase, markRead])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom(loading ? 'instant' : 'smooth')
  }, [messages, loading, scrollToBottom])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`messages:thread:${currentUserId}:${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id !== teacherId) return
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          await markRead(currentUserId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.recipient_id !== teacherId) return
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, teacherId, supabase, markRead])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || !currentUserId || sending) return

    setSending(true)
    setInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: teacherId, content }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Failed to send message.')
        setInput(content) // restore
      }
      // The realtime subscription will add the message to state
    } catch {
      setError('Network error. Please try again.')
      setInput(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/parent/messages"
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">
              {loading ? 'Loading...' : (teacher?.full_name ?? 'Teacher')}
            </p>
            {teacher?.email && (
              <p className="text-xs text-gray-400 truncate">{teacher.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-purple-400" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-purple-300" />
              </div>
              <p className="font-semibold text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Send a message to {teacher?.full_name ?? 'this teacher'} below.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUserId
                const prevMsg = messages[i - 1]
                const showDate = !prevMsg ||
                  new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <p className="text-xs text-gray-400 font-medium px-2">
                          {new Date(msg.created_at).toLocaleDateString('en-GB', {
                            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}

                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-emerald-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className={`text-[10px] px-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                          {isMe && (
                            <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition max-h-32 overflow-y-auto"
              style={{ minHeight: '46px' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-11 h-11 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending
                ? <Loader2 size={18} className="animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Messages are delivered directly to the teacher&apos;s inbox
          </p>
        </div>
      </div>
    </div>
  )
}
