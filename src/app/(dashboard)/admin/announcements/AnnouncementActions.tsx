'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function AnnouncementActions({ announcementId }: { announcementId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Archive this announcement? It will no longer be visible to users.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to archive announcement. Please try again.')
        return
      }
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
      title="Archive announcement"
    >
      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}
