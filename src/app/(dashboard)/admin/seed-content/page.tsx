'use client'

import { useState } from 'react'
import Link from 'next/link'

type SeedResult = {
  success: boolean
  courses_created: number
  courses_skipped: number
  lessons_created: number
  errors: string[]
  error?: string
}

export default function SeedContentPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/seed-content', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, courses_created: 0, courses_skipped: 0, lessons_created: 0, errors: [], error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">ZL</span>
          </div>
          <span className="font-bold text-gray-900">ZimLearn Admin</span>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <h1 className="text-2xl font-bold">Seed ZIMSEC Content</h1>
            <p className="mt-1 text-gray-400 text-sm">
              Upload curriculum-aligned lesson content to the platform
            </p>
          </div>
        </div>

        {/* What will be seeded */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">Content to be seeded</h2>
          <p className="text-sm text-gray-500">
            The following ZIMSEC-aligned courses and lessons will be uploaded for the first available teacher account.
            Duplicate courses are skipped automatically.
          </p>
          <div className="space-y-2">
            {[
              { level: 'Primary', courses: ['Primary Mathematics (5 lessons)', 'Primary English Language (5 lessons)'] },
              { level: 'O-Level', courses: [
                'O-Level Mathematics — Algebra (5 lessons)',
                'O-Level Mathematics — Geometry & Statistics (5 lessons)',
                'O-Level Physics (5 lessons)',
                'O-Level Chemistry (5 lessons)',
                'O-Level Biology (5 lessons)',
                'O-Level English Language (5 lessons)',
                'O-Level History of Zimbabwe (5 lessons)',
              ]},
              { level: 'A-Level', courses: ['A-Level Pure Mathematics (5 lessons)'] },
            ].map(({ level, courses }) => (
              <div key={level}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{level}</p>
                <ul className="space-y-1">
                  {courses.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Total: 10 courses · 50 lessons</p>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Prerequisites</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>At least one teacher account must exist in the system</li>
            <li>All 42 subjects must be seeded (run the SQL migration first)</li>
            <li>You must be logged in as an admin</li>
          </ul>
        </div>

        {/* Seed button */}
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Uploading content…
            </span>
          ) : (
            'Upload ZIMSEC Content'
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl border p-5 space-y-3 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.error ? (
              <p className="text-sm font-semibold text-red-700">{result.error}</p>
            ) : (
              <>
                <p className={`text-sm font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Content uploaded successfully!' : 'Upload failed'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{result.courses_created}</p>
                    <p className="text-xs text-gray-500">Courses created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{result.lessons_created}</p>
                    <p className="text-xs text-gray-500">Lessons created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500">{result.courses_skipped}</p>
                    <p className="text-xs text-gray-500">Skipped (already exist)</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">Errors ({result.errors.length})</p>
                    <ul className="space-y-1">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600 font-mono bg-red-100 rounded px-2 py-1">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
