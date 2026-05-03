'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calculator, BookOpen,
  Send, Loader2, Sparkles, ChevronDown, RotateCcw,
  Lightbulb, ClipboardCheck,
} from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  zimsec_level: string
}

interface PublishedDoc {
  id: string
  title: string
  document_type: string
  year: number | null
  paper_number: number | null
  subject_id: string | null
}

interface Props {
  subjects: Subject[]
  initialSubjectCode: string
  publishedDocuments: PublishedDoc[]
}

type SolveMode = 'step_by_step' | 'essay' | 'explain' | 'mark_answer'

const MODES: { value: SolveMode; label: string; icon: React.ReactNode; desc: string; placeholder: string }[] = [
  {
    value: 'step_by_step',
    label: 'Step-by-Step',
    icon: <Calculator size={16} />,
    desc: 'Full working with numbered steps and mark allocation',
    placeholder: 'Paste your question or problem here…\n\nExample: "Solve 3x² - 5x + 2 = 0" or "A particle moves with acceleration 4 m/s². Find its velocity after 6 seconds if initial velocity is 2 m/s."',
  },
  {
    value: 'essay',
    label: 'Essay / Structured',
    icon: <BookOpen size={16} />,
    desc: 'ZIMSEC essay structure with intro, body & conclusion',
    placeholder: 'Paste your essay question here…\n\nExample: "Explain the causes of the Second Chimurenga (15 marks)" or "Discuss the factors that led to Zimbabwe\'s independence."',
  },
  {
    value: 'explain',
    label: 'Explain Concept',
    icon: <Lightbulb size={16} />,
    desc: 'Clear explanation with examples and exam tips',
    placeholder: 'What concept or topic do you want explained?\n\nExample: "Explain photosynthesis" or "What is the difference between acids and bases?" or "Explain how supply and demand works."',
  },
  {
    value: 'mark_answer',
    label: 'Mark My Answer',
    icon: <ClipboardCheck size={16} />,
    desc: 'AI marks your answer like a ZIMSEC examiner',
    placeholder: 'Format:\n\nQUESTION:\n[Paste the exam question here]\n\nMY ANSWER:\n[Paste your answer here]\n\nThe AI will mark it per ZIMSEC criteria and give you feedback.',
  },
]

const FOLLOW_UPS = [
  'Why?',
  'Show another method',
  'What marks would ZIMSEC give?',
  'Explain step 1 in more detail',
  'Give me a similar practice question',
  'What are common mistakes here?',
]

interface StreamMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function SolverClient({ subjects, initialSubjectCode, publishedDocuments }: Props) {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState(initialSubjectCode)
  const [mode, setMode] = useState<SolveMode>('step_by_step')
  const [question, setQuestion] = useState('')
  const [linkedDocId, setLinkedDocId] = useState<string>('')
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [imageType, setImageType] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedSubject = subjects.find((s) => s.code === selectedSubjectCode)
  const levelLabel = selectedSubject?.zimsec_level === 'primary' ? 'Primary'
    : selectedSubject?.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'

  // All docs for this subject for the picker
  const pickerDocs = publishedDocuments.filter((d) =>
    subjects.some((s) => s.id === d.subject_id && s.code === selectedSubjectCode)
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setImageType(file.type)
    const reader = new FileReader()
    reader.onload = (readEvent) => {
      setImage(readEvent.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const currentMode = MODES.find((m) => m.value === mode) ?? MODES[0]

  const handleSolve = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? question).trim()
    if (!text || isStreaming) return

    const userMessage: StreamMessage = { role: 'user', content: text }
    const updated = [...messages, userMessage]
    setMessages(updated)
    if (!overrideText) setQuestion('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          subjectName: selectedSubject?.name ?? '',
          subjectCode: selectedSubjectCode,
          level: selectedSubject?.zimsec_level ?? 'olevel',
          mode,
          documentId: linkedDocId || null,
          conversationHistory: messages.slice(-8),
          image,
          imageType,
        }),
      })

      if (res.ok) setImage(null)

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again.' },
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
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your internet.' },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [question, isStreaming, messages, selectedSubject, selectedSubjectCode, mode, linkedDocId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSolve()
    }
  }

  function handleReset() {
    setMessages([])
    setQuestion('')
    setLinkedDocId('')
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No subjects enrolled</h2>
          <p className="text-sm text-gray-500 mb-5">
            You need to be enrolled in at least one subject to use the Problem Solver.
          </p>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const hasResponse = messages.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-purple-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-16 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-300" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI-Powered</span>
              </div>
              <h1 className="text-2xl font-bold">Problem Solver</h1>
              <p className="text-indigo-200 text-sm mt-1">
                Step-by-step solutions grounded in the ZIMSEC curriculum
              </p>
            </div>
            {hasResponse && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition border border-white/20 flex-shrink-0"
              >
                <RotateCcw size={14} />
                New problem
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Controls */}
          <div className="lg:col-span-1 space-y-4">

            {/* Subject selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Subject
              </label>
              <div className="relative">
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => {
                    setSelectedSubjectCode(e.target.value)
                    setLinkedDocId('')
                    setMessages([])
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none pr-8"
                >
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {selectedSubject && (
                <p className="text-xs text-gray-400 mt-1.5 px-1">ZIMSEC {levelLabel}</p>
              )}
            </div>

            {/* Mode selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Solve Mode
              </label>
              <div className="space-y-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition border ${
                      mode === m.value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`mt-0.5 flex-shrink-0 ${mode === m.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {m.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document link */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Link Document
                </label>
                <span className="text-xs text-gray-400 font-medium">optional</span>
              </div>
              {pickerDocs.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No published documents for this subject yet.</p>
              ) : (
                <>
                  <div className="relative">
                    <select
                      value={linkedDocId}
                      onChange={(e) => setLinkedDocId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8"
                    >
                      <option value="">No document linked</option>
                      {pickerDocs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}{d.year ? ` (${d.year})` : ''}{d.paper_number ? ` P${d.paper_number}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {linkedDocId && (
                    <p className="text-xs text-indigo-600 mt-1.5 px-1">
                      ✓ AI will ground answers in this document
                    </p>
                  )}
                </>
              )}
            </div>

          </div>

          {/* RIGHT: Input + Response */}
          <div className="lg:col-span-2 space-y-4">

            {/* Question input */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Your Question
              </label>
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={image ? 3 : 6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder={currentMode.placeholder}
              />
              
              {image && (
                <div className="mt-3 relative w-full aspect-video sm:aspect-[21/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Question preview" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/50 hover:bg-slate-900/80 text-white rounded-full transition backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-900/50 to-transparent">
                    <p className="text-[10px] text-white font-bold uppercase tracking-widest px-2">Image attached · Ready to solve</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming}
                    className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition border border-transparent hover:border-indigo-100 flex items-center gap-2"
                    title="Upload photo of question"
                  >
                    <Smartphone size={18} />
                    <span className="text-xs font-bold uppercase tracking-tight hidden sm:inline">Photo</span>
                  </button>
                  <p className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter to solve</p>
                </div>
                <button
                  onClick={() => handleSolve()}
                  disabled={!question.trim() || isStreaming}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  {isStreaming ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Solving…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Solve
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Response area */}
            {messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles size={11} className="text-white" />
                          </div>
                          <span className="text-xs font-semibold text-indigo-700">
                            AI Solution · {selectedSubject?.name} · ZIMSEC {levelLabel}
                          </span>
                          {linkedDocId && (
                            <span className="ml-auto text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
                              Document grounded
                            </span>
                          )}
                        </div>
                        <div className="px-5 py-5">
                          {msg.content === '' && isStreaming ? (
                            <span className="inline-flex gap-1">
                              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          ) : (
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />

                {/* Follow-up prompts */}
                {!isStreaming && messages[messages.length - 1]?.role === 'assistant' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Follow-up
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FOLLOW_UPS.map((fu) => (
                        <button
                          key={fu}
                          onClick={() => handleSolve(fu)}
                          className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-100 transition font-medium"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                    {/* Or type own follow-up */}
                    <div className="flex gap-2 mt-3 items-end">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSolve() }
                        }}
                        placeholder="Ask a follow-up…"
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                      <button
                        onClick={() => handleSolve()}
                        disabled={!question.trim() || isStreaming}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-sm"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {currentMode.icon}
                </div>
                <p className="font-semibold text-gray-700 text-base mb-1">
                  {currentMode.label} Mode
                </p>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  {currentMode.desc}. Type your question above and click Solve.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
