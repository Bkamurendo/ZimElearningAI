'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Globe, Loader2, CheckCircle, XCircle, AlertCircle,
  ExternalLink, ArrowLeft, Sparkles, ChevronDown,
} from 'lucide-react'

const SUGGESTED_SOURCES = [
  { label: 'ZIMSEC Official',      url: 'https://www.zimsec.co.zw',             desc: 'Official past papers & syllabi',      emoji: '🏛️' },
  { label: 'PastPapers.co.zw',     url: 'https://www.pastpapers.co.zw',         desc: 'ZIMSEC past exam papers archive',     emoji: '📄' },
  { label: 'Zim Education',        url: 'https://www.zimeducation.co.zw',       desc: 'Educational resources & notes',       emoji: '📚' },
  { label: 'NotesMaster Zimbabwe', url: 'https://www.notesmaster.com/zimbabwe', desc: 'Student notes & study guides',        emoji: '📝' },
  { label: 'Cambridge Zimbabwe',   url: 'https://cambridgeresources.co.zw',     desc: 'Cambridge-aligned ZIMSEC resources',  emoji: '🌍' },
]

const DOC_TYPES = [
  { value: 'past_paper',     label: 'Past Exam Paper' },
  { value: 'marking_scheme', label: 'Marking Scheme' },
  { value: 'notes',          label: 'Study Notes' },
  { value: 'textbook',       label: 'Textbook / Chapter' },
  { value: 'syllabus',       label: 'ZIMSEC Syllabus' },
  { value: 'other',          label: 'Other Resource' },
]

const ZIMSEC_LEVELS = [
  { value: '',        label: 'Any Level' },
  { value: 'primary', label: 'Primary (ECD–Grade 7)' },
  { value: 'olevel',  label: 'O-Level (Form 1–4)' },
  { value: 'alevel',  label: 'A-Level (Form 5–6)' },
]

type SubjectOption = { id: string; name: string; code: string; zimsec_level: string }

type FetchResult = {
  url: string
  status: 'saved' | 'error'
  document_id?: string
  title?: string
  discovered_count?: number
  error?: string
}

export default function AdminFetchWebPage() {
  const [urls, setUrls] = useState('')
  const [form, setForm] = useState({
    document_type: 'past_paper',
    subject_id: '',
    zimsec_level: '',
    year: '',
    paper_number: '',
  })
  const [autoDiscover, setAutoDiscover] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [results, setResults] = useState<FetchResult[] | null>(null)
  const [subjects, setSubjects] = useState<SubjectOption[]>([])

  useEffect(() => {
    async function loadSubjects() {
      const supabase = createClient()
      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, zimsec_level')
        .order('name')
      if (data) setSubjects(data as SubjectOption[])
    }
    loadSubjects()
  }, [])

  function appendUrl(url: string) {
    setUrls((prev) => {
      const lines = prev.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.includes(url)) return prev
      return lines.length === 0 ? url : prev.trimEnd() + '\n' + url
    })
  }

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault()
    const urlList = urls.split('\n').map((u) => u.trim()).filter(Boolean)
    if (urlList.length === 0) return

    setFetching(true)
    setResults(null)

    try {
      const res = await fetch('/api/documents/fetch-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urlList,
          document_type: form.document_type,
          subject_id: form.subject_id || undefined,
          zimsec_level: form.zimsec_level || undefined,
          year: form.year ? Number(form.year) : undefined,
          paper_number: form.paper_number ? Number(form.paper_number) : undefined,
          auto_discover: autoDiscover,
        }),
      })

      const data = await res.json() as { results: FetchResult[]; total_saved: number }
      setResults(data.results ?? [])
    } catch {
      setResults([{ url: 'fetch-error', status: 'error', error: 'Network error — could not reach server.' }])
    } finally {
      setFetching(false)
    }
  }

  const savedCount  = results?.filter((r) => r.status === 'saved').length ?? 0
  const errorCount  = results?.filter((r) => r.status === 'error').length ?? 0
  const showYearPaper = ['past_paper', 'marking_scheme'].includes(form.document_type)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="relative">
            <Link href="/admin/documents" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-4 transition">
              <ArrowLeft size={14} />
              Document Library
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                <Globe size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Fetch from Web</h1>
                <p className="text-indigo-200 text-sm mt-0.5">
                  Automatically import ZIMSEC content from educational websites
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested sources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">Suggested ZIMSEC Sources</h2>
            <span className="text-xs text-gray-400">Click to add URL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUGGESTED_SOURCES.map((src) => (
              <button
                key={src.url}
                type="button"
                onClick={() => appendUrl(src.url)}
                className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl text-left transition group"
              >
                <span className="text-xl flex-shrink-0">{src.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 truncate">{src.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{src.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fetch form */}
        <form onSubmit={handleFetch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Fetch Configuration</h2>

          {/* URL textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              URLs to Fetch <span className="text-red-400">*</span>
              <span className="text-gray-400 normal-case font-normal ml-1">(one per line, max 5)</span>
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              placeholder={'https://www.zimsec.co.zw\nhttps://www.pastpapers.co.zw/maths-2023.pdf'}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:font-sans placeholder:text-gray-400"
            />
          </div>

          {/* Subject + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Subject</label>
              <div className="relative">
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8"
                >
                  <option value="">Any Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Document Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.document_type}
                  onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ZIMSEC Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">ZIMSEC Level</label>
            <div className="flex gap-2 flex-wrap">
              {ZIMSEC_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, zimsec_level: lvl.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    form.zimsec_level === lvl.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year + Paper (conditional) */}
          {showYearPaper && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Examination Year
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2030"
                  value={form.year}
                  onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                  placeholder="e.g. 2023"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Paper Number
                </label>
                <div className="relative">
                  <select
                    value={form.paper_number}
                    onChange={(e) => setForm((p) => ({ ...p, paper_number: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-8"
                  >
                    <option value="">Any Paper</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>Paper {n}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Auto-discover toggle */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-indigo-900">Auto-discover PDFs</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                When fetching an HTML page, automatically find and import all PDF links on that page
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoDiscover((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                autoDiscover ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoDiscover ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={!urls.trim() || fetching}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {fetching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Fetching & processing…
              </>
            ) : (
              <>
                <Globe size={16} />
                Fetch &amp; Process
              </>
            )}
          </button>
        </form>

        {/* Results */}
        {results !== null && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Fetch Results</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {savedCount} saved · {errorCount} error{errorCount !== 1 ? 's' : ''}
                </p>
              </div>
              {savedCount > 0 && (
                <Link
                  href="/admin/documents"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  View Document Library →
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {r.status === 'saved' ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {r.title && (
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{r.title}</p>
                    )}
                    <p className="text-xs text-gray-400 truncate">{r.url}</p>
                    {r.status === 'error' && r.error && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {r.error}
                      </p>
                    )}
                    {r.status === 'saved' && r.discovered_count !== undefined && r.discovered_count > 0 && (
                      <p className="text-xs text-indigo-600 mt-1">
                        + {r.discovered_count} PDF{r.discovered_count !== 1 ? 's' : ''} discovered on page
                      </p>
                    )}
                  </div>
                  {r.status === 'saved' && r.document_id && (
                    <Link
                      href={`/admin/documents`}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 transition"
                      title="View in library"
                    >
                      <ExternalLink size={14} />
                    </Link>
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
