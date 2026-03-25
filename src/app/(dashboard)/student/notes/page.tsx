'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { FileText, Plus, Trash2, X, Save, Pencil, Eye } from 'lucide-react'
import MarkdownContent from '@/components/MarkdownContent'

type Note = {
  id: string
  title: string
  content: string
  subject_id: string | null
  lesson_id: string | null
  created_at: string
  updated_at: string
  subjects: { name: string } | null
  lessons: { title: string } | null
}

type Subject = { id: string; name: string; code: string }

// AI-generated notes have recognisable title prefixes
function isAiNote(note: Note) {
  return (
    note.title.startsWith('MaFundi Notes:') ||
    note.title.startsWith('MaFundi Mock') ||
    note.title.includes('Paper 1 —') ||
    note.title.includes('Paper 2 —') ||
    note.title.includes('Paper 3 —') ||
    note.title.startsWith('Revision Summary:') ||
    note.title.startsWith('Common Questions:') ||
    note.title.startsWith('Marking Tips:') ||
    note.title.startsWith('Key Concepts:')
  )
}

export default function StudentNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', subject_id: '' })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const [notesRes, subjRes] = await Promise.all([
        fetch('/api/student/notes'),
        fetch('/api/student/subjects'),
      ])
      const notesData = await notesRes.json()
      const subjData = await subjRes.json()
      setNotes(notesData.notes ?? [])
      setSubjects(subjData.subjects ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeSubject === 'all'
    ? notes
    : notes.filter(n => n.subject_id === activeSubject)

  async function createNote() {
    if (!newNote.title.trim() && !newNote.content.trim()) return
    setSaving(true)
    const res = await fetch('/api/student/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newNote.title.trim() || 'Untitled Note',
        content: newNote.content,
        subject_id: newNote.subject_id || null,
      }),
    })
    const data = await res.json()
    if (data.note) {
      setNotes(prev => [data.note, ...prev])
      setNewNote({ title: '', content: '', subject_id: '' })
      setShowNew(false)
      setExpandedId(data.note.id)
    }
    setSaving(false)
  }

  function scheduleAutoSave(id: string, field: 'title' | 'content', value: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const note = notes.find(n => n.id === id)
      if (!note) return
      const payload = field === 'title' ? { id, title: value } : { id, content: value }
      await fetch('/api/student/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }, 800)
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/student/notes?id=${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (expandedId === id) setExpandedId(null)
    if (editingId === id) setEditingId(null)
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setEditingId(null)
    } else {
      setExpandedId(id)
      setEditingId(null) // default to view mode when expanding
    }
  }

  const aiCount = notes.filter(isAiNote).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm mb-4 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Notes</h1>
                <p className="text-emerald-100 text-sm">
                  {notes.length} note{notes.length !== 1 ? 's' : ''}
                  {aiCount > 0 && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">✨ {aiCount} AI-generated</span>}
                </p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition border border-white/20">
              <Plus size={16} /> New Note
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Subject filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveSubject('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeSubject === 'all' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            All
          </button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => setActiveSubject(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeSubject === s.id ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.name}
            </button>
          ))}
        </div>

        {/* New note form */}
        {showNew && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Note</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <input type="text" placeholder="Note title…" value={newNote.title}
              onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
            <select value={newNote.subject_id} onChange={e => setNewNote(p => ({ ...p, subject_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea rows={6} placeholder="Write your note here…" value={newNote.content}
              onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={createNote} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                <Save size={15} /> {saving ? 'Saving…' : 'Save Note'}
              </button>
              <button onClick={() => setShowNew(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No notes yet</p>
            <button onClick={() => setShowNew(true)}
              className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              + Create your first note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => {
              const isExpanded = expandedId === note.id
              const isEditing = editingId === note.id
              const aiGenerated = isAiNote(note)

              return (
                <div key={note.id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${isExpanded ? 'border-emerald-300 shadow-md' : 'border-gray-100 hover:border-emerald-200'}`}>

                  {/* Note header — always visible */}
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => toggleExpand(note.id)}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${aiGenerated ? 'bg-purple-100' : 'bg-emerald-100'}`}>
                      {aiGenerated ? <span className="text-sm">✨</span> : <FileText size={14} className="text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{note.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {note.subjects && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {(note.subjects as { name: string }).name}
                          </span>
                        )}
                        {aiGenerated && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">MaFundi AI</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(note.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {!isExpanded && (
                          <span className="text-xs text-gray-300 truncate max-w-[200px]">
                            {note.content.replace(/#+\s/g, '').replace(/\*+/g, '').slice(0, 60)}…
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isExpanded && (
                        <button
                          onClick={() => setEditingId(isEditing ? null : note.id)}
                          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition ${isEditing ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {isEditing ? <><Eye size={12} /> View</> : <><Pencil size={12} /> Edit</>}
                        </button>
                      )}
                      <button onClick={() => deleteNote(note.id)}
                        className="text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                      {isEditing ? (
                        /* Edit mode — textarea for manual editing */
                        <div className="space-y-3">
                          <input
                            value={note.title}
                            onChange={e => scheduleAutoSave(note.id, 'title', e.target.value)}
                            className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 outline-none"
                            placeholder="Title…"
                          />
                          <textarea
                            value={note.content}
                            onChange={e => scheduleAutoSave(note.id, 'content', e.target.value)}
                            rows={20}
                            className="w-full text-sm text-gray-700 font-mono border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 outline-none resize-y"
                            placeholder="Write your note here… (Markdown supported)"
                          />
                          <p className="text-xs text-gray-400">Markdown supported — auto-saves as you type</p>
                        </div>
                      ) : (
                        /* View mode — rendered markdown */
                        <MarkdownContent content={note.content || '*Empty note — click Edit to add content*'} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
