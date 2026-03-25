'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle2 } from 'lucide-react'

export function SuspendUserButton({ userId, isSuspended }: { userId: string; isSuspended: boolean }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction(action: 'suspend' | 'unsuspend') {
    setLoading(true); setError('')
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason || undefined }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    router.refresh()
  }

  if (isSuspended) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" /> Reinstate Account
        </h3>
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          onClick={() => handleAction('unsuspend')}
          disabled={loading}
          className="bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {loading ? 'Processing…' : 'Unsuspend Account'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
      <h3 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-2">
        <Ban size={16} /> Suspend Account
      </h3>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      {showForm ? (
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for suspension (optional but recommended)"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('suspend')}
              disabled={loading}
              className="bg-red-500 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 transition"
            >
              {loading ? 'Suspending…' : 'Confirm Suspend'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-red-100 transition"
        >
          <Ban size={14} /> Suspend This Account
        </button>
      )}
    </div>
  )
}
