'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronLeft, BookOpen, ChevronDown, ChevronUp, Save, Eye, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  zimsec_level: string
}

interface GeneratedLesson {
  title: string
  content: string
}

interface PreviewResult {
  preview: true
  subject: { id: string; name: string; level: string }
  course_title: string
  course_description: string
  lessons: GeneratedLesson[]
  tokens_used: number
}

interface SavedResult {
  saved: true
  course_id: string
  lessons_created: number
  tokens_used: number
}

const LEVEL_OPTIONS = [
  { value: 'olevel', label: 'O-Level' },
  { value: 'alevel', label: 'A-Level' },
  { value: 'primary', label: 'Primary' },
]

function LessonPreview({ lesson, index }: { lesson: GeneratedLesson; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
          {index + 1}
        </div>
        <span className="flex-1 font-semibold text-slate-800 text-sm">{lesson.title}</span>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-3 max-h-80 overflow-y-auto">
            {lesson.content}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GenerateContentPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [numLessons, setNumLessons] = useState(3)
  const [teacherNote, setTeacherNote] = useState('')
  const [levelFilter, setLevelFilter] = useState('olevel')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [saved, setSaved] = useState<SavedResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/subjects')
      .then(r => r.json())
      .then(data => setSubjects(data.subjects ?? data ?? []))
      .catch(() => setSubjects([]))
  }, [])

  const filteredSubjects = subjects.filter(s => s.zimsec_level === levelFilter)

  async function handleGenerate() {
    if (!subjectId || !topic.trim()) {
      setError('Please select a subject and enter a topic.')
      return
    }
    setError('')
    setPreview(null)
    setSaved(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          topic: topic.trim(),
          num_lessons: numLessons,
          teacher_note: teacherNote.trim() || undefined,
          save: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Generation failed. Please try again.')
      } else {
        setPreview(data as PreviewResult)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          topic: topic.trim(),
          num_lessons: numLessons,
          teacher_note: teacherNote.trim() || undefined,
          save: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed.')
      } else {
        setSaved(data as SavedResult)
        setPreview(null)
      }
    } catch {
      setError('Network error while saving.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setPreview(null)
    setSaved(null)
    setError('')
    setTopic('')
    setTeacherNote('')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-4 pt-10 pb-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition">
            <ChevronLeft size={16} /> Back to Content
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Lesson Generator</h1>
          </div>
          <p className="text-violet-200 text-sm">
            Generate ZIMSEC-aligned lesson content using Claude AI. Preview before saving.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

        {/* Success state */}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-800">Lessons saved successfully!</p>
                <p className="text-emerald-600 text-sm">
                  {saved.lessons_created} lesson{saved.lessons_created !== 1 ? 's' : ''} created · {saved.tokens_used.toLocaleString()} tokens used
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/teacher/courses/${saved.course_id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
              >
                <ExternalLink size={14} /> View Course
              </Link>
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!saved && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-violet-600" />
              Lesson Configuration
            </h2>

            <div className="space-y-4">
              {/* Level filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Level</label>
                <div className="flex gap-2">
                  {LEVEL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setLevelFilter(opt.value); setSubjectId('') }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                        levelFilter === opt.value
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="">Select a subject…</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Quadratic Equations, Photosynthesis, The Chimurenga Wars…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* Number of lessons */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Number of Lessons: <span className="text-violet-600 font-bold">{numLessons}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={numLessons}
                  onChange={e => setNumLessons(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1 (quick)</span>
                  <span>5 (full unit)</span>
                </div>
              </div>

              {/* Teacher note (optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Extra context <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={teacherNote}
                  onChange={e => setTeacherNote(e.target.value)}
                  placeholder="E.g. Focus on Form 3 expectations. Include a diagram description. Emphasize common exam mistakes."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !subjectId || !topic.trim()}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating with Claude AI…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Lessons
                </>
              )}
            </button>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            {/* Course info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">
                    <Eye size={11} className="inline mr-1" />
                    Preview — not yet saved
                  </p>
                  <h2 className="text-xl font-black text-slate-900">{preview.course_title}</h2>
                  <p className="text-slate-500 text-sm mt-1">{preview.course_description}</p>
                </div>
                <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 font-semibold">
                  {preview.subject.name} · {preview.subject.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">{preview.tokens_used.toLocaleString()} tokens used</p>
            </div>

            {/* Lessons */}
            <div className="space-y-2">
              {preview.lessons.map((lesson, i) => (
                <LessonPreview key={i} lesson={lesson} index={i} />
              ))}
            </div>

            {/* Save actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : (
                  <><Save size={16} /> Save to Database</>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-3 rounded-xl transition"
              >
                <Sparkles size={16} />
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
