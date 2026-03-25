'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Loader2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

type Subject = { id: string; name: string; code: string; zimsec_level: string }
type Question = {
  id: string
  topic: string | null
  question: string
  question_type: string
  marks: number
  difficulty: string
  answer: string | null
  options: { label: string; text: string; correct: boolean }[] | null
  subject_id: string | null
  zimsec_level: string | null
}

const typeLabels: Record<string, string> = {
  short_answer: 'Short Answer',
  mcq: 'Multiple Choice',
  essay: 'Essay',
  structured: 'Structured',
}

const diffColors: Record<string, string> = {
  easy: 'bg-green-50 text-green-700',
  medium: 'bg-amber-50 text-amber-700',
  hard: 'bg-red-50 text-red-700',
}

const levelLabels: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // New question form
  const [nType, setNType] = useState('short_answer')
  const [nSubject, setNSubject] = useState('')
  const [nTopic, setNTopic] = useState('')
  const [nQuestion, setNQuestion] = useState('')
  const [nAnswer, setNAnswer] = useState('')
  const [nMarks, setNMarks] = useState(2)
  const [nDifficulty, setNDifficulty] = useState('medium')
  const [nLevel, setNLevel] = useState('')
  const [nOptions, setNOptions] = useState([
    { label: 'A', text: '', correct: false },
    { label: 'B', text: '', correct: false },
    { label: 'C', text: '', correct: false },
    { label: 'D', text: '', correct: false },
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then(r => r.json()),
      fetch('/api/teacher/question-bank').then(r => r.json()),
    ]).then(([sd, qd]) => {
      setSubjects(sd.subjects ?? [])
      setQuestions(qd.questions ?? [])
      setLoading(false)
    })
  }, [])

  async function addQuestion() {
    if (!nQuestion.trim()) return
    setSaving(true)
    const body: Record<string, unknown> = {
      question: nQuestion,
      question_type: nType,
      topic: nTopic || null,
      subject_id: nSubject || null,
      marks: nMarks,
      difficulty: nDifficulty,
      answer: nAnswer || null,
      zimsec_level: nLevel || null,
      options: nType === 'mcq' ? nOptions : null,
    }
    const res = await fetch('/api/teacher/question-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.question) {
      setQuestions(prev => [data.question, ...prev])
      setNQuestion(''); setNAnswer(''); setNTopic(''); setNSubject(''); setNLevel('')
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function deleteQuestion(id: string) {
    setDeleting(id)
    await fetch(`/api/teacher/question-bank?id=${id}`, { method: 'DELETE' })
    setQuestions(prev => prev.filter(q => q.id !== id))
    setDeleting(null)
  }

  const filtered = questions.filter(q => {
    if (filterSubject && q.subject_id !== filterSubject) return false
    if (filterDiff && q.difficulty !== filterDiff) return false
    return true
  })

  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]))

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle size={22} className="text-blue-500" />
              Question Bank
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus size={16} /> Add Question
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filterDiff}
            onChange={e => setFilterDiff(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {(filterSubject || filterDiff) && (
            <button onClick={() => { setFilterSubject(''); setFilterDiff('') }} className="text-xs text-gray-400 hover:text-gray-700 transition">Clear filters</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HelpCircle size={24} className="text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">No questions yet</p>
            <p className="text-sm text-gray-400 mt-1">Add questions to build your bank for tests and assessments</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{typeLabels[q.question_type] ?? q.question_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffColors[q.difficulty] ?? 'bg-gray-50 text-gray-500'}`}>{q.difficulty}</span>
                      <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      {q.topic && <span className="text-xs text-gray-400">· {q.topic}</span>}
                      {q.subject_id && subjectById[q.subject_id] && (
                        <span className="text-xs text-gray-400">· {subjectById[q.subject_id].name}</span>
                      )}
                      {q.zimsec_level && <span className="text-xs text-purple-400">· {levelLabels[q.zimsec_level] ?? q.zimsec_level}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); deleteQuestion(q.id) }}
                      disabled={deleting === q.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      {deleting === q.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                    {expandedId === q.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {expandedId === q.id && (
                  <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    {q.question_type === 'mcq' && q.options && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Options:</p>
                        <div className="space-y-1">
                          {q.options.map(opt => (
                            <div key={opt.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${opt.correct ? 'bg-green-50 text-green-800' : 'text-gray-600'}`}>
                              <span className="font-bold text-xs w-5">{opt.label}</span>
                              <span>{opt.text}</span>
                              {opt.correct && <span className="ml-auto text-green-600 text-xs font-semibold">✓ Correct</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {q.answer && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Model Answer:</p>
                        <p className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg">{q.answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Add Question</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select value={nType} onChange={e => setNType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="short_answer">Short Answer</option>
                    <option value="mcq">MCQ</option>
                    <option value="essay">Essay</option>
                    <option value="structured">Structured</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
                  <select value={nDifficulty} onChange={e => setNDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                  <select value={nSubject} onChange={e => setNSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Optional —</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ZIMSEC Level</label>
                  <select value={nLevel} onChange={e => setNLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">— Any —</option>
                    <option value="primary">Primary</option>
                    <option value="olevel">O-Level</option>
                    <option value="alevel">A-Level</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Topic</label>
                  <input value={nTopic} onChange={e => setNTopic(e.target.value)} placeholder="e.g. Photosynthesis"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Marks</label>
                  <input type="number" value={nMarks} min={1} max={50} onChange={e => setNMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Question *</label>
                <textarea value={nQuestion} onChange={e => setNQuestion(e.target.value)} required rows={4}
                  placeholder="Write the full question here…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              {nType === 'mcq' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Options (tick the correct answer)</label>
                  <div className="space-y-2">
                    {nOptions.map((opt, i) => (
                      <div key={opt.label} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 w-5">{opt.label}</span>
                        <input
                          value={opt.text}
                          onChange={e => {
                            const updated = [...nOptions]
                            updated[i] = { ...updated[i], text: e.target.value }
                            setNOptions(updated)
                          }}
                          placeholder={`Option ${opt.label}`}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="checkbox"
                          checked={opt.correct}
                          onChange={e => {
                            const updated = nOptions.map((o, j) => ({ ...o, correct: j === i ? e.target.checked : false }))
                            setNOptions(updated)
                          }}
                          className="w-4 h-4 accent-green-600"
                          title="Mark as correct"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Model Answer <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={nAnswer} onChange={e => setNAnswer(e.target.value)} rows={3}
                  placeholder="Expected answer or marking guide…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={addQuestion}
                  disabled={saving || !nQuestion.trim()}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Add Question'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
