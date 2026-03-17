'use client'

import { useState, useEffect } from 'react'
import {
  Loader2, Sparkles, RefreshCw, AlertCircle, Copy, Check,
  BookOpen, Zap, HelpCircle, Book, GraduationCap, ChevronDown, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'teaching_guide' | 'snap_notes' | 'glossary' | 'practice_questions'

interface SnapNote { heading: string; emoji: string; points: string[] }
interface GlossaryItem { term: string; definition: string; example: string; category: string }
interface PracticeQuestion {
  number: string; question: string; type: string; difficulty: string
  marks: number; hint: string; model_answer: string; working: string; examiner_tip: string
}

interface CachedContent {
  teaching_guide?: string
  snap_notes?: SnapNote[]
  glossary?: GlossaryItem[]
  practice_questions?: PracticeQuestion[]
}

interface Props {
  documentId: string
  documentTitle: string
  documentType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preloaded?: Record<string, any>
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string; color: string; bg: string }[] = [
  { key: 'teaching_guide',     label: 'Teaching Guide',      icon: GraduationCap, desc: 'Full lesson plan with objectives, activities & assessment',  color: 'text-blue-700',   bg: 'bg-blue-600'   },
  { key: 'snap_notes',         label: 'Snap Notes',          icon: Zap,           desc: 'Quick-revision bullet points for classroom display',           color: 'text-amber-700',  bg: 'bg-amber-500'  },
  { key: 'glossary',           label: 'Glossary',            icon: Book,          desc: 'Key terms & definitions for handouts',                        color: 'text-purple-700', bg: 'bg-purple-600' },
  { key: 'practice_questions', label: 'Practice Questions',  icon: HelpCircle,    desc: 'ZIMSEC-style classwork & homework questions',                  color: 'text-green-700',  bg: 'bg-green-600'  },
]

// ── Helper: Markdown renderer ─────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2 pb-1 border-b-2 border-blue-100">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-blue-800 mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} className="my-2 pl-3 border-l-4 border-amber-400 bg-amber-50 py-2 pr-3 rounded-r-lg">
          <p className="text-xs text-amber-800 leading-relaxed">{renderInline(line.slice(2))}</p>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={i} className="text-sm text-gray-700 leading-relaxed ml-5 list-disc">
          {renderInline(line.slice(2))}
        </li>
      )
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      if (match) {
        elements.push(
          <li key={i} className="text-sm text-gray-700 leading-relaxed ml-5 list-decimal">
            {renderInline(match[2])}
          </li>
        )
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed my-1">
          {renderInline(line)}
        </p>
      )
    }
  })

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

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

// ── Difficulty badge ──────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: string }) {
  const cfg = {
    easy:   { label: 'Easy',   cls: 'bg-green-50 text-green-700 border-green-200' },
    medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    hard:   { label: 'Hard',   cls: 'bg-red-50 text-red-700 border-red-200' },
  }[level] ?? { label: level, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TeacherMaterialsClient({ documentId, documentTitle, preloaded = {} }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('teaching_guide')
  const [cached, setCached] = useState<CachedContent>(preloaded as CachedContent)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})

  // ── Generate content ──────────────────────────────────────────────────────

  async function generateContent(contentType: TabKey, forceRegenerate = false) {
    setLoading((p) => ({ ...p, [contentType]: true }))
    setErrors((p) => ({ ...p, [contentType]: '' }))

    try {
      const res = await fetch(`/api/documents/study-content/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, force_regenerate: forceRegenerate }),
      })
      const data = await res.json() as { content?: string; error?: string }

      if (!res.ok) {
        setErrors((p) => ({ ...p, [contentType]: data.error ?? 'Generation failed' }))
        return
      }

      const jsonTypes: TabKey[] = ['snap_notes', 'glossary', 'practice_questions']
      if (jsonTypes.includes(contentType)) {
        try {
          const parsed = JSON.parse(data.content ?? '[]')
          setCached((p) => ({ ...p, [contentType]: parsed }))
        } catch {
          setErrors((p) => ({ ...p, [contentType]: 'Content format error — please regenerate' }))
        }
      } else {
        setCached((p) => ({ ...p, [contentType]: data.content }))
      }
    } catch {
      setErrors((p) => ({ ...p, [contentType]: 'Network error — please try again' }))
    } finally {
      setLoading((p) => ({ ...p, [contentType]: false }))
    }
  }

  // Auto-generate when switching to an empty tab
  useEffect(() => {
    const key = activeTab as keyof CachedContent
    if (!cached[key] && !loading[activeTab] && !errors[activeTab]) {
      generateContent(activeTab)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderLoading() {
    const tab = TABS.find((t) => t.key === activeTab)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className={`w-16 h-16 ${TABS.find(t => t.key === activeTab)?.bg ?? 'bg-blue-600'} rounded-2xl flex items-center justify-center animate-pulse shadow-lg`}>
          <Sparkles size={28} className="text-white" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800">Generating {tab?.label}…</p>
          <p className="text-sm text-gray-400 mt-1">Claude AI is analysing the document</p>
          <p className="text-xs text-gray-300 mt-0.5">This may take 20–40 seconds</p>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  function renderError(contentType: TabKey) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="font-semibold text-gray-800 mb-1">Generation failed</p>
        <p className="text-sm text-red-500 mb-5">{errors[contentType]}</p>
        <button
          onClick={() => generateContent(contentType, true)}
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ── Teaching Guide ────────────────────────────────────────────────────────

  function renderTeachingGuide(content: string) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">🎓 Teaching Guide</h3>
            <p className="text-xs text-gray-400 mt-0.5">Full lesson plan — ready to use in class</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={content} label="Copy All" />
            <button
              onClick={() => generateContent('teaching_guide', true)}
              title="Regenerate"
              className="p-1.5 text-gray-300 hover:text-gray-500 transition"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Print hint */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 text-xs text-blue-700">
          <BookOpen size={14} className="flex-shrink-0" />
          <span>Tip: Use your browser&apos;s print function (Ctrl+P / Cmd+P) to save this as a PDF for class.</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          {renderMarkdown(content)}
        </div>
      </div>
    )
  }

  // ── Snap Notes ────────────────────────────────────────────────────────────

  function renderSnapNotes(notes: SnapNote[]) {
    const allText = notes.map(s => `${s.heading}\n${s.points.map(p => `• ${p}`).join('\n')}`).join('\n\n')
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">⚡ Snap Notes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Quick-revision cards — print or display in class</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={allText} label="Copy All" />
            <button onClick={() => generateContent('snap_notes', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((section, i) => (
            <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{section.emoji}</span>
                <h4 className="font-bold text-amber-900 text-sm leading-tight">{section.heading}</h4>
              </div>
              <ul className="space-y-2">
                {section.points.map((pt, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0 font-bold">▸</span>
                    <span className="text-xs text-amber-800 leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Glossary ──────────────────────────────────────────────────────────────

  function renderGlossary(items: GlossaryItem[]) {
    const categories = Array.from(new Set(items.map((i) => i.category))).sort()
    const allText = items.map(i => `${i.term} (${i.category})\n${i.definition}${i.example ? `\nExample: ${i.example}` : ''}`).join('\n\n')
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">📚 Glossary</h3>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} terms — ideal for handouts &amp; word walls</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={allText} label="Copy All" />
            <button onClick={() => generateContent('glossary', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item, j) => (
                  <div key={j} className="bg-white border border-purple-100 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-purple-900 text-sm">{item.term}</p>
                      <span className="text-[10px] text-purple-400 font-medium bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex-shrink-0">{cat}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item.definition}</p>
                    {item.example && (
                      <p className="text-xs text-purple-600 mt-1.5 italic bg-purple-50/50 rounded-lg px-2 py-1">
                        📌 {item.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Practice Questions ────────────────────────────────────────────────────

  function renderPracticeQuestions(questions: PracticeQuestion[]) {
    const allText = questions.map(q =>
      `Q${q.number} [${q.difficulty} · ${q.marks}m]\n${q.question}\n\nAnswer: ${q.model_answer}${q.working ? `\nWorking: ${q.working}` : ''}`
    ).join('\n\n---\n\n')

    const easy   = questions.filter(q => q.difficulty === 'easy')
    const medium = questions.filter(q => q.difficulty === 'medium')
    const hard   = questions.filter(q => q.difficulty === 'hard')

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">🎯 Practice Questions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{questions.length} questions — use as classwork or homework</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={allText} label="Copy All" />
            <button onClick={() => generateContent('practice_questions', true)} title="Regenerate" className="p-1.5 text-gray-300 hover:text-gray-500 transition">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Difficulty summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Easy', count: easy.length, cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Medium', count: medium.length, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Hard', count: hard.length, cls: 'bg-red-50 border-red-200 text-red-700' },
          ].map(({ label, count, cls }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <TeacherQuestionCard key={i} question={q} />
          ))}
        </div>
      </div>
    )
  }

  // ── Tab content router ────────────────────────────────────────────────────

  function renderTabContent() {
    const isLoading = loading[activeTab]
    const error = errors[activeTab]
    const content = cached[activeTab as keyof CachedContent]

    if (isLoading) return renderLoading()
    if (error) return renderError(activeTab)
    if (!content) return null

    if (activeTab === 'teaching_guide') return renderTeachingGuide(content as string)
    if (activeTab === 'snap_notes')     return renderSnapNotes(content as SnapNote[])
    if (activeTab === 'glossary')       return renderGlossary(content as GlossaryItem[])
    if (activeTab === 'practice_questions') return renderPracticeQuestions(content as PracticeQuestion[])
    return null
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '700px' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className={`w-10 h-10 ${TABS.find(t => t.key === activeTab)?.bg ?? 'bg-blue-600'} rounded-xl flex items-center justify-center shadow-sm transition-all`}>
          {(() => {
            const tab = TABS.find(t => t.key === activeTab)
            if (!tab) return <GraduationCap size={18} className="text-white" />
            const Icon = tab.icon
            return <Icon size={18} className="text-white" />
          })()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">
            {TABS.find(t => t.key === activeTab)?.label ?? 'Teacher Materials'}
          </p>
          <p className="text-xs text-blue-600 truncate max-w-[260px]">
            {documentTitle.length > 45 ? documentTitle.slice(0, 45) + '…' : documentTitle}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const active = activeTab === tab.key
            const isLoaded = !!cached[tab.key as keyof CachedContent]
            const isGenerating = loading[tab.key]
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.desc}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                  active
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'
                }`}
              >
                {isGenerating ? (
                  <Loader2 size={13} className="animate-spin text-blue-400" />
                ) : isLoaded ? (
                  <span className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <Icon size={13} />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tip banner */}
      {!loading[activeTab] && !cached[activeTab as keyof CachedContent] && !errors[activeTab] && (
        <div className="mx-5 mt-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3 flex-shrink-0">
          <Sparkles size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Generating {TABS.find(t => t.key === activeTab)?.label}…</strong>{' '}
            Claude AI is reading the full document. This only takes 20–40 seconds and results are saved so you won&apos;t need to wait again.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

// ── Teacher Question Card ─────────────────────────────────────────────────────

function TeacherQuestionCard({ question }: { question: PracticeQuestion }) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Question */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">Q{question.number}</span>
          <DifficultyBadge level={question.difficulty} />
          <span className="text-xs text-gray-400">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
          {question.type && (
            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full capitalize">
              {question.type.replace('_', ' ')}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-900 leading-relaxed font-medium">{question.question}</p>
        {question.hint && (
          <p className="text-xs text-green-600 mt-1.5 italic">💡 Topic: {question.hint}</p>
        )}
      </div>

      {/* Reveal answer */}
      <button
        onClick={() => setShowAnswer((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border-t transition ${
          showAnswer
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 border-gray-100'
        }`}
      >
        {showAnswer ? (
          <><ChevronDown size={13} /> Hide Model Answer</>
        ) : (
          <><ChevronRight size={13} /> Show Model Answer &amp; Working</>
        )}
      </button>

      {showAnswer && (
        <div className="border-t border-green-100">
          {/* Answer */}
          <div className="px-4 py-3 bg-green-50">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">✅ Model Answer</p>
            <p className="text-sm text-gray-800 leading-relaxed">{question.model_answer}</p>
          </div>

          {/* Working */}
          {question.working && (
            <div className="px-4 py-3 border-t border-green-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1.5">🧮 Working</p>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{question.working}</p>
            </div>
          )}

          {/* Examiner tip */}
          {question.examiner_tip && (
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">📋 Teaching Note</p>
                <p className="text-xs text-amber-800 leading-relaxed">{question.examiner_tip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
