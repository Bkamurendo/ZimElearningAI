'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Subject = { id: string; name: string; code: string; zimsec_level: string }
type RecentAttempt = { score: number; total: number; topic: string; created_at: string }

type PaperPart = {
  part: string
  question: string
  marks: number
  markingPoints: string[]
  modelAnswer: string
}

type PaperQuestion = {
  number: number
  topic: string
  parts: PaperPart[]
}

type Paper = {
  paperTitle: string
  totalMarks: number
  timeMinutes: number
  instructions: string
  questions: PaperQuestion[]
}

type MarkResult = {
  marksAwarded: number
  pointsAwarded: string[]
  pointsMissed: string[]
  feedback: string
  grade: string
}

type PartKey = `${number}-${string}`

type Phase = 'setup' | 'generating' | 'exam' | 'marking' | 'results'

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-700 bg-green-100',
  B: 'text-blue-700 bg-blue-100',
  C: 'text-yellow-700 bg-yellow-100',
  D: 'text-orange-700 bg-orange-100',
  E: 'text-red-700 bg-red-100',
  U: 'text-gray-700 bg-gray-100',
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PastPaperClient({
  subject,
  recentAttempts,
}: {
  subject: Subject
  recentAttempts: RecentAttempt[]
}) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedYear, setSelectedYear] = useState(2023)
  const [selectedPaper, setSelectedPaper] = useState(1)
  const [paper, setPaper] = useState<Paper | null>(null)
  const [answers, setAnswers] = useState<Record<PartKey, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [markResults, setMarkResults] = useState<Record<PartKey, MarkResult>>({})
  const [markingProgress, setMarkingProgress] = useState(0)
  const [totalMarkingParts, setTotalMarkingParts] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const levelLabel = subject.zimsec_level === 'olevel' ? 'O-Level' : subject.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'

  // Timer countdown
  useEffect(() => {
    if (phase === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            handleSubmitExam()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function generatePaper() {
    setPhase('generating')
    try {
      const res = await fetch('/api/past-papers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          subjectName: subject.name,
          level: subject.zimsec_level,
          year: selectedYear,
          paperNumber: selectedPaper,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPaper(data.paper)
      setTimeLeft(data.paper.timeMinutes * 60)
      setAnswers({})
      setMarkResults({})
      setPhase('exam')
    } catch {
      setPhase('setup')
      alert('Failed to generate paper. Please check your API credits and try again.')
    }
  }

  function setAnswer(qNum: number, part: string, value: string) {
    const key: PartKey = `${qNum}-${part}`
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmitExam() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!paper) return

    // Count total parts
    const allParts: { qNum: number; part: PaperPart; qTopic: string }[] = []
    for (const q of paper.questions) {
      for (const p of q.parts) {
        allParts.push({ qNum: q.number, part: p, qTopic: q.topic })
      }
    }

    setTotalMarkingParts(allParts.length)
    setMarkingProgress(0)
    setPhase('marking')

    const results: Record<PartKey, MarkResult> = {}

    for (let i = 0; i < allParts.length; i++) {
      const { qNum, part } = allParts[i]
      const key: PartKey = `${qNum}-${part.part}`
      const studentAnswer = answers[key] ?? ''

      try {
        const res = await fetch('/api/past-papers/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectName: subject.name,
            level: subject.zimsec_level,
            question: part.question,
            markingPoints: part.markingPoints,
            modelAnswer: part.modelAnswer,
            studentAnswer,
            marks: part.marks,
          }),
        })
        const result = await res.json()
        if (!result.error) results[key] = result
      } catch {
        results[key] = {
          marksAwarded: 0,
          pointsAwarded: [],
          pointsMissed: part.markingPoints,
          feedback: 'Could not mark this answer.',
          grade: 'U',
        }
      }

      setMarkingProgress(i + 1)
    }

    setMarkResults(results)
    setPhase('results')
  }

  // SETUP
  if (phase === 'setup') {
    const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/student/subjects/${subject.code}`} className="text-gray-400 hover:text-gray-600 transition">← {subject.name}</Link>
            <span className="text-gray-200">/</span>
            <span className="font-bold text-gray-900">Past Papers</span>
          </div>

          {/* Info banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-1">AI-Marked Past Papers</h2>
            <p className="text-sm opacity-90">
              Practice with ZIMSEC-style exam questions. Your answers are marked by AI using the official marking scheme criteria.
            </p>
            <div className="mt-3 flex gap-4 text-sm opacity-80">
              <span>📝 4 structured questions</span>
              <span>⏱ 2h 30min timed</span>
              <span>🎯 AI marking</span>
            </div>
          </div>

          {/* Recent attempts */}
          {recentAttempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent attempts</h3>
              <div className="space-y-2">
                {recentAttempts.map((a, i) => {
                  const pct = Math.round((a.score / a.total) * 100)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{a.topic}</span>
                      <span className={`font-semibold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
                        {a.score}/{a.total} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Config */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Configure your paper</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Examination Year (style)</label>
              <div className="grid grid-cols-5 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`py-2 rounded-lg border text-sm font-medium transition ${
                      selectedYear === y
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper Number</label>
              <div className="flex gap-3">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPaper(p)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                      selectedPaper === p
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Paper {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>⚠ Note:</strong> This paper is AI-generated in the style of ZIMSEC {selectedYear}. It is not an official past paper but closely follows the examination format and syllabus content.
            </div>

            <button
              onClick={generatePaper}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              Generate & Start Paper →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // GENERATING
  if (phase === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Generating your ZIMSEC past paper…</p>
          <p className="text-sm text-gray-400 mt-1">{subject.name} {selectedYear} Paper {selectedPaper}</p>
        </div>
      </div>
    )
  }

  // MARKING
  if (phase === 'marking') {
    const pct = totalMarkingParts > 0 ? Math.round((markingProgress / totalMarkingParts) * 100) : 0
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-800 font-semibold text-lg mb-2">AI Examiner marking your paper…</p>
          <p className="text-sm text-gray-500 mb-4">Marking question {markingProgress} of {totalMarkingParts}</p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{pct}% complete</p>
        </div>
      </div>
    )
  }

  // RESULTS
  if (phase === 'results' && paper) {
    let totalAwarded = 0
    let totalPossible = 0
    for (const q of paper.questions) {
      for (const p of q.parts) {
        const key: PartKey = `${q.number}-${p.part}`
        totalPossible += p.marks
        totalAwarded += markResults[key]?.marksAwarded ?? 0
      }
    }
    const overallPct = totalPossible > 0 ? Math.round((totalAwarded / totalPossible) * 100) : 0
    const overallGrade = overallPct >= 75 ? 'A' : overallPct >= 60 ? 'B' : overallPct >= 50 ? 'C' : overallPct >= 40 ? 'D' : overallPct >= 30 ? 'E' : 'U'

    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Marked Script</h1>
            <button
              onClick={() => setPhase('setup')}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              Try another paper
            </button>
          </div>
          {/* Overall result */}
          <div className={`rounded-2xl p-6 text-center ${overallGrade === 'A' ? 'bg-green-600' : overallGrade === 'B' ? 'bg-blue-600' : overallGrade === 'C' ? 'bg-yellow-500' : overallGrade === 'D' ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
            <p className="text-sm opacity-80 mb-1">{paper.paperTitle}</p>
            <p className="text-6xl font-bold">{overallGrade}</p>
            <p className="text-2xl font-semibold mt-2">{totalAwarded}/{totalPossible} marks</p>
            <p className="text-lg opacity-90">{overallPct}%</p>
          </div>

          {/* Per-question breakdown */}
          {paper.questions.map((q) => {
            const qTotal = q.parts.reduce((s, p) => s + p.marks, 0)
            const qAwarded = q.parts.reduce((s, p) => {
              const key: PartKey = `${q.number}-${p.part}`
              return s + (markResults[key]?.marksAwarded ?? 0)
            }, 0)

            return (
              <div key={q.number} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">Question {q.number}</span>
                    <span className="ml-2 text-sm text-gray-500">{q.topic}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{qAwarded}/{qTotal}</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {q.parts.map((p) => {
                    const key: PartKey = `${q.number}-${p.part}`
                    const result = markResults[key]
                    const studentAns = answers[key] ?? ''

                    return (
                      <div key={p.part} className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              ({p.part}) {p.question}
                              <span className="ml-2 text-xs text-gray-400">[{p.marks} marks]</span>
                            </p>
                          </div>
                          {result && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLORS[result.grade] ?? 'text-gray-700 bg-gray-100'}`}>
                                {result.grade}
                              </span>
                              <span className="text-sm font-bold text-gray-700">
                                {result.marksAwarded}/{p.marks}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Student answer */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {studentAns || <span className="italic text-gray-400">No answer provided</span>}
                          </p>
                        </div>

                        {/* Marking feedback */}
                        {result && (
                          <div className="space-y-2">
                            {result.pointsAwarded.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-700 mb-1">✓ Points awarded:</p>
                                <ul className="space-y-0.5">
                                  {result.pointsAwarded.map((pt, i) => (
                                    <li key={i} className="text-xs text-green-700 flex gap-1.5">
                                      <span className="flex-shrink-0">•</span>{pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.pointsMissed.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-1">✗ Missed points:</p>
                                <ul className="space-y-0.5">
                                  {result.pointsMissed.map((pt, i) => (
                                    <li key={i} className="text-xs text-red-700 flex gap-1.5">
                                      <span className="flex-shrink-0">•</span>{pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-800 mb-0.5">Examiner feedback:</p>
                              <p className="text-xs text-blue-700">{result.feedback}</p>
                            </div>
                            {/* Model answer */}
                            <details className="text-xs">
                              <summary className="text-gray-500 cursor-pointer hover:text-gray-700">Show model answer</summary>
                              <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-3">
                                <p className="text-green-800 whitespace-pre-wrap">{p.modelAnswer}</p>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Try another paper
            </button>
            <Link
              href={`/student/subjects/${subject.code}`}
              className="flex-1 py-3 bg-indigo-600 text-white text-center font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              Back to {subject.name}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // EXAM PHASE
  if (!paper) return null

  const isLow = timeLeft < 600 // under 10 min

  return (
    <div className="min-h-screen">
      {/* Sticky exam header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-500">{paper.paperTitle}</p>
          <p className="text-sm font-semibold text-gray-900">Total: {paper.totalMarks} marks</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-lg font-bold font-mono px-3 py-1 rounded-lg ${isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleSubmitExam}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Submit Paper
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <strong>Instructions:</strong> {paper.instructions}
        </div>

        {/* Questions */}
        {paper.questions.map((q) => (
          <div key={q.number} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-800 text-white px-5 py-3">
              <p className="font-semibold">Question {q.number} — {q.topic}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {q.parts.map((p) => {
                const key: PartKey = `${q.number}-${p.part}`
                return (
                  <div key={p.part} className="p-5 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 flex-shrink-0">({p.part})</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 leading-relaxed">{p.question}</p>
                        <p className="text-xs text-gray-400 mt-1">[{p.marks} marks]</p>
                      </div>
                    </div>
                    <textarea
                      value={answers[key] ?? ''}
                      onChange={(e) => setAnswer(q.number, p.part, e.target.value)}
                      rows={p.marks >= 8 ? 8 : p.marks >= 4 ? 5 : 3}
                      placeholder={`Write your answer here… (${p.marks} marks)`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {(answers[key] ?? '').length} chars
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmitExam}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-lg"
        >
          Submit Paper for Marking
        </button>
      </div>
    </div>
  )
}
