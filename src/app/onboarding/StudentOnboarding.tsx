'use client'

import { useState } from 'react'
import { completeStudentOnboarding } from '@/app/actions/onboarding'
import type { Subject, ZimsecLevel } from '@/types/database'
import { GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react'

const LEVELS: { value: ZimsecLevel; label: string; sublabel: string; grades: string[]; gradient: string; emoji: string }[] = [
  {
    value: 'primary',
    label: 'Primary',
    sublabel: 'ECD – Grade 7',
    grades: ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '🌱',
  },
  {
    value: 'olevel',
    label: 'O-Level',
    sublabel: 'Form 1 – 4',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    gradient: 'from-blue-500 to-indigo-600',
    emoji: '📚',
  },
  {
    value: 'alevel',
    label: 'A-Level',
    sublabel: 'Lower 6 / Upper 6',
    grades: ['Lower 6', 'Upper 6'],
    gradient: 'from-purple-500 to-violet-600',
    emoji: '🎓',
  },
]

interface Props {
  fullName: string
  subjects: Subject[]
  error?: string
}

export default function StudentOnboarding({ fullName, subjects, error }: Props) {
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5, #f0f9ff)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-xl tracking-tight">ZimLearn</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
              {error}
            </div>
          )}

          {/* Animated step progress bar */}
          <div className="mb-8">
            <div className="flex items-center gap-0 mb-5">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm ${
                    s < step
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200'
                      : s === step
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 scale-110'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s < step ? <CheckCircle2 size={18} /> : s}
                  </div>
                  {s < 2 && (
                    <div className="flex-1 h-1.5 mx-2 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: step > s ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === 1 ? `Welcome, ${fullName || 'Student'}! 👋` : 'Choose your subjects'}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {step === 1
                  ? 'Select your ZIMSEC level and grade to personalise your experience.'
                  : `${selectedLevel?.label} — select the subjects you study.`}
              </p>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">ZIMSEC Level</p>
                <div className="space-y-2.5">
                  {LEVELS.map((l) => (
                    <label
                      key={l.value}
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-150 ${
                        level === l.value
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
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
                      {/* Gradient icon */}
                      <div className={`w-12 h-12 bg-gradient-to-br ${l.gradient} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                        {l.emoji}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 text-base">{l.label}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{l.sublabel}</p>
                      </div>
                      {/* Custom radio indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        level === l.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {level === l.value && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {level && (
                <div>
                  <label htmlFor="grade" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Grade / Form
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-gray-50 hover:border-gray-200 transition"
                  >
                    <option value="">Select grade...</option>
                    {selectedLevel?.grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!level || !grade}
                className="w-full py-3.5 font-bold rounded-2xl transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01]"
                style={{ background: !level || !grade ? '#d1fae5' : 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                Next: Choose subjects →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form action={completeStudentOnboarding as unknown as (formData: FormData) => void}>
              <input type="hidden" name="zimsec_level" value={level ?? ''} />
              <input type="hidden" name="grade" value={grade} />

              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select subjects</p>
                {selectedSubjects.length > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                    {selectedSubjects.length} selected
                  </span>
                )}
              </div>

              {filteredSubjects.length === 0 ? (
                <div className="mb-6 px-4 py-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                  <p className="text-sm font-semibold text-amber-800 mb-1">No subjects available yet</p>
                  <p className="text-xs text-amber-700">Subjects for your level haven&apos;t been added yet. You can enrol in subjects from your dashboard later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {filteredSubjects.map((subject) => {
                    const checked = selectedSubjects.includes(subject.id)
                    return (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-3 p-3.5 border-2 rounded-2xl cursor-pointer transition-all duration-150 ${
                          checked
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
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
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 truncate block">{subject.name}</span>
                        </div>
                        {checked && <BookOpen size={13} className="text-emerald-500 flex-shrink-0" />}
                      </label>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 font-bold rounded-2xl transition text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={filteredSubjects.length > 0 && selectedSubjects.length === 0}
                  className="flex-1 py-3 font-bold rounded-2xl transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01]"
                  style={{ background: (filteredSubjects.length > 0 && selectedSubjects.length === 0) ? '#d1fae5' : 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  🚀 Start learning
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students
        </p>
      </div>
    </div>
  )
}
