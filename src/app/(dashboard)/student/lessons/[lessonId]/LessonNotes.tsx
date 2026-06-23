'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { FileText, Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Save } from 'lucide-react'

type Note = {
  id: string
  title: string
  content: string
  updated_at: string
}

export default function LessonNotes({
  lessonId,
  subjectId,
}: {
  lessonId: string
  subjectId: string
}) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genToast, setGenToast] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open || notes.length > 0) return
    setLoading(true)
    fetch(`/api/student/notes?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then(d => { setNotes(d.notes ?? []); setLoading(false) })
  }, [open, lessonId, notes.length])

  function scheduleAutoSave(id: string, field: 'title' | 'content', value: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await fetch('/api/student/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
    }, 800)
  }

  async function addNote() {
    if (!newTitle.trim() && !newContent.trim()) return
    setSaving(true)
    const res = await fetch('/api/student/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim() || 'Untitled Note',
        content: newContent,
        lesson_id: lessonId,
        subject_id: subjectId,
      }),
    })
    const data = await res.json()
    if (data.note) {
      setNotes(prev => [data.note, ...prev])
      setNewTitle(''); setNewContent(''); setAdding(false)
      setEditingId(data.note.id)
    }
    setSaving(false)
  }

  async function deleteNote(id: string) {
    await fetch(`/api/student/notes?id=${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editingId === id) setEditingId(null)
  }

  async function generateFlashcards() {
    setGenerating(true)
    setGenToast(null)
    const res = await fetch('/api/student/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, subject_id: subjectId }),
    })
    const data = await res.json()
    if (data.count) {
      setGenToast(`✓ Generated ${data.count} flashcards!`)
    } else {
      setGenToast(data.error ?? 'Could not generate flashcards (text lessons only)')
    }
    setGenerating(false)
    setTimeout(() => setGenToast(null), 5000)
  }

  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefing, setBriefing] = useState<{ script: string; title: string } | null>(null)

  async function generateAudioBriefing() {
    setBriefingLoading(true)
    setGenToast(null)
    try {
      const res = await fetch('/api/student/audio/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId }),
      })
      const data = await res.json()
      if (data.script) {
        setBriefing(data)
        setGenToast('✓ Briefing script ready! Audio generation starting...')
      } else {
        setGenToast(data.error ?? 'Failed to generate briefing')
      }
    } catch (err) {
      setGenToast('Connection error')
    } finally {
      setBriefingLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" />
          <span className="font-semibold text-gray-800 text-sm">My Notes & Audio Briefings</span>
          {notes.length > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{notes.length}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <button onClick={() => setAdding(a => !a)}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                <Plus size={15} /> Add Note
              </button>
              <button onClick={generateFlashcards} disabled={generating}
                className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50">
                <Sparkles size={14} /> {generating ? 'Generating…' : 'Flashcards'}
              </button>
              <button onClick={generateAudioBriefing} disabled={briefingLoading}
                className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                </div>
                {briefingLoading ? 'Creating Briefing…' : 'Audio Briefing'}
              </button>
            </div>
          </div>

          {briefing && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-orange-800 uppercase tracking-tight">{briefing.title}</p>
                <button onClick={() => setBriefing(null)} className="text-orange-400 hover:text-orange-600">×</button>
              </div>
              <p className="text-sm text-orange-900 leading-relaxed italic line-clamp-3">
                "{briefing.script}"
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-orange-200 rounded-full overflow-hidden">
                   <div className="w-1/3 h-full bg-orange-500 animate-[loading_2s_infinite]" />
                </div>
                <span className="text-[10px] font-bold text-orange-700">PREVIEW SCRIPT</span>
              </div>
            </div>
          )}

          {genToast && (
            <p className={`text-xs font-medium px-3 py-2 rounded-xl ${genToast.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {genToast}
              {genToast.startsWith('✓') && (
                <Link href="/student/flashcards" className="ml-2 underline">View flashcards →</Link>
              )}
            </p>
          )}

          {/* Add note form */}
          {adding && (
            <div className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-100">
              <input type="text" placeholder="Note title…" value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white" />
              <textarea rows={4} placeholder="Write your note…" value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none bg-white" />
              <div className="flex gap-2">
                <button onClick={addNote} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
                  <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setAdding(false)}
                  className="px-4 py-2 bg-white text-gray-600 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-3">No notes yet for this lesson</p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 cursor-pointer"
                    onClick={() => setEditingId(editingId === note.id ? null : note.id)}>
                    <span className="text-sm font-medium text-gray-800 truncate">{note.title}</span>
                    <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                      className="text-gray-300 hover:text-red-400 transition ml-2 flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {editingId === note.id && (
                    <div className="p-3 space-y-2">
                      <input value={note.title}
                        onChange={e => scheduleAutoSave(note.id, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
                      <textarea rows={5} value={note.content}
                        onChange={e => scheduleAutoSave(note.id, 'content', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none" />
                      <p className="text-xs text-gray-400 text-right">Auto-saved</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link href="/student/notes" className="block text-center text-xs text-gray-400 hover:text-emerald-600 transition mt-2">
            View all my notes →
          </Link>
        </div>
      )}
    </div>
  )
}
