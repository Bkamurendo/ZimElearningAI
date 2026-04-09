'use client'

import { useState } from 'react'
import {
  Loader2, ChevronDown, ChevronUp, Printer, BookOpen, AlertCircle,
  Target, HelpCircle, FileText, List, Lightbulb, Clock,
} from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────────────── */

interface SubjectInfo {
  id: string
  name: string
  code: string
  zimsecLevel: string
  examDate: string | null
  daysUntilExam: number | null
}

interface WeakTopic {
  topic: string
  lastScore: number
  importance: 'high' | 'medium' | 'low'
}

interface PracticeQuestion {
  question: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  answer: string
  explanation: string
}

interface KeyDefinition {
  term: string
  definition: string
}

interface RevisionPack {
  subject: string
  examDate: string
  daysUntilExam: number
  weakTopics: WeakTopic[]
  mustPracticeQuestions: PracticeQuestion[]
  formulaSheet: string
  keyDefinitions: KeyDefinition[]
  studyTips: string[]
  estimatedStudyHours: number
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function RevisionPackClient({ subjects }: { subjects: SubjectInfo[] }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [pack, setPack] = useState<RevisionPack | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set())

  async function generate(code: string) {
    setSelectedSubject(code)
    setPack(null)
    setError(null)
    setExpandedQ(new Set())
    setLoading(true)

    try {
      const res = await fetch(`/api/student/revision-pack?subjectCode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate revision pack')
      setPack(data.revisionPack)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function toggleQuestion(idx: number) {
    setExpandedQ(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const selectedName = subjects.find(s => s.code === selectedSubject)?.name ?? ''

  return (
    <div className="space-y-6">
      {/* Generate buttons */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((subj) => (
          <button
            key={subj.code}
            onClick={() => generate(subj.code)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition border disabled:opacity-60 ${
              selectedSubject === subj.code
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            {loading && selectedSubject === subj.code ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Target size={14} />
            )}
            Generate {subj.name} Pack
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <div className="h-7 w-72 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-6" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl mb-3" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 h-48" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 h-48" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-5 py-4 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Revision pack display */}
      {pack && !loading && (
        <div className="space-y-6 print:space-y-4" id="revision-pack-content">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {pack.subject} Revision Pack
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {pack.daysUntilExam > 0
                    ? `${pack.daysUntilExam} days to go — Exam: ${new Date(pack.examDate).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : `Exam date: ${pack.examDate}`}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition print:hidden"
              >
                <Printer size={15} /> Print / Save
              </button>
            </div>
          </div>

          {/* Weak Topics */}
          <Section icon={<Target size={18} />} title="Weak Topics — Focus Areas">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pack.weakTopics.map((t, i) => {
                const colorClass =
                  t.lastScore < 50
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : t.lastScore < 70
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                      : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                const textColor =
                  t.lastScore < 50
                    ? 'text-red-700 dark:text-red-400'
                    : t.lastScore < 70
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-green-700 dark:text-green-400'
                return (
                  <div key={i} className={`rounded-xl border p-4 ${colorClass}`}>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.topic}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-bold ${textColor}`}>
                        Score: {t.lastScore}%
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        t.importance === 'high'
                          ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                          : t.importance === 'medium'
                            ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                            : 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                      }`}>
                        {t.importance}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Must-Practice Questions */}
          <Section icon={<HelpCircle size={18} />} title="Must-Practice Questions">
            <div className="space-y-3">
              {pack.mustPracticeQuestions.map((q, i) => (
                <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(i)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{q.topic}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          q.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : q.difficulty === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-gray-400 mt-1">
                      {expandedQ.has(i) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {expandedQ.has(i) && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                      <div className="mb-3">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">Model Answer</p>
                        <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{q.answer}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">Explanation</p>
                        <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Formula Sheet & Key Definitions side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Formula Sheet */}
            <Section icon={<FileText size={18} />} title="Formula Sheet">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                {pack.formulaSheet}
              </div>
            </Section>

            {/* Key Definitions */}
            <Section icon={<List size={18} />} title="Key Definitions">
              <div className="grid gap-2">
                {pack.keyDefinitions.map((d, i) => (
                  <div key={i} className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2 text-sm border-b border-gray-50 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                    <span className="font-semibold text-gray-900 dark:text-white">{d.term}</span>
                    <span className="text-gray-600 dark:text-slate-300">{d.definition}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Study Tips & Estimated Hours */}
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            {/* Study Tips */}
            <Section icon={<Lightbulb size={18} />} title="Study Tips">
              <ul className="space-y-2">
                {pack.studyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
                    <input type="checkbox" className="mt-1 accent-emerald-600 flex-shrink-0" readOnly={false} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Estimated Study Hours — Progress ring */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center min-w-[200px]">
              <Clock size={16} className="text-emerald-600 mb-2" />
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Estimated Study</p>
              <ProgressRing hours={pack.estimatedStudyHours} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {pack.estimatedStudyHours}h
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">recommended</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-4">
        <span className="text-emerald-600">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function ProgressRing({ hours }: { hours: number }) {
  // 40 hours max for the ring visualization
  const max = 40
  const pct = Math.min(1, hours / max)
  const radius = 48
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)

  return (
    <svg width={120} height={120} className="transform -rotate-90">
      <circle
        cx={60}
        cy={60}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-100 dark:text-slate-800"
      />
      <circle
        cx={60}
        cy={60}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-emerald-500 transition-all duration-700"
      />
    </svg>
  )
}
