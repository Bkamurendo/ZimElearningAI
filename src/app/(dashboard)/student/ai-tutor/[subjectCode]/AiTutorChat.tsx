'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronLeft, Bot, Sparkles, User, Info } from 'lucide-react'

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
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const levelLabel =
    level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming || isThinking) return

    const userMessage: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsThinking(true)

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
        setIsThinking(false)
        return
      }

      setIsThinking(false)
      setIsStreaming(true)
      
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
      setIsThinking(false)
    }
  }, [input, isStreaming, isThinking, messages, subjectCode, subjectName, level])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Premium Chat Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0 z-10 sticky top-0">
        <Link
          href={`/student/subjects/${subjectCode}`}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Bot size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white text-sm truncate uppercase tracking-tight">{subjectName} AI Tutor</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
               <Sparkles size={10} className="text-indigo-400" />
               MaFundi Intelligence · {levelLabel}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active Engine
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full py-20 text-center"
            >
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <Bot size={48} className="text-indigo-500" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none">
                Awaiting your signal.
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3 max-w-xs mx-auto">
                Ask anything about {subjectName}. I am trained on the complete ZIMSEC curriculum.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-lg mx-auto">
                {[
                  'Summarize the core syllabus',
                  'Common exam pitfalls',
                  'Explain a difficult topic',
                  'Give me a quick quiz'
                ].map((s, idx) => (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-[10px] font-black uppercase tracking-widest p-5 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-3xl hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              key={i}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 text-[10px] font-black flex-shrink-0 mt-1 shadow-lg relative">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[70%] px-6 py-4 rounded-[2rem] shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-slate-900 border-slate-800 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-medium'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-1 shadow-lg">
                  <User size={16} />
                </div>
              )}
            </motion.div>
          ))}

          {(isThinking || (isStreaming && messages[messages.length-1]?.content === '')) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 text-[10px] font-black flex-shrink-0 mt-1 shadow-lg">
                AI
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-6 rounded-[2rem] rounded-tl-none shadow-sm space-y-3 min-w-0 max-w-[80vw]">
                <Skeleton className="h-4 w-[90%] rounded-full" />
                <Skeleton className="h-4 w-[75%] rounded-full" />
                <Skeleton className="h-4 w-[50%] rounded-full" />
                <div className="pt-2 flex items-center gap-2">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Modern Chat Input Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-8 sm:px-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-2 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all duration-500 group shadow-lg shadow-indigo-500/5">
            <div className="flex gap-3 items-end pr-2">
              <div className="p-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                 <Sparkles size={20} />
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || isThinking}
                rows={1}
                className="flex-1 px-1 py-4 bg-transparent text-base text-slate-900 dark:text-white outline-none resize-none disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold leading-tight"
                placeholder={`Type your ${subjectName} question…`}
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || isThinking}
                className="w-12 h-12 bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-400 disabled:opacity-20 disabled:cursor-not-allowed text-white dark:text-slate-900 rounded-[1.5rem] transition-all duration-300 flex items-center justify-center flex-shrink-0 shadow-xl"
              >
                {isStreaming || isThinking ? (
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} strokeWidth={3} className="-rotate-12 translate-x-0.5 -translate-y-0.5" />
                )}
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
             <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500">ENTER</kbd>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Send</span>
             </div>
             <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-6">
                <Info size={10} className="text-slate-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">MaFundi AI v2.1</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
