'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Loader2 } from 'lucide-react'

interface Props {
  documentId: string
  isBookmarked: boolean
  onToggle?: (nowBookmarked: boolean) => void
}

export default function BookmarkToggle({ documentId, isBookmarked, onToggle }: Props) {
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })
      if (res.ok) {
        const next = !bookmarked
        setBookmarked(next)
        onToggle?.(next)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this document'}
      className={`p-2 rounded-lg transition ${
        bookmarked
          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
          : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
      }`}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Bookmark size={15} className={bookmarked ? 'fill-amber-500' : ''} />
      )}
    </button>
  )
}
