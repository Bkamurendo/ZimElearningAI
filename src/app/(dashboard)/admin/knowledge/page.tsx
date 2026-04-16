'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Brain, ChevronLeft, RefreshCw, Zap, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface DocStatus {
  id: string
  title: string
  hasText: boolean
  embedded: boolean
}

interface StatusData {
  total: number
  embedded: number
  pending: number
  docs: DocStatus[]
}

interface EmbedResult {
  id: string
  title: string
  chunks: number
  status: string
}

export default function KnowledgePage() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<EmbedResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reprocess, setReprocess] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/generate-embeddings')
      if (!res.ok) throw new Error(await res.text())
      setStatus(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  async function runEmbeddings(ids?: string[]) {
    setRunning(true)
    setResults(null)
    setError(null)
    try {
      const body: Record<string, unknown> = { reprocess }
      if (ids) body.documentIds = ids
      const res = await fetch('/api/admin/generate-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResults(data.results ?? [])
      await fetchStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Embedding failed')
    } finally {
      setRunning(false)
    }
  }

  const progressPct = status ? Math.round((status.embedded / Math.max(status.total, 1)) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            <ChevronLeft size={20} />
          </Link>
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900">Knowledge Engine</span>
            <p className="text-xs text-gray-400">Semantic search over all ZIMSEC materials</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* How it works banner */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <h2 className="font-semibold text-violet-900 mb-1 flex items-center gap-2">
            <Zap size={16} /> How the Knowledge Engine works
          </h2>
          <p className="text-sm text-violet-800">
            Each uploaded document is split into chunks and converted into AI embeddings using OpenAI.
            When a student asks the tutor a question, the system finds the most semantically relevant
            chunks from across all documents — not just the 3 newest — and feeds them to Claude as context.
            This makes the AI tutor far more accurate and grounded in your actual ZIMSEC materials.
          </p>
        </div>

        {/* Status card */}
        {status && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Embedding Status</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{status.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total documents</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{status.embedded}</p>
                <p className="text-xs text-gray-500 mt-1">Embedded</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{status.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Pending</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Coverage</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Generate Embeddings</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reprocess}
              onChange={e => setReprocess(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span className="text-sm text-gray-700">
              Re-embed already embedded documents (use when documents have been updated)
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => runEmbeddings()}
              disabled={running || !status || (status.pending === 0 && !reprocess)}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition text-sm"
            >
              {running ? (
                <><RefreshCw size={16} className="animate-spin" /> Processing…</>
              ) : (
                <><Brain size={16} /> Embed {reprocess ? 'all' : `${status?.pending ?? 0} pending`} documents</>
              )}
            </button>
          </div>

          {status?.pending === 0 && !reprocess && (
            <p className="text-sm text-emerald-600 flex items-center gap-2">
              <CheckCircle size={14} /> All documents are already embedded. Enable re-embed above to refresh them.
            </p>
          )}

          <p className="text-xs text-gray-400">
            Processes up to 50 documents per run. Run multiple times if you have more than 50.
            Each document costs ~$0.0001 in OpenAI embedding fees.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes('OPENAI_API_KEY') && (
                <p className="text-red-600 text-xs mt-1">
                  Add OPENAI_API_KEY to your Vercel environment variables and redeploy.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">
              Results — {results.filter(r => r.status === 'ok').length}/{results.length} succeeded
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                  {r.status === 'ok' ? (
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : r.status.includes('skipped') ? (
                    <Clock size={14} className="text-amber-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-gray-700 truncate">{r.title}</span>
                  {r.status === 'ok' && (
                    <span className="text-gray-400 text-xs flex-shrink-0">{r.chunks} chunks</span>
                  )}
                  {r.status !== 'ok' && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{r.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document list */}
        {status && status.docs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">All Published Documents</h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {status.docs.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  {d.embedded ? (
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Clock size={14} className="text-amber-400 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-gray-700 truncate">{d.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    d.embedded ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {d.embedded ? 'embedded' : 'pending'}
                  </span>
                  {!d.embedded && (
                    <button
                      onClick={() => runEmbeddings([d.id])}
                      disabled={running}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium flex-shrink-0 disabled:opacity-40"
                    >
                      Embed
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
