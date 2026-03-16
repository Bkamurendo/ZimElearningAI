'use client'

import { useState } from 'react'
import { completeStudentOnboarding } from '@/app/actions/onboarding'
import type { Subject, ZimsecLevel } from '@/types/database'

const LEVELS: { value: ZimsecLevel; label: string; grades: string[] }[] = [
  {
    value: 'primary',
    label: 'Primary (ECD – Grade 7)',
    grades: ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
  },
  {
    value: 'olevel',
    label: 'O-Level (Form 1 – 4)',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  },
  {
    value: 'alevel',
    label: 'A-Level (Lower 6 / Upper 6)',
    grades: ['Lower 6', 'Upper 6'],
  },
]

interface Props {
  fullName: string
  subjects: Subject[]
}

export default function StudentOnboarding({ fullName, subjects }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [level, setLevel] = useState<ZimsecLevel | null>(null)
  const [grade, setGrade] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  const filteredSubjects = subjects.filter((s) => s.zimsec_level === level)
  const selectedLevel = LEVELS.find((l) => l.value === level)

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s <= step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 2 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? `Welcome, ${fullName || 'Student'}!` : 'Choose your subjects'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 1
              ? 'Select your ZIMSEC level and grade to get started.'
              : `${selectedLevel?.label} — select the subjects you study.`}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">ZIMSEC Level</p>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <label
                    key={l.value}
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                      level === l.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={l.value}
                      checked={level === l.value}
                      onChange={() => {
                        setLevel(l.value)
                        setGrade('')
                        setSelectedSubjects([])
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        level === l.value ? 'border-green-600 bg-green-600' : 'border-gray-400'
                      }`}
                    />
                    <span className="font-medium text-gray-900">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {level && (
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade / Form
                </label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">Select grade...</option>
                  {selectedLevel?.grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!level || !grade}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              Next: Choose subjects
            </button>
          </div>
        )}

        {step === 2 && (
          <form action={completeStudentOnboarding as unknown as (formData: FormData) => void}>
            <input type="hidden" name="zimsec_level" value={level ?? ''} />
            <input type="hidden" name="grade" value={grade} />

            <div className="grid grid-cols-2 gap-2 mb-6">
              {filteredSubjects.map((subject) => {
                const checked = selectedSubjects.includes(subject.id)
                return (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                      checked
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="subject_ids"
                      value={subject.id}
                      checked={checked}
                      onChange={() => toggleSubject(subject.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                        checked ? 'border-green-600 bg-green-600' : 'border-gray-400'
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-800">{subject.name}</span>
                  </label>
                )
              })}
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={selectedSubjects.length === 0}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                Start learning
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
