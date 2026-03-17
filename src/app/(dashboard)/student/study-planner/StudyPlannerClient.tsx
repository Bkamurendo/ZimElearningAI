'use client'

import { useState } from 'react'

type Subject = { name: string; code: string }
type DayTask = { subject: string; topic: string; duration: string; type: string }
type DayPlan = { day: string; tasks: DayTask[] }
type WeekPlan = { week: number; theme: string; days: DayPlan[] }
type Plan = { summary: string; weeks: WeekPlan[]; tips: string[] }

const TYPE_COLORS: Record<string, string> = {
  learn: 'bg-blue-100 text-blue-700',
  practice: 'bg-green-100 text-green-700',
  review: 'bg-purple-100 text-purple-700',
}

export default function StudyPlannerClient({
  subjects,
  weakTopics,
  level,
  existingPlan,
}: {
  subjects: Subject[]
  weakTopics: string[]
  level: string
  existingPlan: { exam_date: string | null; plan_data: Record<string, unknown>; updated_at: string } | null
}) {
  const [examDate, setExamDate] = useState(existingPlan?.exam_date ?? '')
  const [plan, setPlan] = useState<Plan | null>(existingPlan ? (existingPlan.plan_data as Plan) : null)
  const [loading, setLoading] = useState(false)
  const [activeWeek, setActiveWeek] = useState(0)

  const [genError, setGenError] = useState('')

  async function generatePlan() {
    setLoading(true)
    setGenError('')
    try {
      const res = await fetch('/api/study-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          subjects: subjects.map((s) => s.name),
          weakTopics,
          level,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenError(data.error ?? 'Failed to generate plan. Please try again.')
        return
      }
      setPlan(data.plan)
      setActiveWeek(0)
    } catch {
      setGenError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-generated ZIMSEC revision schedule</p>
        </div>

        {/* Setup card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">Generate Your Study Plan</h2>

          {weakTopics.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">⚠ Weak topics detected — these will be prioritised:</p>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t) => (
                  <span key={t} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam date (optional)</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
            </div>
            {daysUntilExam !== null && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-center">
                <p className="text-2xl font-bold text-green-700">{daysUntilExam}</p>
                <p className="text-xs text-green-600">days left</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">
              Subjects: {subjects.map((s) => s.name).join(', ') || 'No subjects enrolled'}
            </p>
          </div>

          <button
            onClick={generatePlan}
            disabled={loading || subjects.length === 0}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating your plan…
              </span>
            ) : plan ? 'Regenerate Plan' : 'Generate Study Plan'}
          </button>

          {genError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{genError}</p>
            </div>
          )}
        </div>

        {/* Plan display */}
        {plan && (
          <>
            {/* Summary */}
            <div className="bg-green-600 text-white rounded-2xl p-5">
              <h2 className="font-semibold mb-1">Your Plan</h2>
              <p className="text-sm opacity-90">{plan.summary}</p>
            </div>

            {/* Week tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plan.weeks.map((w, i) => (
                <button
                  key={i}
                  onClick={() => setActiveWeek(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeWeek === i
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Week {w.week}
                </button>
              ))}
            </div>

            {/* Active week */}
            {plan.weeks[activeWeek] && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">{plan.weeks[activeWeek].theme}</h3>
                {plan.weeks[activeWeek].days.map((day) => (
                  <div key={day.day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700">{day.day}</p>
                    </div>
                    {day.tasks.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400 italic">Rest day</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {day.tasks.map((task, j) => (
                          <div key={j} className="flex items-center gap-3 px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {task.type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{task.subject}</p>
                              <p className="text-xs text-gray-500 truncate">{task.topic}</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{task.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ZIMSEC Tips */}
            {plan.tips && plan.tips.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">ZIMSEC Exam Tips</h3>
                <ul className="space-y-1">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-blue-700 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
