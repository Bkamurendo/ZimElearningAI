'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export default function AdminApproveDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [notes, setNotes] = useState('')
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

  async function handleApprove() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/documents/moderate/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: notes.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to approve document')
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
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Document Approved!</h2>
          <p className="text-sm text-gray-500 mt-1">
            The document is now published and visible to students.
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
          <span className="font-bold text-gray-900">Approve Document</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Approve Document</h1>
              {docTitle && (
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{docTitle}</p>
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-green-800 font-medium">
              Approving this document will publish it and make it visible to all eligible students.
            </p>
            <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
              <li>Uploaded by a teacher → visible to students in that subject</li>
              <li>Uploaded by admin → visible to all students in that level</li>
              <li>Uploaded by a student → remains private unless you change visibility</li>
            </ul>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Admin Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for your records…"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
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
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {loading ? 'Approving…' : 'Approve & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
