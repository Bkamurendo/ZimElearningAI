'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  Send, Bot, User, Loader2, Plus, MessageCircle, BookOpen,
  Mic, MicOff, Image as ImageIcon, Save, Map, FlaskConical,
  FileText, X, CheckCircle2, XCircle, Trophy, ChevronRight,
  Volume2, Lightbulb, AlignLeft,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
type Message = {
  role: 'user' | 'assistant'
  content: string
  imagePreview?: string
  quizData?: QuizQuestion[]
  roadmapData?: RoadmapData
  savedToNotes?: boolean
}
type Conversation = { id: string; title: string; updated_at: string }
type Subject = { id: string; name: string }

type QuizQuestion = {
  question: string
  options: string[]
  correct: number
  explanation: string
  marks: number
}
type RoadmapData = {
  title: string
  weeks: { week: number; topic: string; subtopics: string[]; pastPaperFocus: string }[]
}

// ── Mode colours ─────────────────────────────────────────────────────────────
const MODES = {
  normal:     { label: 'Chat',        color: 'bg-teal-600',   icon: MessageCircle },
  quiz:       { label: 'Quiz Me',     color: 'bg-violet-600', icon: FlaskConical  },
  roadmap:    { label: 'Study Plan',  color: 'bg-orange-500', icon: Map           },
  past_paper: { label: 'Past Paper',  color: 'bg-rose-600',   icon: FileText      },
}
type Mode = keyof typeof MODES

const STARTERS = [
  'Explain photosynthesis for Form 2',
  'Help me solve quadratic equations step by step',
  'What are the causes of the First Chimurenga?',
  'How do I write a good O-Level English essay?',
  'Explain supply and demand with a Zimbabwean example',
  'What is the difference between mitosis and meiosis?',
  'Help me understand compound interest with ZiG examples',
  'How do I balance chemical equations?',
]

// ── Inline Quiz Component ─────────────────────────────────────────────────────
function InlineQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  function choose(i: number) {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === questions[current].correct) setScore(s => s + 1)
  }

  function next() {
    if (current + 1 >= questions.length) { setDone(true); return }
    setCurrent(c => c + 1)
    setSelected(null)
    setRevealed(false)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 text-center">
        <Trophy size={32} className="text-yellow-500 mx-auto mb-2" />
        <p className="font-bold text-gray-900 text-lg">{pct >= 70 ? '🎉 Great work!' : pct >= 50 ? '📚 Keep studying!' : '💪 More practice needed'}</p>
        <p className="text-sm text-gray-600 mt-1">{score}/{questions.length} correct · {pct}%</p>
        {pct < 70 && <p className="text-xs text-gray-400 mt-2">Ask MaFundi to explain any questions you got wrong</p>}
      </div>
    )
  }

  const q = questions[current]
  return (
    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-violet-600">Question {current + 1}/{questions.length}</span>
        <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
      </div>
      <p className="font-semibold text-gray-900 text-sm leading-snug">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
              !revealed
                ? 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                : i === q.correct
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : i === selected
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-gray-100 text-gray-400'
            }`}
          >
            <span className="font-bold mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {revealed && i === q.correct && <CheckCircle2 size={14} className="inline ml-2 text-green-600" />}
            {revealed && i === selected && i !== q.correct && <XCircle size={14} className="inline ml-2 text-red-500" />}
          </button>
        ))}
      </div>
      {revealed && (
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Explanation</p>
          <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
          <button onClick={next} className="mt-2 flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition">
            {current + 1 < questions.length ? 'Next question' : 'See results'} <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Roadmap Component ─────────────────────────────────────────────────────────
function StudyRoadmap({ data }: { data: RoadmapData }) {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Map size={16} className="text-orange-500" />
        <p className="font-bold text-gray-900 text-sm">{data.title}</p>
      </div>
      <div className="space-y-2">
        {data.weeks.map(w => (
          <div key={w.week} className="bg-white rounded-xl p-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{w.week}</span>
              <p className="font-semibold text-gray-900 text-xs">{w.topic}</p>
            </div>
            <ul className="space-y-0.5 mb-1.5">
              {w.subtopics.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
            {w.pastPaperFocus && (
              <p className="text-[11px] text-rose-600 font-medium">📝 Past paper: {w.pastPaperFocus}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AITeacherPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('normal')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')

  // Upgrade modal (shown when quota exceeded)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Voice
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // TTS
  const [speaking, setSpeaking] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/ai-teacher/conversations').then(r => r.json()),
      fetch('/api/student/subjects').then(r => r.json()),
    ]).then(([cd, sd]) => {
      setConversations(cd.conversations ?? [])
      setSubjects(sd.subjects ?? [])
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Voice Input ──────────────────────────────────────────────────────────────
  function toggleVoice() {
    const w = window as Window & typeof globalThis & {
      webkitSpeechRecognition?: new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void }
    }
    if (!w.webkitSpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new w.webkitSpeechRecognition()
    rec.lang = 'en-ZA'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionRef.current = rec as any
    rec.start()
    setListening(true)
  }

  // ── Image Upload ─────────────────────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setImagePreview(result)
      // Extract base64 (remove data:image/...;base64, prefix)
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Text-to-Speech ────────────────────────────────────────────────────────────
  function speakText(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, '').slice(0, 2000))
      utterance.lang = 'en-ZA'
      utterance.rate = 0.95
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  // ── Save to Notes ─────────────────────────────────────────────────────────────
  async function saveToNotes(content: string, msgIdx: number) {
    const title = content.slice(0, 60).replace(/[#*`]/g, '') + '…'
    await fetch('/api/student/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, subject_id: selectedSubject || null }),
    })
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, savedToNotes: true } : m))
  }

  // ── Load conversation ─────────────────────────────────────────────────────────
  async function loadConversation(id: string) {
    setActiveConvId(id)
    setLoadingHistory(true)
    const res = await fetch(`/api/ai-teacher/conversations/${id}/messages`)
    const data = await res.json()
    setMessages((data.messages ?? []).map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content })))
    setLoadingHistory(false)
  }

  function newConversation() {
    setActiveConvId(null)
    setMessages([])
    clearImage()
    inputRef.current?.focus()
  }

  // ── Send Message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if ((!msg && !imageBase64) || loading) return

    setInput('')
    const userMsg: Message = {
      role: 'user',
      content: msg || '📷 [Image attached]',
      imagePreview: imagePreview ?? undefined,
    }
    setMessages(prev => [...prev, userMsg])
    clearImage()
    setLoading(true)

    const subjectName = subjects.find(s => s.id === selectedSubject)?.name

    try {
      const res = await fetch('/api/ai-teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConvId,
          message: msg || 'Please analyse this image and explain what you see in an educational context.',
          subject_name: subjectName,
          mode,
          image_base64: imageBase64,
        }),
      })
      const data = await res.json()

      if (res.status === 429 || data.quota_exceeded) {
        // Quota exhausted — show upgrade modal instead of error message
        setShowUpgradeModal(true)
      } else if (!res.ok || data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ MaFundi encountered an error: ${data.error ?? 'Please try again.'}`,
        }])
      } else if (data.reply || data.reply === '') {
        // Parse special structured responses
        let quizData: QuizQuestion[] | undefined
        let roadmapData: RoadmapData | undefined
        let replyText = data.reply || 'I received your message but my response was empty. Please try again.'

        if (mode === 'quiz' && data.quiz) {
          quizData = data.quiz
          replyText = `Here's a ${data.quiz.length}-question quiz! 🎯`
        }
        if (mode === 'roadmap' && data.roadmap) {
          roadmapData = data.roadmap
          replyText = `Here's your personalised study roadmap! 📅`
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: replyText,
          quizData,
          roadmapData,
        }])

        if (!activeConvId && data.conversation_id) {
          setActiveConvId(data.conversation_id)
          const title = msg.slice(0, 60) + (msg.length > 60 ? '…' : '')
          setConversations(prev => [{ id: data.conversation_id, title, updated_at: new Date().toISOString() }, ...prev])
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ MaFundi did not return a response. Please try again.',
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Network error — please check your connection and try again.',
      }])
    }

    setLoading(false)
  }, [input, imageBase64, imagePreview, loading, activeConvId, mode, selectedSubject, subjects])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const modeConfig = MODES[mode]
  const ModeIcon = modeConfig.icon

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-gray-50">

      {/* ── Quota Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap size={26} className="text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Daily Limit Reached</h2>
            <p className="text-sm text-gray-500 mb-4">
              You&apos;ve used all your free AI requests for today. Upgrade to Pro for unlimited access to MaFundi — no daily cap, ever.
            </p>
            <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-left space-y-2">
              {['Unlimited MaFundi conversations', 'Mock exam generator', 'AI flashcard creator', 'Study notes & revision generation', 'All subjects unlocked'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-indigo-800">
                  <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <a href="/student/upgrade" className="block w-full py-3 rounded-xl font-bold text-white text-sm mb-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Upgrade to Pro — from $5/mo
            </a>
            <button onClick={() => setShowUpgradeModal(false)}
              className="block w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition">
              Maybe later (resets tomorrow)
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">MaFundi AI</p>
              <p className="text-xs text-teal-600">Your ZIMSEC Teacher</p>
            </div>
          </div>
          <button onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
            <Plus size={15} /> New Conversation
          </button>
        </div>

        {/* Mode selector */}
        <div className="px-3 py-3 border-b border-gray-100 space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Mode</p>
          {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={key} onClick={() => setMode(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  mode === key ? `${cfg.color} text-white shadow-sm` : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={14} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Subject selector */}
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Subject</p>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-700">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Recent Chats</p>
          {conversations.length === 0
            ? <p className="text-xs text-gray-400 italic px-2 py-4 text-center">No conversations yet</p>
            : conversations.map(conv => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${
                  activeConvId === conv.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <div className="flex items-start gap-2">
                  <MessageCircle size={11} className="mt-0.5 flex-shrink-0 opacity-60" />
                  <span className="truncate">{conv.title}</span>
                </div>
              </button>
            ))
          }
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">MaFundi — AI ZIMSEC Teacher</p>
              <p className="text-xs text-teal-600">Expert in all ZIMSEC subjects · Primary, O-Level &amp; A-Level</p>
            </div>
          </div>
          {/* Active mode pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${modeConfig.color}`}>
            <ModeIcon size={12} />
            {modeConfig.label} Mode
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-2xl mx-auto pt-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot size={30} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Mhoro! I&apos;m MaFundi 👋</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Your personal AI teacher for all ZIMSEC subjects. Ask me anything, quiz yourself, get a study plan, or upload a homework photo!
                </p>
              </div>

              {/* Mode cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'quiz' as Mode, title: 'Quiz Me', desc: 'Interactive MCQ quiz on any topic', emoji: '🎯' },
                  { key: 'roadmap' as Mode, title: 'Study Plan', desc: 'Week-by-week revision roadmap', emoji: '🗓️' },
                  { key: 'past_paper' as Mode, title: 'Past Paper Mode', desc: 'Exam-style questions & marking', emoji: '📝' },
                  { key: 'normal' as Mode, title: 'Ask Anything', desc: 'Explain concepts, solve problems', emoji: '💡' },
                ].map(m => (
                  <button key={m.key} onClick={() => setMode(m.key)}
                    className={`text-left p-4 rounded-2xl border-2 transition ${mode === m.key ? 'border-teal-400 bg-teal-50' : 'border-gray-100 bg-white hover:border-teal-200'}`}>
                    <p className="text-xl mb-1">{m.emoji}</p>
                    <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen size={12} /> Try asking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTERS.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="text-left text-sm text-gray-700 bg-white border border-gray-100 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 rounded-xl px-4 py-3 transition shadow-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'max-w-3xl'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={15} className="text-white" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'flex-1'}`}>
                    {/* Image preview (user uploads) */}
                    {msg.imagePreview && (
                      <div className="mb-2 flex justify-end">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.imagePreview} alt="Uploaded" className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-gray-200 shadow-sm" />
                      </div>
                    )}

                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>

                    {/* Quiz widget */}
                    {msg.quizData && <div className="mt-2"><InlineQuiz questions={msg.quizData} /></div>}
                    {/* Roadmap widget */}
                    {msg.roadmapData && <div className="mt-2"><StudyRoadmap data={msg.roadmapData} /></div>}

                    {/* Assistant action bar */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1">
                        <button onClick={() => speakText(msg.content)} title="Read aloud"
                          className={`p-1.5 rounded-lg transition text-gray-300 hover:text-teal-500 hover:bg-teal-50 ${speaking ? 'text-teal-500' : ''}`}>
                          <Volume2 size={13} />
                        </button>
                        <button onClick={() => saveToNotes(msg.content, i)} title="Save to My Notes" disabled={msg.savedToNotes}
                          className={`p-1.5 rounded-lg transition ${msg.savedToNotes ? 'text-green-500' : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                          {msg.savedToNotes ? <CheckCircle2 size={13} /> : <Save size={13} />}
                        </button>
                        <button onClick={() => setInput(`Can you explain this more simply: "${msg.content.slice(0, 80)}..."`)} title="Simplify explanation"
                          className="p-1.5 rounded-lg transition text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                          <AlignLeft size={13} />
                        </button>
                        <button onClick={() => setInput(`Give me a practice question on this topic`)} title="Practice question"
                          className="p-1.5 rounded-lg transition text-gray-300 hover:text-violet-500 hover:bg-violet-50">
                          <Lightbulb size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={15} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="bg-white border-t border-gray-100 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Image preview strip */}
            {imagePreview && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700 truncate">{imageFile?.name}</p>
                  <p className="text-[10px] text-blue-400">Image attached — ask MaFundi about it</p>
                </div>
                <button onClick={clearImage} className="p-1 rounded-lg hover:bg-blue-100 transition flex-shrink-0">
                  <X size={14} className="text-blue-500" />
                </button>
              </div>
            )}

            <div className={`flex items-end gap-2 bg-gray-50 border rounded-2xl px-4 py-3 transition focus-within:ring-2 focus-within:ring-opacity-50 ${
              mode === 'quiz'       ? 'border-violet-200 focus-within:border-violet-400 focus-within:ring-violet-100' :
              mode === 'roadmap'   ? 'border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100' :
              mode === 'past_paper'? 'border-rose-200   focus-within:border-rose-400   focus-within:ring-rose-100'   :
                                     'border-gray-200   focus-within:border-teal-400   focus-within:ring-teal-100'
            }`}>
              {/* Image upload */}
              <button onClick={() => fileInputRef.current?.click()} title="Upload homework photo"
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition">
                <ImageIcon size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={
                  mode === 'quiz'       ? `Topic to quiz on… e.g. "Form 3 Photosynthesis MCQ"` :
                  mode === 'roadmap'    ? `Topic for study plan… e.g. "O-Level Maths 4 weeks to exam"` :
                  mode === 'past_paper' ? `Paste a past paper question or ask for ZIMSEC-style Q…` :
                                          `Ask MaFundi anything… (Enter to send)`
                }
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 max-h-32"
                style={{ minHeight: '24px' }} />

              {/* Voice input */}
              <button onClick={toggleVoice} title={listening ? 'Stop listening' : 'Voice input'}
                className={`flex-shrink-0 p-1.5 rounded-lg transition ${listening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-teal-500 hover:bg-teal-50'}`}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Send */}
              <button onClick={() => sendMessage()} disabled={(!input.trim() && !imageBase64) || loading}
                className={`flex-shrink-0 w-9 h-9 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition ${modeConfig.color}`}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              MaFundi is an AI teacher. For critical academic decisions, consult your school teacher or official ZIMSEC resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
