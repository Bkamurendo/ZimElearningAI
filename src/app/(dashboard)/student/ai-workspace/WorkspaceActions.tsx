'use client'

import { useState } from 'react'
import { Loader2, BookOpen, FileText, ClipboardList, X, ChevronRight, Sparkles, Zap, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { AnimatedLessonPlayer, type LessonScript } from '@/components/AnimatedLessonPlayer'

type Subject = { id: string; name: string; code: string }
type WeakTopic = { topic: string; subject_id: string; subject_name: string; mastery_level: string }

interface Props {
  subjects: Subject[]
  weakTopics: WeakTopic[]
}

type ModalType = 'notes' | 'mock_exam' | 'revision' | 'video_lesson' | null

type Result =
  | { type: 'notes'; note_id: string; title: string }
  | { type: 'mock_exam'; note_id: string; title: string }
  | { type: 'revision'; note_id: string; title: string }

export default function WorkspaceActions({ subjects, weakTopics }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Notes form
  const [notesSubject, setNotesSubject] = useState('')
  const [notesTopic, setNotesTopic] = useState('')

  // Mock exam form
  const [mockSubject, setMockSubject] = useState('')
  const [mockPaper, setMockPaper] = useState('2')

  // Revision form
  const [revSubject, setRevSubject] = useState('')
  const [revTopics, setRevTopics] = useState('')
  const [revType, setRevType] = useState('summary')

  // Video lesson form + player state
  const [lessonSubject, setLessonSubject] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [lessonScript, setLessonScript] = useState<LessonScript | null>(null)

  function openModal(type: ModalType) {
    setModal(type)
    setResult(null)
    setError(null)
  }

  function closeModal() {
    setModal(null)
    setResult(null)
    setError(null)
  }

  // ── Content generators ─────────────────────────────────────────────────────

  async function generateNotes() {
    if (!notesSubject || !notesTopic.trim()) return
    setLoading(true); setError(null)
    const res = await fetch('/api/ai-teacher/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: notesSubject, topic: notesTopic.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.note_id) {
      setResult({ type: 'notes', note_id: data.note_id, title: data.title })
    } else {
      setError(data.error ?? 'Failed to generate notes')
    }
  }

  async function generateMockExam() {
    if (!mockSubject) return
    setLoading(true); setError(null)
    const res = await fetch('/api/ai-teacher/generate-mock-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: mockSubject, paper_number: mockPaper }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.note_id) {
      setResult({ type: 'mock_exam', note_id: data.note_id, title: data.title })
    } else {
      setError(data.error ?? 'Failed to generate exam')
    }
  }

  async function generateRevision() {
    if (!revSubject || !revTopics.trim()) return
    await generateQuickRevision(revSubject, revTopics.trim(), revType)
  }

  async function generateQuickRevision(subjectId: string, topicsStr: string, type: string = 'summary') {
    setLoading(true); setError(null)
    if (modal !== 'revision') setModal('revision')
    setRevSubject(subjectId)
    setRevTopics(topicsStr)
    setRevType(type)

    const topics = topicsStr.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/ai-teacher/generate-revision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, topics, revision_type: type }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.note_id) {
      setResult({ type: 'revision', note_id: data.note_id, title: data.title })
    } else {
      setError(data.error ?? 'Failed to generate revision')
    }
  }

  async function generateLesson() {
    if (!lessonSubject || !lessonTopic.trim()) return
    setLoading(true); setError(null)

    const subject = subjects.find(s => s.id === lessonSubject)
    const res = await fetch('/api/ai-teacher/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: lessonSubject,
        topic: lessonTopic.trim(),
        subject_name: subject?.name ?? '',
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.lesson) {
      setModal(null)
      setLessonScript(data.lesson)
    } else {
      setError(data.error ?? 'Failed to generate lesson. Please try again.')
    }
  }

  // ── Misc ───────────────────────────────────────────────────────────────────

  const revTypeOptions = [
    { value: 'summary',          label: 'Quick Summary' },
    { value: 'common_questions', label: 'Common Exam Questions' },
    { value: 'marking_tips',     label: 'Marking Tips' },
    { value: 'key_concepts',     label: 'Key Concepts' },
  ]

  const isVideoFormValid = !!(lessonSubject && lessonTopic.trim())

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => openModal('notes')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm">
          <BookOpen size={15} /> Generate Notes
        </button>
        <button onClick={() => openModal('mock_exam')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition text-sm">
          <ClipboardList size={15} /> Generate Mock Exam
        </button>
        <button onClick={() => openModal('revision')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm">
          <FileText size={15} /> Generate Revision Sheet
        </button>
        {/* ── NEW: Video Lesson button ── */}
        <button onClick={() => openModal('video_lesson')}
          className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition text-sm shadow-lg shadow-rose-200/30"
          style={{ background: 'linear-gradient(135deg,#e11d48,#7c3aed)' }}>
          <PlayCircle size={15} /> Video Lesson
        </button>
      </div>

      {/* ── Weak Topics / Remediation ── */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-amber-500" /> Improve Your Mastery
          </h2>
          <div className="flex flex-wrap gap-2">
            {weakTopics.slice(0, 8).map((t, i) => (
              <div key={i}
                className={`flex items-center gap-1.5 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full border ${t.mastery_level === 'not_started' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <span>{t.topic} <span className="opacity-60">· {t.subject_name}</span></span>
                <button
                  onClick={() => generateQuickRevision(t.subject_id, t.topic, 'key_concepts')}
                  className="ml-1 p-1 hover:bg-white/50 rounded-full transition-colors group"
                  title="Fix this topic with MaFundi">
                  <Zap size={12} className="group-hover:fill-current" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 italic">
            Click the lightning bolt to have MaFundi generate a targeted revision sheet for that topic.
          </p>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {modal === 'video_lesson' ? (
                  <>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#e11d48,#7c3aed)' }}>
                      <PlayCircle size={14} className="text-white" />
                    </span>
                    Generate Video Lesson
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="text-purple-600" />
                    {modal === 'notes'     && 'Generate Study Notes'}
                    {modal === 'mock_exam' && 'Generate Mock Exam'}
                    {modal === 'revision'  && 'Generate Revision Sheet'}
                  </>
                )}
              </h2>
              <button onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Success */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold text-sm mb-1">✓ Generated successfully!</p>
                <p className="text-green-600 text-xs mb-3 font-medium">{result.title}</p>
                <Link href="/student/notes"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Open in My Notes <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Notes form ── */}
            {modal === 'notes' && !result && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject *</label>
                  <select value={notesSubject} onChange={e => setNotesSubject(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Topic *</label>
                  <input type="text" value={notesTopic} onChange={e => setNotesTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis, Quadratic Equations, World War 2..."
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400" />
                </div>
                <p className="text-xs text-gray-400">MaFundi will generate ZIMSEC-aligned notes with worked examples. ~20 seconds.</p>
              </div>
            )}

            {/* ── Mock exam form ── */}
            {modal === 'mock_exam' && !result && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject *</label>
                  <select value={mockSubject} onChange={e => setMockSubject(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Paper Type *</label>
                  <select value={mockPaper} onChange={e => setMockPaper(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-purple-400">
                    <option value="1">Paper 1 — Multiple Choice (40 MCQ)</option>
                    <option value="2">Paper 2 — Structured Questions</option>
                    <option value="3">Paper 3 — Essay Questions</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400">Full ZIMSEC-format exam with model answers. Your weak topics are prioritised. ~30 seconds.</p>
              </div>
            )}

            {/* ── Revision form ── */}
            {modal === 'revision' && !result && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject *</label>
                  <select value={revSubject} onChange={e => setRevSubject(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-400">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Topics * <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </label>
                  <input type="text" value={revTopics} onChange={e => setRevTopics(e.target.value)}
                    placeholder="e.g. Osmosis, Cell Division, Genetics"
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {revTypeOptions.map(opt => (
                      <button key={opt.value} onClick={() => setRevType(opt.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition text-left ${revType === opt.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Video Lesson form ── */}
            {modal === 'video_lesson' && !result && (
              <div className="space-y-3">
                {/* Preview banner */}
                <div className="rounded-xl p-3 flex items-start gap-3"
                  style={{ background: 'linear-gradient(135deg,rgba(225,29,72,.08),rgba(124,58,237,.08))', border: '1px solid rgba(124,58,237,.2)' }}>
                  <PlayCircle size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Animated video lesson</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      MaFundi builds a full animated lesson with voice narration, diagrams, equations and worked examples — all ZIMSEC-aligned.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject *</label>
                  <select value={lessonSubject} onChange={e => setLessonSubject(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-violet-400">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Topic *</label>
                  <input
                    type="text"
                    value={lessonTopic}
                    onChange={e => setLessonTopic(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && isVideoFormValid && !loading) generateLesson() }}
                    placeholder="e.g. Photosynthesis, Quadratic Equations, The Scramble for Africa..."
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <span className="text-amber-500 text-base">⏱</span>
                  <p className="text-[11px] text-amber-700">
                    Lesson generation takes ~25–35 seconds. The player opens automatically when ready.
                  </p>
                </div>
              </div>
            )}

            {/* ── Action buttons ── */}
            {!result && (
              <div className="flex gap-3 pt-1">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>

                {modal === 'video_lesson' ? (
                  <button
                    onClick={generateLesson}
                    disabled={loading || !isVideoFormValid}
                    className="flex-1 py-2.5 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                    style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg,#e11d48,#7c3aed)' }}>
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Generating lesson…</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle size={15} />
                        <span>Create with MaFundi</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={
                      modal === 'notes'     ? generateNotes
                      : modal === 'mock_exam' ? generateMockExam
                      : generateRevision
                    }
                    disabled={
                      loading
                      || (modal === 'notes'     && (!notesSubject || !notesTopic.trim()))
                      || (modal === 'mock_exam' && !mockSubject)
                      || (modal === 'revision'  && (!revSubject || !revTopics.trim()))
                    }
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles size={15} /> Generate with MaFundi</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Animated Lesson Player (full-screen overlay) ── */}
      {lessonScript && (
        <AnimatedLessonPlayer
          lesson={lessonScript}
          onClose={() => setLessonScript(null)}
        />
      )}
    </>
  )
}
