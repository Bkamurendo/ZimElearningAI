'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ReprocessButton({ documentId }: { documentId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleReprocess() {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch(`/api/documents/process/${documentId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Processing failed. Please try again.')
      } else {
        setState('done')
        setMessage(
          data.extraction_method === 'metadata-only'
            ? 'Document is image-based or scanned — AI will answer using ZIMSEC knowledge. Reload the page to chat.'
            : `Text extracted successfully (${data.pages} pages). Reload the page to use the full AI chat.`
        )
      }
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-green-800">Processing complete!</p>
          <p className="text-xs text-green-700 mt-0.5">{message}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition flex-shrink-0"
        >
          Reload
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-red-700">Processing failed</p>
          <p className="text-xs text-red-600 mt-0.5">{message}</p>
        </div>
        <button
          onClick={() => setState('idle')}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition flex-shrink-0"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <RefreshCw size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-amber-800">Document text not yet extracted</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Extract the document text so the AI can read the full content and give accurate answers.
          This takes 10–60 seconds depending on document size.
        </p>
      </div>
      <button
        onClick={handleReprocess}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition flex-shrink-0"
      >
        {state === 'loading' ? (
          <><Loader2 size={12} className="animate-spin" /> Processing…</>
        ) : (
          <><RefreshCw size={12} /> Extract Text</>
        )}
      </button>
    </div>
  )
}
