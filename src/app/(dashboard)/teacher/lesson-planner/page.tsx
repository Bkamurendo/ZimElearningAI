'use client'

import { useState } from 'react'
import { Loader2, BookOpen, Download, RefreshCw } from 'lucide-react'

type LessonPlan = {
  subject: string
  topic: string
  grade: string
  duration: string
  objectives: string[]
  resources: string[]
  phases: {
    name: string
    duration: string
    teacherActivity: string
    studentActivity: string
    assessment: string
  }[]
  boardWork: string
  homework: string
  differentiation: string
  crossCurricular: string
}

const gradeOptions = [
  { group: 'Primary', options: ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'] },
  { group: 'O-Level', options: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
  { group: 'A-Level', options: ['Lower 6', 'Upper 6'] },
]

export default function LessonPlannerPage() {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('')
  const [duration, setDuration] = useState('40')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<LessonPlan | null>(null)
  const [error, setError] = useState('')

  async function generatePlan() {
    if (!subject.trim() || !topic.trim() || !grade) return
    setGenerating(true)
    setError('')
    setPlan(null)
    try {
      const res = await fetch('/api/teacher/lesson-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, grade, duration, context }),
      })
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
      } else {
        setError(data.error ?? 'Failed to generate lesson plan')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setGenerating(false)
  }

  function printPlan() {
    window.print()
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={22} className="text-teal-500" />
            ZIMSEC Lesson Planner
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-generated lesson plans using the Zimbabwean 5-phase curriculum model</p>
        </div>

        {/* Input form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Science, English"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Unit *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Quadratic Equations"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Form *</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                <option value="">— Select grade —</option>
                {gradeOptions.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Duration (minutes)</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                <option value="35">35 minutes</option>
                <option value="40">40 minutes</option>
                <option value="45">45 minutes</option>
                <option value="70">70 minutes (double)</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={2}
              placeholder="e.g. Students have already covered basic plant biology. School has no projector. Class size is 35."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none" />
          </div>
          <button
            onClick={generatePlan}
            disabled={generating || !subject.trim() || !topic.trim() || !grade}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating ZIMSEC lesson plan…</>
            ) : (
              <><BookOpen size={16} /> Generate Lesson Plan</>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {/* Generated lesson plan */}
        {plan && (
          <div id="lesson-plan-print" className="space-y-4">
            {/* Plan header */}
            <div className="bg-teal-600 text-white rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider mb-1">ZIMSEC Lesson Plan</p>
                  <h2 className="text-xl font-bold">{plan.topic}</h2>
                  <p className="text-teal-100 mt-1">{plan.subject} · {plan.grade} · {plan.duration}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={printPlan} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition">
                    <Download size={14} /> Print
                  </button>
                  <button onClick={generatePlan} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                    <RefreshCw size={14} /> Regenerate
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Objectives */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">🎯 Learning Objectives</h3>
                <ul className="space-y-1.5">
                  {plan.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-teal-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">📦 Teaching Resources</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {plan.resources.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5-Phase lesson body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">📋 Lesson Phases (5-Phase Zimbabwe Model)</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {plan.phases.map((phase, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{phase.name}</p>
                        <p className="text-xs text-gray-400">{phase.duration}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Teacher Activity</p>
                        <p className="text-gray-700 text-xs leading-relaxed">{phase.teacherActivity}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-600 mb-1">Student Activity</p>
                        <p className="text-gray-700 text-xs leading-relaxed">{phase.studentActivity}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-1">Assessment</p>
                        <p className="text-gray-700 text-xs leading-relaxed">{phase.assessment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">🖊 Board Work</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{plan.boardWork}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">📚 Homework / Follow-up</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{plan.homework}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">🎯 Differentiation</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{plan.differentiation}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">🌐 Cross-Curricular Links</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{plan.crossCurricular}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
