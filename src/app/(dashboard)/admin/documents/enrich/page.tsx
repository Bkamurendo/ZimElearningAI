'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Loader2, CheckCircle2, AlertCircle, RefreshCw, Clock } from 'lucide-react'

type DocRow = {
  id: string
  title: string
  document_type: string
  moderation_status: string
  uploader_role: string
  created_at: string
  ai_summary: string | null
  file_name: string
  subject: { name: string; code: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  past_paper: 'Past Paper', notes: 'Notes', textbook: 'Textbook',
  syllabus: 'Syllabus', marking_scheme: 'Marking Scheme', other: 'Other',
}

const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  ai_reviewed:'bg-amber-100 text-amber-700',
  published:  'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
}

export default function BulkEnrichPage() {
  const [filter, setFilter] = useState<'pending' | 'no_summary' | 'all_unprocessed'>('pending')
  const [docs, setDocs] = useState<DocRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ triggered: number; failed: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/enrich?filter=${filter}`)
      const json = await res.json()
      setDocs(json.documents ?? [])
      setSelected(new Set())
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  function toggleAll() {
    if (selected.size === docs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(docs.map(d => d.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function processSelected() {
    if (selected.size === 0) return
    setProcessing(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const json = await res.json()
      setResult({ triggered: json.triggered ?? 0, failed: json.failed ?? 0 })
      // Refresh after 3s to show updated statuses
      setTimeout(() => load(), 3000)
    } catch {
      setResult({ triggered: 0, failed: selected.size })
    }
    setProcessing(false)
  }

  const allSelected = docs.length > 0 && selected.size === docs.length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/documents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition mb-4">
            <ArrowLeft size={16} /> Document Library
          </Link>
          <div className="relative bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bulk AI Enrichment</h1>
                  <p className="text-violet-200 text-sm mt-0.5">
                    Batch process documents with AI — extract text, generate summaries, moderate content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Show documents
              </label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'pending',         label: 'Pending processing' },
                  { key: 'no_summary',      label: 'Missing AI summary' },
                  { key: 'all_unprocessed', label: 'All unprocessed' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      filter === key
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold ${
            result.failed === 0
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {result.failed === 0
              ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              : <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />}
            {result.failed === 0
              ? `✓ ${result.triggered} document${result.triggered !== 1 ? 's' : ''} queued for AI processing. The list will refresh shortly.`
              : `${result.triggered} triggered, ${result.failed} failed. Check document file paths.`}
          </div>
        )}

        {/* Document list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-violet-600"
                disabled={docs.length === 0}
              />
              <span className="text-sm text-gray-600">
                {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
                {selected.size > 0 && <span className="ml-1 text-violet-600 font-semibold">· {selected.size} selected</span>}
              </span>
            </div>
            <button
              onClick={processSelected}
              disabled={selected.size === 0 || processing}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              {processing
                ? <Loader2 size={15} className="animate-spin" />
                : <Zap size={15} />}
              {processing
                ? 'Processing…'
                : selected.size > 0
                  ? `Process ${selected.size} document${selected.size !== 1 ? 's' : ''}`
                  : 'Select documents'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-16 px-6">
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No documents match the current filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {docs.map(doc => (
                <div key={doc.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition ${selected.has(doc.id) ? 'bg-violet-50/30' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggleOne(doc.id)}
                    className="w-4 h-4 rounded accent-violet-600 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-xs text-gray-400">{TYPE_LABELS[doc.document_type] ?? doc.document_type}</span>
                          {doc.subject && (
                            <span className="text-xs text-gray-400">· {doc.subject.name}</span>
                          )}
                          <span className="text-xs text-gray-400 capitalize">· by {doc.uploader_role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[doc.moderation_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {doc.moderation_status === 'processing'
                            ? <span className="flex items-center gap-1"><Clock size={10} /> Processing</span>
                            : doc.moderation_status}
                        </span>
                        {!doc.ai_summary && (
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                            No summary
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{doc.file_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-violet-800 mb-2">How bulk enrichment works</p>
          <ul className="space-y-1.5 text-xs text-violet-700">
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> Select one or more documents and click <strong>Process</strong></li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> Claude reads each PDF, extracts text, generates an AI summary, and identifies key topics</li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> A second moderation pass checks each document is appropriate for ZIMSEC students</li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> Admin-uploaded documents that pass are auto-published; teacher uploads await review</li>
            <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> Processing takes 15–60 seconds per document — batch up to 20 at a time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
