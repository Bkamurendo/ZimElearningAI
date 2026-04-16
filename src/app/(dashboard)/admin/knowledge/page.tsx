'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Brain, ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles, BookOpen, Cpu } from 'lucide-react'

interface DocStatus {
  id: string
  title: string
  status: string
  hasText: boolean
  embedded: boolean
}

interface PipelineStatus {
  total: number
  unprocessed: number
  processed: number
  embedded: number
  docs: DocStatus[]
}

interface EmbedResult {
  id: string
  title: string
  chunks: number
  status: string
}

type Stage = 'idle' | 'processing' | 'embedding' | 'done'

export default function KnowledgePage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<Stage>('idle')
  const [stageMessage, setStageMessage] = useState('')
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

  async function teachFundiEverything() {
    setStage('processing')
    setResults(null)
    setError(null)

    try {
      // Step 1: Find all unprocessed documents and process them with Claude
      const enrichRes = await fetch('/api/admin/enrich', { method: 'GET' })
      const enrichData = await enrichRes.json()
      const pendingIds = (enrichData.documents ?? []).map((d: { id: string }) => d.id)

      if (pendingIds.length > 0) {
        setStageMessage(`Step 1/2 — Extracting text from ${pendingIds.length} documents with Claude…`)
        const processRes = await fetch('/api/admin/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: pendingIds }),
        })
        if (!processRes.ok) throw new Error('Claude text extraction failed')

        // Wait for processing to complete (poll every 3s, max 2 minutes)
        setStageMessage('Step 1/2 — Waiting for Claude to finish reading all documents…')
        await waitForProcessing(30)
      } else {
        setStageMessage('Step 1/2 — All documents already read by Claude ✓')
        await new Promise(r => setTimeout(r, 800))
      }

      // Step 2: Generate embeddings for all processed docs
      setStage('embedding')
      setStageMessage('Step 2/2 — Generating semantic embeddings with OpenAI…')

      const embedRes = await fetch('/api/admin/generate-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reprocess }),
      })
      const embedData = await embedRes.json()
      if (!embedRes.ok) throw new Error(embedData.error ?? 'Embedding failed')

      setResults(embedData.results ?? [])
      await fetchStatus()
      setStage('done')
      setStageMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pipeline failed')
      setStage('idle')
      setStageMessage('')
    }
  }

  async function waitForProcessing(maxAttempts: number) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 4000))
      const res = await fetch('/api/admin/enrich?filter=all_unprocessed')
      const data = await res.json()
      if ((data.documents ?? []).length === 0) return
    }
  }

  const progressPct = status
    ? Math.round((status.embedded / Math.max(status.total, 1)) * 100)
    : 0

  const isRunning = stage === 'processing' || stage === 'embedding'

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
            <span className="font-bold text-gray-900">Fundi AI — Knowledge Engine</span>
            <p className="text-xs text-gray-400">Train Fundi AI on all your ZIMSEC materials</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading || isRunning}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* How it works */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <h2 className="font-semibold text-violet-900 mb-2 flex items-center gap-2">
            <Sparkles size={16} /> How Fundi AI learns your materials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded-xl p-3 border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-violet-800">Step 1 — Read</span>
              </div>
              <p className="text-xs text-gray-600">Claude reads every PDF and extracts all the text and key topics</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-violet-800">Step 2 — Understand</span>
              </div>
              <p className="text-xs text-gray-600">OpenAI converts each passage into a semantic embedding vector</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-violet-800">Step 3 — Answer</span>
              </div>
              <p className="text-xs text-gray-600">When a student asks a question, Fundi finds the most relevant passages and answers from them</p>
            </div>
          </div>
        </div>

        {/* Pipeline status */}
        {status && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Training Status</h2>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{status.total}</p>
                <p className="text-xs text-gray-500 mt-1">Total documents</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{status.unprocessed}</p>
                <p className="text-xs text-gray-500 mt-1">Not yet read</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{status.processed}</p>
                <p className="text-xs text-gray-500 mt-1">Read, not embedded</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{status.embedded}</p>
                <p className="text-xs text-gray-500 mt-1">Fully trained</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Training coverage</span>
                <span>{status.embedded} of {status.total} documents ({progressPct}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {status.embedded === status.total && status.total > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3">
                <CheckCircle size={16} />
                Fundi AI has learned all {status.total} documents. Students are getting the best possible answers.
              </div>
            )}
          </div>
        )}

        {/* Main action */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Train Fundi AI</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reprocess}
              onChange={e => setReprocess(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span className="text-sm text-gray-700">
              Re-train already learned documents (use after updating document content)
            </span>
          </label>

          {/* Running state */}
          {isRunning && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
              <RefreshCw size={16} className="text-violet-600 animate-spin mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-violet-800 text-sm">Training in progress…</p>
                <p className="text-violet-700 text-xs mt-0.5">{stageMessage}</p>
                <p className="text-violet-500 text-xs mt-1">This can take several minutes for large document sets. Do not close this page.</p>
              </div>
            </div>
          )}

          {stage === 'done' && !error && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={16} className="text-emerald-600" />
              <p className="text-emerald-800 text-sm font-semibold">Training complete! Fundi AI has learned your latest documents.</p>
            </div>
          )}

          <button
            onClick={teachFundiEverything}
            disabled={isRunning || (status?.total === 0)}
            className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 px-6 rounded-xl transition text-sm"
          >
            {isRunning ? (
              <><RefreshCw size={16} className="animate-spin" /> Training Fundi AI…</>
            ) : (
              <><Brain size={16} /> Teach Fundi AI Everything</>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Processes up to 20 documents per run with Claude, then embeds up to 50 at a time.
            Run again if you have more documents. Cost: ~$0.0001 per document for embeddings.
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

        {/* Embedding results */}
        {results && results.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">
              Embedding results — {results.filter(r => r.status === 'ok').length}/{results.length} succeeded
            </h2>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0 text-sm">
                  {r.status === 'ok'
                    ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    : r.status.includes('skipped')
                    ? <Clock size={13} className="text-amber-500 flex-shrink-0" />
                    : <XCircle size={13} className="text-red-500 flex-shrink-0" />}
                  <span className="flex-1 text-gray-700 truncate">{r.title}</span>
                  {r.status === 'ok'
                    ? <span className="text-gray-400 text-xs flex-shrink-0">{r.chunks} chunks</span>
                    : <span className="text-xs text-gray-400 flex-shrink-0">{r.status}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document list */}
        {status && status.docs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">All Documents</h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {status.docs.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  {d.embedded
                    ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    : d.hasText
                    ? <Clock size={13} className="text-blue-400 flex-shrink-0" />
                    : <Clock size={13} className="text-amber-400 flex-shrink-0" />}
                  <span className="flex-1 text-sm text-gray-700 truncate">{d.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    d.embedded
                      ? 'bg-emerald-50 text-emerald-700'
                      : d.hasText
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {d.embedded ? 'trained' : d.hasText ? 'read, not embedded' : 'not yet read'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
