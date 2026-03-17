'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Loader2, Sparkles, RotateCcw, Zap, BookOpen,
  FileText, Book, HelpCircle, RefreshCw, CheckCircle,
  ChevronDown, ChevronRight, AlertCircle, Copy, Check,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type TabKey = 'chat' | 'snap_notes' | 'detailed_notes' | 'model_answers' | 'glossary' | 'practice_questions'

interface SnapNote { heading: string; emoji: string; points: string[] }
interface ModelAnswer {
  question_number: string; question_text: string; marks: number
  model_answer: string; working: string[]; examiner_notes: string; common_mistakes: string
}
interface GlossaryItem { term: string; definition: string; example: string; category: string }
interface PracticeQuestion {
  number: string; question: string; type: string; difficulty: string
  marks: number; hint: string; model_answer: string; working: string; examiner_tip: string
}

interface CachedContent {
  snap_notes?: SnapNote[]
  detailed_notes?: string
  model_answers?: ModelAnswer[]
  glossary?: GlossaryItem[]
  practice_questions?: PracticeQuestion[]
}

interface Props {
  documentId: string
  documentTitle: string
  documentType: string
  subjectCode: string
  quickPrompts: string[]
  preloaded?: CachedContent
}

// ── Tab config ────────────────────────────────────────────────────────────────

function getTabs(docType: string) {
  const base = [
    { key: 'chat'               as TabKey, label: 'AI Chat',       icon: Sparkles,  color: 'indigo' },
    { key: 'snap_notes'         as TabKey, label: 'Snap Notes',    icon: Zap,       color: 'amber'  },
    { key: 'detailed_notes'     as TabKey, label: 'Study Notes',   icon: BookOpen,  color: 'green'  },
    { key: 'glossary'           as TabKey, label: 'Glossary',      icon: Book,      color: 'purple' },
    { key: 'practice_questions' as TabKey, label: 'Practice',      icon: HelpCircle,color: 'blue'   },
  ]
  if (docType === 'past_paper' || docType === 'marking_scheme') {
    base.splice(2, 0, { key: 'model_answers' as TabKey, label: 'Model Answers', icon: FileText, color: 'rose' })
  }
  return base
}

const MODE_OPTIONS = [
  { value: 'explain',   label: '💡 Explain'  },
  { value: 'solve',     label: '🧮 Solve'    },
  { value: 'summarise', label: '📋 Summary'  },
  { value: 'examine',   label: '🎯 Exam Prep'},
]

// ── Helper: Markdown renderer ─────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2 pb-1 border-b border-gray-100">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-gray-800 mt-4 mb-1.5">{line.slice(4)}</h3>)
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} className="my-2 pl-3 border-l-4 border-amber-400 bg-amber-50 py-2 pr-3 rounded-r-lg">
          <p className="text-xs text-amber-800 leading-relaxed">{renderInline(line.slice(2))}</p>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(<li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-disc">{renderInline(line.slice(2))}</li>)
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      if (match) {
        elements.push(<li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-decimal">{renderInline(match[2])}</li>)
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="text-sm text-gray-700 leading-relaxed my-1">{renderInline(line)}</p>)
    }
    i++
  }
  return <div className="space-y-0.5">{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-gray-100 text-purple-700 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1.5 text-gray-300 hover:text-gray-500 transition flex-shrink-0" title="Copy">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  )
}

// ── Difficulty badge ──────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: string }) {
  const cfg = {
    easy:   { label: 'Easy',   color: 'bg-green-50 text-green-700 border-green-200' },
    medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    hard:   { label: 'Hard',   color: 'bg-red-50 text-red-700 border-red-200' },
  }[level] ?? { label: level, color: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudyPanel({
  documentId, documentTitle, documentType, quickPrompts, preloaded = {},
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('chat')
  const [cached, setCached] = useState<CachedContent>(preloaded)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]   = useState('')
  const [streaming, setStreaming] = useState(false)
  const [mode, setMode]     = useState(documentType === 'past_paper' ? 'solve' : 'explain')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const tabs = getTabs(documentType)

  // ── Generate content (with timeout + auto-retry) ──────────────────────────

  async function generateContent(contentType: string, forceRegenerate = false, attempt = 1) {
    setLoading((p) => ({ ...p, [contentType]: true }))
    setErrors((p) => ({ ...p, [contentType]: '' }))

    const MAX_ATTEMPTS = 3
    const TIMEOUT_MS  = 100_000 // 100s — matches server maxDuration

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

      let res: Response
      try {
        res = await fetch(`/api/documents/study-content/${documentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: contentType, force_regenerate: forceRegenerate }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      const data = await res.json()

      if (!res.ok) {
        // Server-side error — retry if transient (502/503/504) and attempts remain
        const isTransient = [502, 503, 504].includes(res.status)
        if (isTransient && attempt < MAX_ATTEMPTS) {
          const delay = attempt * 3000
          await new Promise((r) => setTimeout(r, delay))
          return generateContent(contentType, forceRegenerate, attempt + 1)
        }
        setErrors((p) => ({ ...p, [contentType]: data.error ?? 'Generation failed' }))
        return
      }

      // Parse JSON content for structured types
      const jsonTypes = ['snap_notes', 'model_answers', 'glossary', 'practice_questions']
      if (jsonTypes.includes(contentType)) {
        try {
          const parsed = JSON.parse(data.content)
          setCached((p) => ({ ...p, [contentType]: parsed }))
        } catch {
          setErrors((p) => ({ ...p, [contentType]: 'Content format error — please regenerate' }))
        }
      } else {
        setCached((p) => ({ ...p, [contentType]: data.content }))
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError'

      // Auto-retry on timeout or network blip
      if (attempt < MAX_ATTEMPTS) {
        const delay = attempt * 3000
        await new Promise((r) => setTimeout(r, delay))
        return generateContent(contentType, forceRegenerate, attempt + 1)
      }

      const msg = isAbort
        ? 'Request timed out — Claude is busy. Try again in a moment.'
        : 'Network error — please try again'
      setErrors((p) => ({ ...p, [contentType]: msg }))
    } finally {
      setLoading((p) => ({ ...p, [contentType]: false }))
    }
  }

  // Auto-generate when switching to a tab that has no content
  useEffect(() => {
    if (activeTab === 'chat') return
    const key = activeTab as keyof CachedContent
    if (!cached[key] && !loading[activeTab] && !errors[activeTab]) {
      generateContent(activeTab)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ── Chat ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return
    const updated = [...messages, { role: 'user' as const, content: msg }]
    setMessages(updated)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/documents/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, question: msg, mode, conversationHistory: messages.slice(-10) }),
      })
      if (!res.ok || !res.body) {
        setMessages((p) => [...p, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
        return
      }
      setMessages((p) => [...p, { role: 'assistant', content: '' }])
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
          const d = line.slice(6)
          if (d === '[DONE]') break
          try {
            const p = JSON.parse(d)
            if (p.type === 'text' && p.text) {
              setMessages((prev) => {
                const n = [...prev]
                const last = n[n.length - 1]
                if (last?.role === 'assistant') n[n.length - 1] = { ...last, content: last.content + p.text }
                return n
              })
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, messages, documentId, mode])

  // ── Render tab content ────────────────────────────────────────────────────

  function renderTabContent() {
    if (activeTab === 'chat') return renderChat()

    const key = activeTab as keyof CachedContent
    const isLoading = loading[activeTab]
    const error = errors[activeTab]
    const content = cached[key]

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center animate-pulse">
            <Sparkles size={24} className="text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800 text-sm">Generating content…</p>
            <p className="text-xs text-gray-400 mt-1">Claude is reading and analysing the document</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Generation failed</p>
          <p className="text-xs text-red-500 mb-4">{error}</p>
          <button
            onClick={() => generateContent(activeTab, true)}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition"
          >
            Try Again
          </button>
        </div>
      )
    }

    if (!content) return null

    if (activeTab === 'snap_notes') return renderSnapNotes(content as SnapNote[])
    if (activeTab === 'detailed_notes') return renderDetailedNotes(content as string)
    if (activeTab === 'model_answers') return renderModelAnswers(content as ModelAnswer[])
    if (activeTab === 'glossary') return renderGlossary(content as GlossaryItem[])
    if (activeTab === 'practice_questions') return renderPracticeQuestions(content as PracticeQuestion[])
    return null
  }

  // ── Snap Notes renderer ───────────────────────────────────────────────────

  function renderSnapNotes(notes: SnapNote[]) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">⚡ Snap Notes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Quick-revision bullet points — perfect 24h before exams</p>
          </div>
          <button onClick={() => generateContent('snap_notes', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
            <RefreshCw size={14} />
          </button>
        </div>
        {notes.map((section, i) => (
          <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.emoji}</span>
              <h4 className="font-bold text-amber-900 text-sm">{section.heading}</h4>
            </div>
            <ul className="space-y-2">
              {section.points.map((pt, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>
                  <span className="text-xs text-amber-800 leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  // ── Detailed Notes renderer ───────────────────────────────────────────────

  function renderDetailedNotes(notes: string) {
    return (
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">📖 Study Notes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Comprehensive notes for deep understanding</p>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton text={notes} />
            <button onClick={() => generateContent('detailed_notes', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none">
          {renderMarkdown(notes)}
        </div>
      </div>
    )
  }

  // ── Model Answers renderer ────────────────────────────────────────────────

  function renderModelAnswers(answers: ModelAnswer[]) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">✍️ Model Answers</h3>
            <p className="text-xs text-gray-400 mt-0.5">Full step-by-step solutions with examiner notes</p>
          </div>
          <button onClick={() => generateContent('model_answers', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
            <RefreshCw size={14} />
          </button>
        </div>
        {answers.map((ans, i) => (
          <ModelAnswerCard key={i} answer={ans} />
        ))}
      </div>
    )
  }

  // ── Glossary renderer ─────────────────────────────────────────────────────

  function renderGlossary(items: GlossaryItem[]) {
    const categories = Array.from(new Set(items.map((i) => i.category))).sort()
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">📚 Glossary</h3>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} key terms, formulas &amp; concepts</p>
          </div>
          <button onClick={() => generateContent('glossary', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
            <RefreshCw size={14} />
          </button>
        </div>
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
            <div className="space-y-2">
              {items.filter((i) => i.category === cat).map((item, j) => (
                <div key={j} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-purple-900 text-sm">{item.term}</p>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 leading-relaxed">{item.definition}</p>
                  {item.example && (
                    <p className="text-xs text-purple-600 mt-1.5 italic bg-white/50 rounded-lg px-2 py-1">
                      📌 {item.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Practice Questions renderer ───────────────────────────────────────────

  function renderPracticeQuestions(questions: PracticeQuestion[]) {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">🎯 Practice Questions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{questions.length} ZIMSEC-style questions with full solutions</p>
          </div>
          <button onClick={() => generateContent('practice_questions', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
            <RefreshCw size={14} />
          </button>
        </div>
        {questions.map((q, i) => (
          <PracticeQuestionCard key={i} question={q} />
        ))}
      </div>
    )
  }

  // ── AI Chat renderer ──────────────────────────────────────────────────────

  function renderChat() {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Mode selector */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                  mode === m.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ minHeight: '300px' }}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Ask anything about this document</p>
                <p className="text-xs text-gray-400">Or tap a quick action below</p>
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
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                    <Sparkles size={12} />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                  {msg.role === 'assistant' && msg.content === '' && streaming && (
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

        {/* Input */}
        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setInput('') }} className="mb-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
              <RotateCcw size={11} /> Clear chat
            </button>
          )}
          <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              disabled={streaming}
              rows={2}
              className="flex-1 px-3 py-2 bg-transparent text-sm outline-none resize-none disabled:opacity-50 placeholder:text-gray-400"
              placeholder="Ask a question about this document…"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition flex-shrink-0 shadow-sm"
            >
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">Grounded in the actual document content</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabColorMap: Record<string, string> = {
    chat: 'bg-indigo-600 text-white',
    snap_notes: 'bg-amber-500 text-white',
    detailed_notes: 'bg-green-600 text-white',
    model_answers: 'bg-rose-600 text-white',
    glossary: 'bg-purple-600 text-white',
    practice_questions: 'bg-blue-600 text-white',
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '700px' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
        <div className={`w-9 h-9 ${tabColorMap[activeTab]} rounded-xl flex items-center justify-center shadow-sm transition-colors`}>
          {(() => {
            const tab = tabs.find((t) => t.key === activeTab)
            if (!tab) return <Sparkles size={16} className="text-white" />
            const Icon = tab.icon
            return <Icon size={16} className="text-white" />
          })()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {tabs.find((t) => t.key === activeTab)?.label ?? 'Study Tools'}
          </p>
          <p className="text-xs text-indigo-600 truncate max-w-[220px]">
            {documentTitle.length > 40 ? documentTitle.slice(0, 40) + '…' : documentTitle}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            const isLoaded = tab.key === 'chat' || !!cached[tab.key as keyof CachedContent]
            const isGenerating = loading[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                  active
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                }`}
              >
                {isGenerating ? (
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                ) : isLoaded ? (
                  <CheckCircle size={12} className={active ? 'text-indigo-500' : 'text-green-400'} />
                ) : (
                  <Icon size={12} />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

    </div>
  )
}

// ── Model Answer Card ─────────────────────────────────────────────────────────

function ModelAnswerCard({ answer }: { answer: ModelAnswer }) {
  const [showWorking, setShowWorking] = useState(false)
  const [showNotes, setShowNotes]   = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Question header */}
      <div className="bg-rose-50 px-4 py-3 border-b border-rose-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Q{answer.question_number}</span>
            {answer.marks > 0 && (
              <span className="text-xs text-rose-700 font-semibold bg-white border border-rose-200 px-2 py-0.5 rounded-full">{answer.marks} marks</span>
            )}
          </div>
          <CopyButton text={`Q${answer.question_number}: ${answer.question_text}\n\nAnswer: ${answer.model_answer}\n\nWorking:\n${answer.working?.join('\n')}`} />
        </div>
        <p className="text-sm text-gray-800 mt-2 leading-relaxed font-medium">{answer.question_text}</p>
      </div>

      {/* Model answer */}
      <div className="px-4 py-3 bg-green-50 border-b border-green-100">
        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">✅ Model Answer</p>
        <p className="text-sm text-gray-800 leading-relaxed">{answer.model_answer}</p>
      </div>

      {/* Step-by-step working */}
      {answer.working && answer.working.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowWorking((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
          >
            <span className="flex items-center gap-1.5"><ChevronRight size={13} className={`transition-transform ${showWorking ? 'rotate-90' : ''}`} />🧮 Step-by-Step Working</span>
            <span className="text-gray-400 font-normal">{answer.working.length} steps</span>
          </button>
          {showWorking && (
            <div className="px-4 pb-4 space-y-2">
              {answer.working.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Examiner notes */}
      {(answer.examiner_notes || answer.common_mistakes) && (
        <div>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
          >
            <span className="flex items-center gap-1.5"><ChevronDown size={13} className={`transition-transform ${showNotes ? 'rotate-180' : ''}`} />📋 Examiner Notes</span>
          </button>
          {showNotes && (
            <div className="px-4 pb-4 space-y-2">
              {answer.examiner_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">How marks are awarded</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{answer.examiner_notes}</p>
                </div>
              )}
              {answer.common_mistakes && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-red-600 uppercase mb-1">⚠️ Common Mistakes</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{answer.common_mistakes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Practice Question Card ────────────────────────────────────────────────────

function PracticeQuestionCard({ question }: { question: PracticeQuestion }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showWorking, setShowWorking] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Question */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Q{question.number}</span>
            <DifficultyBadge level={question.difficulty} />
            <span className="text-xs text-gray-400">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <p className="text-sm text-gray-900 leading-relaxed font-medium">{question.question}</p>
        {question.hint && (
          <p className="text-xs text-blue-600 mt-1.5 italic">💡 Hint: {question.hint}</p>
        )}
      </div>

      {/* Reveal answer */}
      <button
        onClick={() => setShowAnswer((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold transition ${
          showAnswer ? 'bg-green-50 text-green-700 border-t border-green-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        {showAnswer ? <><CheckCircle size={13} /> Hide Answer</> : <>👁 Reveal Model Answer</>}
      </button>

      {showAnswer && (
        <div className="border-t border-green-100">
          <div className="px-4 py-3 bg-green-50">
            <p className="text-[10px] font-bold text-green-700 uppercase mb-1.5">Model Answer</p>
            <p className="text-sm text-gray-800 leading-relaxed">{question.model_answer}</p>
          </div>

          {question.working && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowWorking((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                <span className="flex items-center gap-1.5"><ChevronRight size={12} className={`transition-transform ${showWorking ? 'rotate-90' : ''}`} />Full Working</span>
              </button>
              {showWorking && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{question.working}</p>
                </div>
              )}
            </div>
          )}

          {question.examiner_tip && (
            <div className="px-4 pb-3 pt-1">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <p className="text-xs text-amber-800">📌 {question.examiner_tip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
