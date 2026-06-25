'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error.digest ?? error.message)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t load this page</h2>
        <p className="text-gray-500 text-sm mb-6">
          Something went wrong. Try refreshing — if it keeps happening, check your connection or contact support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
          >
            Try again
          </button>
          <Link
            href="/student/dashboard"
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-xl border border-gray-200 transition text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
