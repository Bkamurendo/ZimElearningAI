'use client'

import { useState } from 'react'
import Link from 'next/link'

type Subject = { id: string; name: string; code: string; zimsec_level: string }

type Prediction = {
  predictedGrade: string
  confidence: 'high' | 'medium' | 'low'
  predictedPercentage: number
  reasoning: string
  strengths: string[]
  improvements: string[]
  gradeToAchieve: { A: string; B: string; C: string }
  examReadiness: number
}

const GRADE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-green-600',  text: 'text-white', ring: 'ring-green-300' },
  B: { bg: 'bg-blue-600',   text: 'text-white', ring: 'ring-blue-300'  },
  C: { bg: 'bg-yellow-500', text: 'text-white', ring: 'ring-yellow-300' },
  D: { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-300' },
  E: { bg: 'bg-red-500',    text: 'text-white', ring: 'ring-red-300'   },
  U: { bg: 'bg-gray-500',   text: 'text-white', ring: 'ring-gray-300'  },
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '🟢 High confidence',
  medium: '🟡 Medium confidence',
  low: '🔴 Low confidence (more quizzes needed)',
}

export default function GradePredictorClient({
  studentId,
  subjects,
  attemptCounts,
}: {
  studentId: string
  subjects: Subject[]
  attemptCounts: Record<string, number>
}) {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function predict(subject: Subject) {
    setLoading((prev) => ({ ...prev, [subject.id]: true }))
    setErrors((prev) => ({ ...prev, [subject.id]: '' }))

    try {
      const res = await fetch('/api/grade-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          subjectId: subject.id,
          subjectName: subject.name,
          level: subject.zimsec_level,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setErrors((prev) => ({ ...prev, [subject.id]: data.error }))
      } else {
        setPredictions((prev) => ({ ...prev, [subject.id]: data }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, [subject.id]: 'Failed to generate prediction.' }))
    } finally {
      setLoading((prev) => ({ ...prev, [subject.id]: false }))
    }
  }

  const levelLabel = (level: string) =>
    level === 'olevel' ? 'O-Level' : level === 'alevel' ? 'A-Level' : 'Primary'

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grade Predictor</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered ZIMSEC exam grade forecast</p>
        </div>

        {/* Explainer */}
        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-5 sm:p-6 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h2 className="text-base font-bold mb-1.5">Predict your ZIMSEC grade</h2>
            <p className="text-sm opacity-90 leading-relaxed">
              Based on your quiz scores, topic mastery, and learning trajectory, our AI predicts your likely ZIMSEC exam grade and gives you a personalised action plan to improve it.
            </p>
            <p className="text-xs opacity-60 mt-2">
              Accuracy improves with more quiz attempts. Aim for at least 5 quizzes per subject.
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center shadow-sm">
            <p className="text-gray-500">No subjects enrolled yet.</p>
            <Link href="/student/dashboard" className="text-sm text-indigo-600 hover:underline mt-2 block">
              Back to dashboard
            </Link>
          </div>
        ) : (
          subjects.map((subject) => {
            const attempts = attemptCounts[subject.id] ?? 0
            const prediction = predictions[subject.id]
            const isLoading = loading[subject.id]
            const error = errors[subject.id]
            const gradeStyle = prediction ? (GRADE_STYLES[prediction.predictedGrade] ?? GRADE_STYLES.U) : null

            return (
              <div key={subject.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Subject header */}
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-50">
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-xs text-gray-400">ZIMSEC {levelLabel(subject.zimsec_level)} · {attempts} quiz attempt{attempts !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => predict(subject)}
                    disabled={isLoading || attempts === 0}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Predicting…
                      </span>
                    ) : prediction ? 'Re-predict' : attempts === 0 ? 'No data yet' : 'Predict Grade'}
                  </button>
                </div>

                {/* No data message */}
                {attempts === 0 && (
                  <div className="px-6 py-4 text-sm text-gray-400 italic">
                    Complete at least one quiz in {subject.name} to generate a prediction.{' '}
                    <Link href={`/student/quiz/${subject.code}`} className="text-violet-600 hover:underline not-italic">
                      Take a quiz →
                    </Link>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  </div>
                )}

                {/* Prediction result */}
                {prediction && !isLoading && gradeStyle && (
                  <div className="p-6 space-y-5">
                    {/* Grade + readiness */}
                    <div className="flex items-center gap-5">
                      <div className={`w-20 h-20 rounded-2xl ${gradeStyle.bg} ${gradeStyle.text} flex flex-col items-center justify-center ring-4 ${gradeStyle.ring} flex-shrink-0`}>
                        <span className="text-3xl font-bold">{prediction.predictedGrade}</span>
                        <span className="text-xs opacity-80">{prediction.predictedPercentage}%</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">{CONFIDENCE_LABEL[prediction.confidence]}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{prediction.reasoning}</p>
                      </div>
                    </div>

                    {/* Exam readiness bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-gray-600">Exam Readiness</p>
                        <p className="text-xs font-bold text-gray-700">{prediction.examReadiness}%</p>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${prediction.examReadiness >= 75 ? 'bg-green-500' : prediction.examReadiness >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${prediction.examReadiness}%` }}
                        />
                      </div>
                    </div>

                    {/* Strengths & improvements */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-2">✓ Strengths</p>
                        <ul className="space-y-1">
                          {prediction.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                              <span className="text-green-500 flex-shrink-0">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-700 mb-2">⚡ To improve</p>
                        <ul className="space-y-1">
                          {prediction.improvements.map((s, i) => (
                            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                              <span className="text-orange-400 flex-shrink-0">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Grade targets */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">What you need to achieve each grade:</p>
                      {[
                        { grade: 'A', style: 'text-green-700 bg-green-100', text: prediction.gradeToAchieve.A },
                        { grade: 'B', style: 'text-blue-700 bg-blue-100',  text: prediction.gradeToAchieve.B },
                        { grade: 'C', style: 'text-yellow-700 bg-yellow-100', text: prediction.gradeToAchieve.C },
                      ].map(({ grade, style, text }) => (
                        <div key={grade} className="flex gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${style}`}>{grade}</span>
                          <p className="text-xs text-gray-600">{text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Quick links */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href={`/student/quiz/${subject.code}`}
                        className="flex-1 min-w-[120px] text-center py-2 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition"
                      >
                        Practice Quiz
                      </Link>
                      <Link
                        href={`/student/past-papers/${subject.code}`}
                        className="flex-1 min-w-[120px] text-center py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                      >
                        Past Papers
                      </Link>
                      <Link
                        href={`/student/ai-tutor/${subject.code}`}
                        className="flex-1 min-w-[120px] text-center py-2 text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                      >
                        AI Tutor
                      </Link>
                    </div>

                    {/* Premium Report CTA */}
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-xl">📄</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Comprehensive AI Performance Report</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">10-page deep-dive analysis, predicted grade, and custom 4-week study plan.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Redirect to checkout for ai_grade_report
                            window.location.href = `/student/upgrade?plan=ai_grade_report&subject=${subject.id}`
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition shadow-md shadow-indigo-100"
                        >
                          Get for $2
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
