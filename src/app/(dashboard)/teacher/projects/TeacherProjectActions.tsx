'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, Edit3, Eye, EyeOff, Loader2 } from 'lucide-react'

type Subject = { id: string; name: string; code: string }

type Assignment = {
  id: string
  title: string
  description: string | null
  guidelines: string | null
  heritage_theme: string | null
  max_marks: number
  due_date: string | null
  zimsec_level: string | null
  published: boolean
  subject: { id?: string; name: string; code: string } | null
}

interface Props {
  subjects: Subject[]
  mode: 'create' | 'create-prominent' | 'manage'
  assignment?: Assignment
}

export default function TeacherProjectActions({ subjects, mode, assignment }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: assignment?.title ?? '',
    description: assignment?.description ?? '',
    guidelines: assignment?.guidelines ?? '',
    heritage_theme: assignment?.heritage_theme ?? '',
    subject_id: assignment?.subject?.id ?? (subjects[0]?.id ?? ''),
    max_marks: assignment?.max_marks ?? 100,
    due_date: assignment?.due_date ?? '',
    zimsec_level: assignment?.zimsec_level ?? 'olevel',
    published: assignment?.published ?? false,
  })

  function updateForm(k: string, v: string | number | boolean) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/teacher/sbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, max_marks: Number(form.max_marks) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setCreateOpen(false)
      router.refresh()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!assignment) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/teacher/sbp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, ...form, max_marks: Number(form.max_marks) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setEditOpen(false)
      router.refresh()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!assignment) return
    setLoading(true)
    await fetch(`/api/teacher/sbp?id=${assignment.id}`, { method: 'DELETE' })
    setDeleteOpen(false)
    router.refresh()
    setLoading(false)
  }

  async function togglePublish() {
    if (!assignment) return
    await fetch('/api/teacher/sbp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: assignment.id, published: !assignment.published }),
    })
    router.refresh()
  }

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
        <select value={form.subject_id} onChange={e => updateForm('subject_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white">
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Project Assignment Title *</label>
        <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} placeholder="e.g. Investigating Local Medicinal Plants" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
        <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={2} placeholder="Brief overview for students" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none placeholder:text-slate-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Heritage Theme</label>
        <input type="text" value={form.heritage_theme} onChange={e => updateForm('heritage_theme', e.target.value)} placeholder="e.g. Indigenous Knowledge, Local Environment, Community Entrepreneurship" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Guidelines (shown to students)</label>
        <textarea value={form.guidelines} onChange={e => updateForm('guidelines', e.target.value)} rows={4} placeholder="Step-by-step instructions, marking criteria, required components, submission format..." className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-y placeholder:text-slate-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">ZIMSEC Level</label>
          <select value={form.zimsec_level} onChange={e => updateForm('zimsec_level', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white">
            <option value="primary">Primary</option>
            <option value="olevel">O-Level</option>
            <option value="alevel">A-Level</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Marks</label>
          <input type="number" min={10} max={200} value={form.max_marks} onChange={e => updateForm('max_marks', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
        <input type="date" value={form.due_date} onChange={e => updateForm('due_date', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="published" checked={form.published} onChange={e => updateForm('published', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
        <label htmlFor="published" className="text-sm text-slate-700 dark:text-slate-300">Publish immediately (students can see it)</label>
      </div>
    </div>
  )

  const Modal = ({ open, onClose, title, onSubmit, submitLabel }: {
    open: boolean; onClose: () => void; title: string
    onSubmit: (e: React.FormEvent) => void; submitLabel: string
  }) => {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-5 space-y-4">
            {formFields}
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitLabel}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'create' || mode === 'create-prominent') {
    return (
      <>
        <button
          onClick={() => { setForm({ title: '', description: '', guidelines: '', heritage_theme: '', subject_id: subjects[0]?.id ?? '', max_marks: 100, due_date: '', zimsec_level: 'olevel', published: false }); setCreateOpen(true) }}
          className={`flex items-center gap-2 ${mode === 'create-prominent' ? 'px-5 py-2.5 text-sm' : 'px-3 py-2 text-xs'} bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all`}
        >
          <Plus size={mode === 'create-prominent' ? 16 : 14} />
          Create Project
        </button>
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create SBP Assignment" onSubmit={handleCreate} submitLabel="Create Project" />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={togglePublish}
          title={assignment?.published ? 'Unpublish' : 'Publish'}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          {assignment?.published ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button
          onClick={() => { setForm({ title: assignment?.title ?? '', description: assignment?.description ?? '', guidelines: assignment?.guidelines ?? '', heritage_theme: assignment?.heritage_theme ?? '', subject_id: assignment?.subject?.id ?? '', max_marks: assignment?.max_marks ?? 100, due_date: assignment?.due_date ?? '', zimsec_level: assignment?.zimsec_level ?? 'olevel', published: assignment?.published ?? false }); setEditOpen(true) }}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <Edit3 size={15} />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit SBP Assignment" onSubmit={handleEdit} submitLabel="Save Changes" />

      {deleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently delete the SBP assignment and all student submissions. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleDelete} disabled={loading} className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50">
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
