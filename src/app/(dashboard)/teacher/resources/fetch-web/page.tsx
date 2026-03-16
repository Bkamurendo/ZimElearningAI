'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Globe, Loader2, CheckCircle, XCircle, AlertCircle,
  ArrowLeft, ChevronDown,
} from 'lucide-react'

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
  { value: 'primary', label: 'Primary' },
  { value: 'olevel',  label: 'O-Level' },
  { value: 'alevel',  label: 'A-Level' },
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

export default function TeacherFetchWebPage() {
  const router = useRouter()
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tp } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!tp) return

      const { data: ts } = await supabase
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', tp.id)

      const subjectIds = (ts ?? []).map((t: { subject_id: string }) => t.subject_id)
      if (subjectIds.length === 0) return

      const { data: subjectRows } = await supabase
        .from('subjects')
        .select('id, name, code, zimsec_level')
        .in('id', subjectIds)
        .order('name')

      if (subjectRows) {
        const subs = subjectRows as SubjectOption[]
        setSubjects(subs)
        if (subs.length > 0) {
          setForm((p) => ({ ...p, subject_id: subs[0].id }))
        }
      }
    }
    loadSubjects()
  }, [])

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

  const savedCount = results?.filter((r) => r.status === 'saved').length ?? 0
  const errorCount = results?.filter((r) => r.status === 'error').length ?? 0
  const showYearPaper = ['past_paper', 'marking_scheme'].includes(form.document_type)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <Link href="/teacher/resources" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition">
              <ArrowLeft size={14} />
              My Resources
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                <Globe size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Fetch from Web</h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  Import ZIMSEC past papers and study materials from educational websites
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fetch form */}
        <form onSubmit={handleFetch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:font-sans placeholder:text-gray-400"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8"
                >
                  <option value="">Select subject</option>
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8"
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
                      ? 'bg-blue-600 text-white shadow-sm'
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8"
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
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-blue-900">Auto-discover PDFs</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Automatically find and import PDF links found on HTML pages
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoDiscover((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                autoDiscover ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoDiscover ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Moderation notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold">Moderation Required</p>
              <p className="mt-0.5">
                Fetched documents will be AI-reviewed. They&apos;ll appear in your resources immediately
                but will only be shared with students after admin approval.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!urls.trim() || fetching}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {fetching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Fetching &amp; processing…
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
                      <p className="text-xs text-blue-600 mt-1">
                        + {r.discovered_count} PDF{r.discovered_count !== 1 ? 's' : ''} discovered on page
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {savedCount > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => router.push('/teacher/resources')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition"
                >
                  View My Resources →
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
