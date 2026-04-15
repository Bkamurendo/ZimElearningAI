'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_SUGGESTIONS = [
  'What plans are available?',
  'How do I pay with EcoCash?',
  'My AI tutor stopped working',
  'My payment is not reflecting',
]

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! 👋 I'm the ZimLearn support assistant. How can I help you today?\n\nFeel free to ask about plans, payments, or any platform issues.",
}

const SESSION_LIMIT = 15 // max messages per session

export default function SupportChat() {
  const [isOpen, setIsOpen]         = useState(false)
  const [messages, setMessages]     = useState<Message[]>([GREETING])
  const [input, setInput]           = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [hasUnread, setHasUnread]   = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isStreaming) return
    if (sessionCount >= SESSION_LIMIT) return

    const userMsg: Message = { role: 'user', content }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setIsStreaming(true)
    setSessionCount(n => n + 1)

    // Add empty assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again or call +263 785 170 918.' }
          return next
        })
        setIsStreaming(false)
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data) as { type: string; text?: string; message?: string }
            if (parsed.type === 'text' && parsed.text) {
              setMessages(prev => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + parsed.text }
                }
                return next
              })
            } else if (parsed.type === 'error') {
              setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = {
                  role: 'assistant',
                  content: parsed.message ?? 'An error occurred. Please try again.',
                }
                return next
              })
            }
          } catch { /* skip unparsable */ }
        }
      }

      // If widget is closed, mark as unread
      if (!isOpen) setHasUnread(true)
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, sessionCount, isOpen])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const atLimit = sessionCount >= SESSION_LIMIT

  return (
    <>
      {/* ── Floating chat panel ─────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] flex flex-col"
          style={{ maxHeight: 'min(520px, calc(100vh - 120px))', filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.18))' }}
        >
          <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">ZimLearn Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  <p className="text-emerald-100 text-xs">Online · Powered by AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white flex-shrink-0"
                aria-label="Close support chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && msg.content === '' && isStreaming && (
                      <span className="inline-flex gap-1 ml-1">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick suggestions — shown only after the greeting */}
              {messages.length === 1 && !isStreaming && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 hover:border-emerald-300 transition shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Session limit message */}
              {atLimit && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Session limit reached</p>
                  <p>For further assistance, contact us:</p>
                  <a href="tel:+263785170918" className="font-semibold text-emerald-700 mt-1 block">
                    📞 +263 785 170 918
                  </a>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Upgrade nudge (shown if user mentions billing keywords) */}
            <div className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-indigo-50 to-emerald-50 border-t border-gray-100 flex items-center justify-between gap-2">
              <p className="text-[10px] text-gray-400">Plans from $2/month</p>
              <Link
                href="/student/upgrade"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-0.5"
              >
                View plans →
              </Link>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 bg-white border-t border-gray-100">
              <div className={`flex gap-2 items-end bg-gray-50 border rounded-xl p-1.5 transition ${atLimit ? 'opacity-50 pointer-events-none' : 'border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent'}`}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming || atLimit}
                  rows={1}
                  className="flex-1 px-2 py-1.5 bg-transparent text-sm outline-none resize-none disabled:opacity-50 placeholder:text-gray-300"
                  placeholder="Ask anything… (Enter to send)"
                  style={{ maxHeight: '80px', overflowY: 'auto' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming || atLimit}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition flex-shrink-0"
                  aria-label="Send message"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ──────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        title="Support"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </>
        )}
      </button>
    </>
  )
}
