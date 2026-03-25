'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export function TeacherApprovalActions({ teacherId }: { teacherId: string }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(true); setError('')
    const res = await fetch(`/api/admin/teachers/${teacherId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes: notes || undefined }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 min-w-[160px]">
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {showReject ? (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('reject')}
              disabled={loading}
              className="flex-1 bg-red-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
            >
              {loading ? '…' : 'Confirm Reject'}
            </button>
            <button onClick={() => setShowReject(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={loading}
            className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            <Check size={13} /> Approve
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-200 disabled:opacity-50 transition"
          >
            <X size={13} /> Reject
          </button>
        </div>
      )}
    </div>
  )
}
