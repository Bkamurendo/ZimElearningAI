'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  subjectName: string
  subjectCode: string
  level: string
  initialMessages: Message[]
}

export default function AiTutorChat({
  subjectName,
  subjectCode,
  level,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const levelLabel =
    level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)

    // Save user message to DB
    fetch('/api/ai-tutor', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, subjectCode }),
    }).catch(() => {/* best-effort */})

    // Stream assistant response
    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          subjectName,
          subjectCode,
          level,
        }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ])
        setIsStreaming(false)
        return
      }

      // Add empty assistant placeholder
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

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
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + parsed.text }
                }
                return next
              })
            } else if (parsed.type === 'error') {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = {
                  role: 'assistant',
                  content: parsed.message ?? 'An error occurred.',
                }
                return next
              })
            }
          } catch {
            // skip unparsable lines
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your internet and try again.' },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, subjectCode, subjectName, level])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <Link
          href={`/student/subjects/${subjectCode}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{subjectName} AI Tutor</p>
            <p className="text-xs text-gray-400">ZIMSEC {levelLabel} · Powered by Claude</p>
          </div>
        </div>
        <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          Online
        </div>
      </header>

      {/* Messages */}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🎓</span>
            </div>
            <p className="font-semibold text-gray-700 text-base">
              Ask me anything about {subjectName}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              I&apos;m trained on the ZIMSEC curriculum and here to help you excel
            </p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {[
                'Explain a key concept',
                'How do I answer exam questions?',
                'What should I study first?',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition border border-indigo-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-tr-sm shadow-sm'
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
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={2}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none disabled:opacity-50 placeholder:text-gray-300 dark:placeholder:text-gray-500"
              placeholder={`Ask about ${subjectName}… (Enter to send)`}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition flex-shrink-0 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  )
}
