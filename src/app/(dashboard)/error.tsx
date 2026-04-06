'use client'

import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[DashboardError Boundary Component]', error)
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page error</h2>
        <div className="text-gray-500 text-sm mb-6">
          This page encountered an error. Try refreshing or going back to your dashboard.
          <div className="mt-4 p-4 bg-red-50 text-red-700 text-xs font-mono rounded-lg text-left break-all">
            {error.message || 'Error occurred on server component render'}
          </div>
          {error.digest && (
            <span className="block mt-1 text-xs text-gray-400">Ref: {error.digest}</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-xl border border-gray-200 transition text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
