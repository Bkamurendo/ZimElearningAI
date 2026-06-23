'use client'

import { useState, useEffect } from 'react'

type Subject = { name: string; code: string }
type DayTask = { subject: string; topic: string; duration: string; type: string }
type DayPlan = { day: string; tasks: DayTask[] }
type WeekPlan = { week: number; theme: string; days: DayPlan[] }
type Plan = { summary: string; weeks: WeekPlan[]; tips: string[] }

const TYPE_COLORS: Record<string, string> = {
  learn:    'bg-blue-100 text-blue-700 border border-blue-200',
  practice: 'bg-green-100 text-green-700 border border-green-200',
  review:   'bg-purple-100 text-purple-700 border border-purple-200',
}

const TYPE_ICONS: Record<string, string> = {
  learn: '📖',
  practice: '✏️',
  review: '🔁',
}

export default function StudyPlannerClient({
  subjects,
  weakTopics,
  level,
  existingPlan,
  isPaid = false,
}: {
  subjects: Subject[]
  weakTopics: string[]
  level: string
  existingPlan: { exam_date: string | null; plan_data: Record<string, unknown>; updated_at: string } | null
  isPaid?: boolean
}) {
  const [examDate, setExamDate] = useState(existingPlan?.exam_date ?? '')
  const [plan, setPlan] = useState<Plan | null>(existingPlan ? (existingPlan.plan_data as Plan) : null)
  const [loading, setLoading] = useState(false)
  const [activeWeek, setActiveWeek] = useState(0)
  const [genError, setGenError] = useState('')
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('study-plan-completed')
      if (stored) setCompleted(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  function toggleTask(key: string) {
    setCompleted(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem('study-plan-completed', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

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

        {/* Free tier notice */}
        {!isPaid && (
          <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm">
            <span className="text-indigo-700">
              <strong>Free plan:</strong> Generate 1 study plan. <a href="/student/upgrade" className="underline font-semibold">Upgrade</a> for unlimited regenerations &amp; advanced tips.
            </span>
          </div>
        )}

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
        {plan && (() => {
          const allTasks = plan.weeks.flatMap((w, wi) =>
            w.days.flatMap((d, di) => d.tasks.map((_, ti) => `${wi}-${di}-${ti}`))
          )
          const doneCount = allTasks.filter(k => completed[k]).length
          const totalCount = allTasks.length
          const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

          return (
            <>
              {/* Summary + progress */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-bold text-base mb-1">Your Study Plan</h2>
                    <p className="text-sm opacity-90 leading-relaxed">{plan.summary}</p>
                  </div>
                  <div className="flex-shrink-0 text-center bg-white/15 rounded-xl px-4 py-2">
                    <p className="text-2xl font-black">{overallPct}%</p>
                    <p className="text-xs opacity-80">done</p>
                  </div>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                </div>
                <p className="text-xs opacity-70 mt-1.5">{doneCount} of {totalCount} tasks completed</p>
              </div>

              {/* Week tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {plan.weeks.map((w, i) => {
                  const weekTasks = w.days.flatMap((d, di) => d.tasks.map((_, ti) => `${i}-${di}-${ti}`))
                  const weekDone = weekTasks.filter(k => completed[k]).length
                  const weekPct = weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 0
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveWeek(i)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                        activeWeek === i
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>Week {w.week}</span>
                      <div className={`h-1 w-full rounded-full overflow-hidden ${activeWeek === i ? 'bg-white/30' : 'bg-gray-100'}`}>
                        <div className={`h-full rounded-full ${activeWeek === i ? 'bg-white' : 'bg-green-500'}`} style={{ width: `${weekPct}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Active week */}
              {plan.weeks[activeWeek] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{plan.weeks[activeWeek].theme}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      Week {plan.weeks[activeWeek].week}
                    </span>
                  </div>
                  {plan.weeks[activeWeek].days.map((day, di) => {
                    const dayCompleted = day.tasks.filter((_, ti) => completed[`${activeWeek}-${di}-${ti}`]).length
                    return (
                      <div key={day.day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-800">{day.day}</p>
                          {day.tasks.length > 0 && (
                            <span className="text-xs text-gray-500">{dayCompleted}/{day.tasks.length} done</span>
                          )}
                        </div>
                        {day.tasks.length === 0 ? (
                          <div className="px-4 py-4 flex items-center gap-2 text-gray-400">
                            <span>😴</span>
                            <span className="text-sm italic">Rest day — recharge!</span>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {day.tasks.map((task, ti) => {
                              const taskKey = `${activeWeek}-${di}-${ti}`
                              const isDone = !!completed[taskKey]
                              return (
                                <button
                                  key={ti}
                                  onClick={() => toggleTask(taskKey)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${isDone ? 'opacity-60' : ''}`}
                                >
                                  <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                    {isDone && <span className="text-white text-xs font-black">✓</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-sm">{TYPE_ICONS[task.type] ?? '📌'}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                                      {task.type}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold text-gray-900 ${isDone ? 'line-through' : ''}`}>{task.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">{task.topic}</p>
                                  </div>
                                  <span className="text-xs text-gray-500 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{task.duration}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ZIMSEC Tips */}
              {plan.tips && plan.tips.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">💡 ZIMSEC Exam Tips</h3>
                  <ul className="space-y-2">
                    {plan.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-blue-800 flex gap-2 leading-relaxed">
                        <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
