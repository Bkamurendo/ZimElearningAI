'use client'

import { useEffect, useState, useTransition } from 'react'
import { CalendarCheck, Plus, Trash2, Loader2, BookOpen, Clock, FileText, AlertCircle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Subject = { id: string; name: string; code: string }
type Exam = {
  id: string
  exam_date: string
  paper_number: string
  start_time: string | null
  duration_minutes: number
  notes: string | null
  subject: { id: string; name: string; code: string } | null
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function countdownChip(days: number) {
  if (days <= 0) return { label: 'Today!', cls: 'bg-red-100 text-red-700 border-red-200' }
  if (days <= 7) return { label: `${days}d left`, cls: 'bg-red-100 text-red-700 border-red-200' }
  if (days <= 14) return { label: `${days}d left`, cls: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: `${days}d left`, cls: 'bg-green-100 text-green-700 border-green-200' }
}

export default function ExamTimetablePage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ subject_id: '', exam_date: '', paper_number: '1', start_time: '', duration_minutes: '150', notes: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [, startTransition] = useTransition()

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/student/exam-timetable').then(r => r.json()),
      fetch('/api/student/subjects').then(r => r.json()),
    ]).then(([examData, subjectData]) => {
      setExams(examData.exams ?? [])
      setSubjects(subjectData.subjects ?? [])
      setLoading(false)
    })
  }, [])

  async function addExam() {
    if (!form.subject_id || !form.exam_date) return
    setSaving(true)
    const res = await fetch('/api/student/exam-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: form.subject_id,
        exam_date: form.exam_date,
        paper_number: form.paper_number,
        start_time: form.start_time || null,
        duration_minutes: parseInt(form.duration_minutes) || 150,
        notes: form.notes || null,
      }),
    })
    const data = await res.json()
    if (data.exam) {
      setExams(prev => [...prev, data.exam].sort((a, b) => a.exam_date.localeCompare(b.exam_date)))
      setShowModal(false)
      setForm({ subject_id: '', exam_date: '', paper_number: '1', start_time: '', duration_minutes: '150', notes: '' })
      showToast('Exam added to your timetable ✓')
    } else {
      showToast(data.error ?? 'Failed to add exam', false)
    }
    setSaving(false)
  }

  async function deleteExam(id: string) {
    setDeletingId(id)
    await fetch(`/api/student/exam-timetable?id=${id}`, { method: 'DELETE' })
    setExams(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  async function generateMockExam(exam: Exam) {
    if (!exam.subject) return
    setGeneratingId(`mock-${exam.id}`)
    const res = await fetch('/api/ai-teacher/generate-mock-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: exam.subject.id, paper_number: exam.paper_number }),
    })
    const data = await res.json()
    setGeneratingId(null)
    if (data.test_id) {
      showToast(`Mock exam "${data.title}" generated! ✓`)
      startTransition(() => router.push('/student/ai-workspace'))
    } else {
      showToast(data.error ?? 'Failed to generate', false)
    }
  }

  async function generateRevision(exam: Exam) {
    if (!exam.subject) return
    setGeneratingId(`rev-${exam.id}`)
    const res = await fetch('/api/ai-teacher/generate-revision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: exam.subject.id,
        topics: [exam.subject.name],
        revision_type: 'common_questions',
      }),
    })
    const data = await res.json()
    setGeneratingId(null)
    if (data.note_id) {
      showToast(`Revision sheet for ${exam.subject.name} generated! ✓`)
      startTransition(() => router.push('/student/notes'))
    } else {
      showToast(data.error ?? 'Failed to generate', false)
    }
  }

  const paperLabel = (p: string) => ({ '1': 'Paper 1 — MCQ', '2': 'Paper 2 — Structured', '3': 'Paper 3 — Essay' }[p] ?? `Paper ${p}`)

  return (
    <div className="min-h-screen bg-gray-50/50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck size={24} className="text-teal-600" /> Exam Timetable
            </h1>
            <p className="text-sm text-gray-500 mt-1">Add your ZIMSEC exam dates and MaFundi will prepare you</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition text-sm"
          >
            <Plus size={16} /> Add Exam
          </button>
        </div>

        {/* Exam list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarCheck size={26} className="text-teal-600" />
            </div>
            <p className="font-semibold text-gray-700 text-base mb-1">No exams added yet</p>
            <p className="text-sm text-gray-400 mb-5">Add your ZIMSEC exam timetable so MaFundi can prepare personalised revision and mock exams for you.</p>
            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition text-sm">
              + Add First Exam
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map(exam => {
              const subj = exam.subject as unknown as { id: string; name: string; code: string } | null
              const days = daysUntil(exam.exam_date)
              const chip = countdownChip(days)
              const isGenMock = generatingId === `mock-${exam.id}`
              const isGenRev = generatingId === `rev-${exam.id}`
              return (
                <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{subj?.name ?? 'Unknown Subject'}</p>
                        <p className="text-sm text-gray-500">{paperLabel(exam.paper_number)}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-gray-600 font-medium">
                            📅 {new Date(exam.exam_date).toLocaleDateString('en-ZW', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {exam.start_time && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={11} /> {exam.start_time}
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${chip.cls}`}>{chip.label}</span>
                        </div>
                        {exam.notes && <p className="text-xs text-gray-400 mt-1">{exam.notes}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteExam(exam.id)} disabled={!!deletingId} className="p-1.5 text-gray-300 hover:text-red-500 transition flex-shrink-0">
                      {deletingId === exam.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => generateRevision(exam)}
                      disabled={!!generatingId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition border border-emerald-200 disabled:opacity-60"
                    >
                      {isGenRev ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      Generate Revision Sheet
                    </button>
                    <button
                      onClick={() => generateMockExam(exam)}
                      disabled={!!generatingId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition border border-purple-200 disabled:opacity-60"
                    >
                      {isGenMock ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Generate Mock Exam
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add exam modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Exam</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject *</label>
                <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Exam Date *</label>
                  <input type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Paper Number</label>
                  <select value={form.paper_number} onChange={e => setForm(f => ({ ...f, paper_number: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400">
                    <option value="1">Paper 1 — MCQ</option>
                    <option value="2">Paper 2 — Structured</option>
                    <option value="3">Paper 3 — Essay</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Duration (mins)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Venue: Borrowdale Primary School"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              </div>
            </div>

            {(!form.subject_id || !form.exam_date) && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> Subject and exam date are required
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={addExam} disabled={saving || !form.subject_id || !form.exam_date}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Add Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
