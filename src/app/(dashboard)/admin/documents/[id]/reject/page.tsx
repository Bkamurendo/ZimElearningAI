'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, Loader2, AlertCircle } from 'lucide-react'

const REJECTION_REASONS = [
  'Content is not ZIMSEC-aligned',
  'Content contains inaccurate information',
  'Content is inappropriate for students',
  'Poor scan quality — unreadable',
  'Duplicate document already exists',
  'Copyright violation suspected',
  'Other (specify in notes)',
]

export default function AdminRejectDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [docTitle, setDocTitle] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function fetchTitle() {
      try {
        const res = await fetch(`/api/admin/documents/${id}/info`)
        if (res.ok) {
          const data = await res.json()
          setDocTitle(data.title ?? null)
        }
      } catch {
        // non-critical
      }
    }
    fetchTitle()
  }, [id])

  async function handleReject() {
    const combinedNotes = [reason, notes.trim()].filter(Boolean).join(' — ')
    if (!combinedNotes) {
      setError('Please select a reason or add a note')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/documents/moderate/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: combinedNotes }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to reject document')
      }
      setDone(true)
      setTimeout(() => router.push('/admin/documents'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Document Rejected</h2>
          <p className="text-sm text-gray-500 mt-1">
            The document has been marked as rejected and will not be shown to students.
          </p>
          <p className="text-xs text-gray-400 mt-3">Redirecting to documents list…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/documents" className="text-gray-400 hover:text-gray-600 transition">
            ← Documents
          </Link>
          <span className="text-gray-200">/</span>
          <span className="font-bold text-gray-900">Reject Document</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Reject Document</h1>
              {docTitle && (
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{docTitle}</p>
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-red-800 font-medium">
              Rejecting this document will prevent it from being shared with students.
              The uploader will be able to see the rejected status.
            </p>
          </div>

          {/* Rejection reason */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Reason for Rejection <span className="text-red-400">*</span>
            </label>
            <div className="space-y-1.5">
              {REJECTION_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide specific feedback to the uploader…"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/documents"
              className="flex-1 py-2.5 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm"
            >
              Cancel
            </Link>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              {loading ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
