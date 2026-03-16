'use client'

import { useState } from 'react'
import Link from 'next/link'

type Subject = { id: string; name: string; code: string; zimsec_level: string }
type MasteryRow = { topic: string; mastery_level: string }
type Question = {
  question: string
  options: string[]
  correct: string
  explanation: string
}

const MASTERY_COLORS: Record<string, string> = {
  mastered: 'bg-green-100 text-green-800',
  competent: 'bg-blue-100 text-blue-800',
  learning: 'bg-yellow-100 text-yellow-800',
  not_started: 'bg-gray-100 text-gray-600',
}

const ZIMSEC_TOPICS: Record<string, string[]> = {
  'OL-MATH': ['Number & Algebra', 'Geometry', 'Statistics & Probability', 'Trigonometry', 'Matrices', 'Calculus Basics'],
  'OL-ENG': ['Reading Comprehension', 'Essay Writing', 'Summary Writing', 'Language Use', 'Literature'],
  'OL-CSCI': ['Biology Basics', 'Chemistry Basics', 'Physics Basics', 'Scientific Methods'],
  'OL-PHY': ['Mechanics', 'Thermal Physics', 'Waves', 'Electricity & Magnetism', 'Modern Physics'],
  'OL-CHEM': ['Atomic Structure', 'Chemical Bonding', 'Acids & Bases', 'Redox', 'Organic Chemistry'],
  'OL-BIO': ['Cell Biology', 'Genetics', 'Ecology', 'Human Biology', 'Plants'],
  'OL-HIST': ['Colonial Zimbabwe', 'Nationalism', 'Independence', 'World History'],
  'OL-GEO': ['Physical Geography', 'Human Geography', 'Map Reading', 'Zimbabwe Geography'],
  'OL-COM': ['Business Environment', 'Trade', 'Banking', 'Insurance', 'Transport'],
  'OL-ACC': ['Bookkeeping', 'Final Accounts', 'Bank Reconciliation', 'Ledger Entries'],
  'AL-PMATH': ['Algebra', 'Calculus', 'Vectors', 'Trigonometry', 'Coordinate Geometry'],
  'AL-PHY': ['Mechanics', 'Fields', 'Thermal Physics', 'Waves & Optics', 'Modern Physics'],
  'AL-CHEM': ['Energetics', 'Equilibrium', 'Organic Chemistry', 'Electrochemistry'],
  'AL-BIO': ['Biological Molecules', 'Cell Division', 'Genetics & Evolution', 'Physiology'],
  'AL-ECON': ['Microeconomics', 'Macroeconomics', 'International Trade', 'Development Economics'],
}

function getTopics(code: string): string[] {
  return ZIMSEC_TOPICS[code] || ['Introduction', 'Core Concepts', 'Application', 'Exam Practice']
}

type Phase = 'setup' | 'loading' | 'quiz' | 'results'

export default function QuizEngine({
  subject,
  existingMastery,
}: {
  subject: Subject
  existingMastery: MasteryRow[]
}) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ selected: string; correct: boolean }[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [newMastery, setNewMastery] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState(0)

  const topics = getTopics(subject.code)
  const masteryMap = Object.fromEntries(existingMastery.map((m) => [m.topic, m.mastery_level]))

  async function startQuiz() {
    if (!topic) return
    setPhase('loading')
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          subjectName: subject.name,
          level: subject.zimsec_level,
          topic,
          difficulty,
          count: 5,
        }),
      })
      const data = await res.json()
      setQuestions(data.questions)
      setCurrentQ(0)
      setAnswers([])
      setSelected(null)
      setShowExplanation(false)
      setPhase('quiz')
    } catch {
      setPhase('setup')
      alert('Failed to generate quiz. Please try again.')
    }
  }

  function handleAnswer(option: string) {
    if (selected) return
    const letter = option.charAt(0)
    setSelected(letter)
    setShowExplanation(true)
  }

  function handleNext() {
    const letter = selected!
    const correct = letter === questions[currentQ].correct
    const newAnswers = [...answers, { selected: letter, correct }]
    setAnswers(newAnswers)
    setSelected(null)
    setShowExplanation(false)

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1)
    } else {
      finishQuiz(newAnswers)
    }
  }

  async function finishQuiz(finalAnswers: { selected: string; correct: boolean }[]) {
    const score = finalAnswers.filter((a) => a.correct).length
    const total = finalAnswers.length

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          topic,
          score,
          total,
          questions: questions.map((q, i) => ({
            question: q.question,
            correct: q.correct,
            selected: finalAnswers[i]?.selected ?? '',
            isCorrect: finalAnswers[i]?.correct ?? false,
          })),
        }),
      })
      const data = await res.json()
      setNewMastery(data.mastery)
      setXpEarned(data.xpEarned)
    } catch {
      // non-critical
    }
    setPhase('results')
  }

  const score = answers.filter((a) => a.correct).length

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/student/subjects/${subject.code}`} className="text-gray-400 hover:text-gray-600 transition">← {subject.name}</Link>
            <span className="text-gray-200">/</span>
            <span className="font-bold text-gray-900">Quick Quiz</span>
          </div>

          {/* Topic mastery overview */}
          {existingMastery.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Your topic progress</h2>
              <div className="flex flex-wrap gap-2">
                {existingMastery.map((m) => (
                  <span key={m.topic} className={`text-xs px-2 py-1 rounded-full font-medium ${MASTERY_COLORS[m.mastery_level]}`}>
                    {m.topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Start a Quiz</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose a topic</label>
              <div className="grid grid-cols-2 gap-2">
                {topics.map((t) => {
                  const m = masteryMap[t]
                  return (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`text-left p-3 rounded-lg border text-sm transition ${
                        topic === t
                          ? 'border-green-500 bg-green-50 text-green-800 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>{t}</span>
                      {m && (
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${MASTERY_COLORS[m]}`}>
                          {m}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="flex gap-3">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition ${
                      difficulty === d
                        ? d === 'easy' ? 'border-green-500 bg-green-50 text-green-700'
                          : d === 'medium' ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={!topic}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
            >
              Start Quiz (5 questions)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LOADING PHASE
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Generating your ZIMSEC quiz…</p>
          <p className="text-sm text-gray-400 mt-1">{topic} · {difficulty}</p>
        </div>
      </div>
    )
  }

  // RESULTS PHASE
  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    const masteryLabel = newMastery?.replace('_', ' ') ?? ''
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
          {/* Score card */}
          <div className={`rounded-2xl p-6 text-center text-white ${pct >= 85 ? 'bg-green-600' : pct >= 65 ? 'bg-blue-600' : pct >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`}>
            <p className="text-5xl font-bold">{pct}%</p>
            <p className="mt-2 text-lg font-medium">{score}/{questions.length} correct</p>
            {newMastery && <p className="mt-1 text-sm opacity-90 capitalize">Topic mastery: {masteryLabel}</p>}
            <p className="mt-1 text-sm opacity-80">+{xpEarned} XP earned</p>
          </div>

          {/* Question review */}
          <div className="space-y-3">
            {questions.map((q, i) => {
              const wasCorrect = answers[i]?.correct
              return (
                <div key={i} className={`bg-white rounded-xl border p-4 ${wasCorrect ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${wasCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {wasCorrect ? '✓' : '✗'}
                    </span>
                    <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  </div>
                  {!wasCorrect && (
                    <p className="text-xs text-gray-500 ml-7">
                      You answered: <span className="text-red-600">{answers[i]?.selected}</span> · Correct: <span className="text-green-600">{q.correct}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 ml-7 mt-1 italic">{q.explanation}</p>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('setup'); setTopic(''); }}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Try another topic
            </button>
            <button
              onClick={() => { setPhase('setup') }}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
            >
              Retry this topic
            </button>
          </div>

          <Link href={`/student/subjects/${subject.code}`} className="block text-center text-sm text-gray-500 hover:text-gray-700">
            Back to {subject.name}
          </Link>
        </div>
      </div>
    )
  }

  // QUIZ PHASE
  const q = questions[currentQ]
  const isLast = currentQ === questions.length - 1
  const isCorrect = selected === q.correct

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-400">{subject.name} · {topic}</p>
          <p className="text-sm font-semibold text-gray-900">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-6 h-2 rounded-full transition-colors ${i < currentQ ? (answers[i]?.correct ? 'bg-green-400' : 'bg-red-400') : i === currentQ ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-base font-medium text-gray-900 leading-relaxed">{q.question}</p>
        </div>

        <div className="space-y-3">
          {q.options.map((opt) => {
            const letter = opt.charAt(0)
            let style = 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
            if (selected) {
              if (letter === q.correct) style = 'border-green-500 bg-green-50 text-green-800'
              else if (letter === selected) style = 'border-red-500 bg-red-50 text-red-800'
              else style = 'border-gray-100 bg-gray-50 text-gray-400'
            }
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {showExplanation && (
          <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '✓ Correct!' : `✗ Incorrect — Answer: ${q.correct}`}
            </p>
            <p className="text-sm text-gray-700">{q.explanation}</p>
          </div>
        )}

        {selected && (
          <button
            onClick={handleNext}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
          >
            {isLast ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}
