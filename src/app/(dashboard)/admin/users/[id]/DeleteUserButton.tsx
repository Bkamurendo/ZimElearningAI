'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to delete account')
      setLoading(false)
      return
    }
    // Redirect to the users list after successful deletion
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 mt-5">
      <h3 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-2">
        <Trash2 size={16} /> Delete Account
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Permanently remove this user and all associated data. This action cannot be undone.
      </p>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      
      {showForm ? (
        <div className="space-y-4 bg-red-50 p-4 rounded-xl border border-red-100">
          <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
            <AlertTriangle size={16} /> Are you absolutely sure?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition drop-shadow-sm"
            >
              {loading ? 'Deleting…' : 'Yes, Permanently Delete'}
            </button>
            <button 
              onClick={() => setShowForm(false)} 
              disabled={loading}
              className="px-5 py-2 text-gray-600 bg-white border border-gray-300 text-sm rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-red-100 transition"
        >
          <Trash2 size={14} /> Delete This Account
        </button>
      )}
    </div>
  )
}
