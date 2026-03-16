'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  documentId: string
  documentTitle: string
  documentType: string
  subjectCode: string
  quickPrompts: string[]
}

const MODE_OPTIONS = [
  { value: 'explain',   label: '💡 Explain',     desc: 'Concept explanations & teaching' },
  { value: 'solve',     label: '🧮 Solve',        desc: 'Step-by-step working' },
  { value: 'summarise', label: '📋 Summarise',    desc: 'Condensed key points' },
  { value: 'examine',   label: '🎯 Exam Prep',    desc: 'Likely exam questions & tips' },
]

export default function DocumentViewerClient({
  documentId,
  documentTitle,
  documentType,
  quickPrompts,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<string>(documentType === 'past_paper' ? 'solve' : 'explain')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText || isStreaming) return

    const userMessage: Message = { role: 'user', content: messageText }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/documents/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          question: messageText,
          mode,
          conversationHistory: messages.slice(-10), // last 5 turns
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
                if (last?.role === 'assistant') {
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
            // skip unparsable
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
  }, [input, isStreaming, messages, documentId, mode])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleClear() {
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '700px' }}>
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Ask AI about this document</p>
            <p className="text-xs text-indigo-600">Grounded in: {documentTitle.length > 35 ? documentTitle.slice(0, 35) + '…' : documentTitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-white/80 transition text-gray-400 hover:text-gray-600"
            title="Clear chat"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Mode selector */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                mode === m.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ minHeight: '350px' }}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Quick actions</p>
              <p className="text-xs text-gray-400">
                Select a mode above, then tap a prompt or type your own question
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 transition font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles size={12} />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && msg.content === '' && isStreaming && (
                  <span className="inline-flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={2}
            className="flex-1 px-3 py-2 bg-transparent text-sm outline-none resize-none disabled:opacity-50 placeholder:text-gray-400"
            placeholder={`Ask about ${documentTitle.length > 25 ? documentTitle.slice(0, 25) + '…' : documentTitle}…`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition flex-shrink-0 shadow-sm"
          >
            {isStreaming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          AI responses are grounded in the actual document content
        </p>
      </div>
    </div>
  )
}
