'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, X, BookOpen, CalendarCheck, Bot, Sparkles } from 'lucide-react'

interface ChecklistProps {
  hasSubjects: boolean
  hasExamDates: boolean
  hasUsedMaFundi: boolean
}

interface Step {
  id: string
  label: string
  description: string
  href: string
  icon: React.ElementType
  done: boolean
}

export default function GettingStartedChecklist({ hasSubjects, hasExamDates, hasUsedMaFundi }: ChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  // Persist dismissal in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('checklist-dismissed') === 'true') {
      setDismissed(true)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('checklist-dismissed', 'true')
  }

  const steps: Step[] = [
    {
      id: 'subjects',
      label: 'Pick your ZIMSEC subjects',
      description: 'Select which subjects you are studying so we can personalise your learning.',
      href: '/student/subjects',
      icon: BookOpen,
      done: hasSubjects,
    },
    {
      id: 'exams',
      label: 'Add your exam dates',
      description: 'Sync your ZIMSEC timetable so we can create countdown reminders.',
      href: '/student/exam-timetable',
      icon: CalendarCheck,
      done: hasExamDates,
    },
    {
      id: 'mafundi',
      label: 'Ask MaFundi a question',
      description: 'Try your AI tutor — ask anything about your syllabus.',
      href: '/student/ai-teacher',
      icon: Bot,
      done: hasUsedMaFundi,
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  // Don't show if dismissed or all steps complete
  if (dismissed || allDone) return null

  const pct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="relative rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 sm:p-6 shadow-sm">
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-slate-800 transition"
        aria-label="Dismiss checklist"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Get started with ZimLearn</h2>
          <p className="text-xs text-slate-500">{completedCount} of {steps.length} complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <Link
            key={step.id}
            href={step.done ? '#' : step.href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              step.done
                ? 'bg-emerald-100/50 dark:bg-emerald-900/20 opacity-60'
                : 'bg-white dark:bg-slate-800 hover:ring-2 hover:ring-emerald-400 shadow-sm'
            }`}
          >
            {step.done ? (
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle size={20} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
            )}
            <step.icon size={16} className={step.done ? 'text-emerald-400' : 'text-slate-400'} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-slate-500 leading-snug">{step.description}</p>
              )}
            </div>
            {!step.done && <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
