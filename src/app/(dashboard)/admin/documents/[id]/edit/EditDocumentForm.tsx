'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import type { DocData, SubjectOption } from './page'

// ── Static config ─────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'past_paper',     label: 'Past Exam Paper'    },
  { value: 'marking_scheme', label: 'Marking Scheme'     },
  { value: 'notes',          label: 'Study Notes'        },
  { value: 'textbook',       label: 'Textbook / Chapter' },
  { value: 'syllabus',       label: 'ZIMSEC Syllabus'    },
  { value: 'other',          label: 'Other Resource'     },
]

const LEVELS = [
  { value: 'primary', label: 'Primary (Grades 1–7)' },
  { value: 'olevel',  label: 'O-Level (Forms 1–4)'  },
  { value: 'alevel',  label: 'A-Level (Lower/Upper 6)' },
]

const STATUSES = [
  { value: 'pending',     label: 'Pending'       },
  { value: 'processing',  label: 'Processing'    },
  { value: 'ai_reviewed', label: 'Needs Review'  },
  { value: 'published',   label: 'Published ✅'  },
  { value: 'rejected',    label: 'Rejected ❌'   },
]

const VISIBILITIES = [
  { value: 'private',  label: 'Private (uploader only)' },
  { value: 'subject',  label: 'Subject (enrolled students)' },
  { value: 'public',   label: 'Public (all students)' },
]

const LEVEL_LABELS: Record<string, string> = {
  primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditDocumentForm({
  doc,
  subjects,
}: {
  doc: DocData
  subjects: SubjectOption[]
}) {
  const router = useRouter()

  // If the doc already has a subject, initialise level from that subject's level
  // so the form is consistent from the start (fixes "O-Level · matches subject" on mislabeled docs)
  const initialLevel = doc.subject_id
    ? (subjects.find(s => s.id === doc.subject_id)?.zimsec_level ?? doc.zimsec_level ?? '')
    : (doc.zimsec_level ?? '')

  const [form, setForm] = useState({
    title:             doc.title,
    description:       doc.description ?? '',
    document_type:     doc.document_type,
    subject_id:        doc.subject_id ?? '',
    zimsec_level:      initialLevel,
    year:              doc.year ? String(doc.year) : '',
    paper_number:      doc.paper_number ? String(doc.paper_number) : '',
    moderation_status: doc.moderation_status,
    visibility:        doc.visibility,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Auto-derive level from subject when subject changes
  function handleSubjectChange(subjectId: string) {
    const subject = subjects.find(s => s.id === subjectId)
    setForm(prev => ({
      ...prev,
      subject_id: subjectId,
      // If a subject is chosen, lock the level to match it
      zimsec_level: subject ? subject.zimsec_level : prev.zimsec_level,
    }))
  }

  // Detect mismatch between doc's stored level and subject's actual level
  const selectedSubject = subjects.find(s => s.id === form.subject_id)
  const levelMismatch = selectedSubject && form.zimsec_level !== selectedSubject.zimsec_level

  // Detect if the doc was originally mislabeled (before edits)
  const originalMismatch = doc.subject && doc.zimsec_level !== doc.subject.zimsec_level

  // Group subjects by level for the <optgroup> layout
  const subjectsByLevel: Record<string, SubjectOption[]> = {}
  for (const s of subjects) {
    if (!subjectsByLevel[s.zimsec_level]) subjectsByLevel[s.zimsec_level] = []
    subjectsByLevel[s.zimsec_level].push(s)
  }
  const levelOrder = ['primary', 'olevel', 'alevel']

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/documents/update/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:             form.title.trim(),
          description:       form.description || null,
          document_type:     form.document_type,
          subject_id:        form.subject_id || null,
          zimsec_level:      form.zimsec_level || null,
          year:              form.year || null,
          paper_number:      form.paper_number || null,
          moderation_status: form.moderation_status,
          visibility:        form.visibility,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }

      setSaved(true)
      // Brief flash then go back
      setTimeout(() => router.push('/admin/documents'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/documents" className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition">
            <ArrowLeft size={14} /> Documents
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900 truncate">{doc.title}</span>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">Edit</span>
        </div>

        {/* Mislabeled warning */}
        {originalMismatch && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">⚠️ Mislabeled Document Detected</p>
              <p className="text-xs text-red-700 mt-1">
                This document is tagged as <strong>{LEVEL_LABELS[doc.zimsec_level ?? ''] ?? doc.zimsec_level}</strong> but
                it&apos;s linked to subject <strong>&quot;{doc.subject?.name}&quot;</strong> which is {LEVEL_LABELS[doc.subject?.zimsec_level ?? ''] ?? doc.subject?.zimsec_level}.
                Fix the subject and/or level below to correct the placement.
              </p>
            </div>
          </div>
        )}

        {/* File info strip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{doc.file_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Uploaded by {doc.uploader_role} · {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium flex-shrink-0 capitalize">
            {doc.moderation_status.replace('_', ' ')}
          </span>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h1 className="text-base font-bold text-gray-900">Edit Document Metadata</h1>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Document title"
            />
          </div>

          {/* Subject picker — the most important field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Subject <span className="text-xs font-normal text-gray-400 normal-case">(changing this auto-updates the level)</span>
            </label>
            <select
              value={form.subject_id}
              onChange={e => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">— No subject assigned —</option>
              {levelOrder.map(level => {
                const group = subjectsByLevel[level] ?? []
                if (group.length === 0) return null
                return (
                  <optgroup key={level} label={`── ${LEVEL_LABELS[level]} ──`}>
                    {group.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>

          {/* Level — shown as read-only when subject is selected; editable when no subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              ZIMSEC Level
              {selectedSubject && (
                <span className="ml-2 text-xs font-normal text-emerald-600 normal-case">
                  ✓ auto-set from subject
                </span>
              )}
            </label>
            {selectedSubject ? (
              /* Read-only display when subject is chosen */
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-medium">
                <CheckCircle size={14} className="text-emerald-600" />
                {LEVEL_LABELS[form.zimsec_level] ?? form.zimsec_level}
                <span className="text-xs text-emerald-600 font-normal ml-auto">matches subject</span>
              </div>
            ) : (
              /* Editable when no subject */
              <select
                value={form.zimsec_level}
                onChange={e => setForm(p => ({ ...p, zimsec_level: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">— Not set —</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            )}
            {levelMismatch && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> Level will be updated to match the selected subject
              </p>
            )}
          </div>

          {/* Doc type + Year/Paper in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Document Type <span className="text-red-400">*</span>
              </label>
              <select
                value={form.document_type}
                onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {['past_paper', 'marking_scheme'].includes(form.document_type) && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Exam Year
                </label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                  placeholder="e.g. 2023"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
          </div>

          {['past_paper', 'marking_scheme'].includes(form.document_type) && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Paper Number
              </label>
              <select
                value={form.paper_number}
                onChange={e => setForm(p => ({ ...p, paper_number: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">—</option>
                {[1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>Paper {n}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description…"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Moderation status + Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Moderation Status
              </label>
              <select
                value={form.moderation_status}
                onChange={e => setForm(p => ({ ...p, moderation_status: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Visibility
              </label>
              <select
                value={form.visibility}
                onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {VISIBILITIES.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={14} /> Saved! Redirecting…
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || saved || !form.title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle size={14} /> Saved!</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
            <Link
              href="/admin/documents"
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
            >
              Cancel
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
