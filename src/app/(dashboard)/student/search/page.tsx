export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Search, FileText, BookOpen, ChevronRight } from 'lucide-react'
import SearchClient from './SearchClient'

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  past_paper:     { label: 'Past Paper',     icon: '📝', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  marking_scheme: { label: 'Mark Scheme',    icon: '✅', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  notes:          { label: 'Study Notes',    icon: '📖', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  textbook:       { label: 'Textbook',       icon: '📚', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  syllabus:       { label: 'Syllabus',       icon: '🗂️',  color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200' },
  other:          { label: 'Resource',       icon: '📄', color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
}

type DocRow = {
  id: string
  title: string
  document_type: string
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  ai_summary: string | null
  topics: string[] | null
  file_size: number | null
  created_at: string
  subject: { name: string; code: string } | null
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; level?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query   = searchParams.q?.trim() ?? ''
  const docType = searchParams.type ?? 'all'
  const level   = searchParams.level ?? 'all'

  // Build search query
  let dbQuery = supabase
    .from('uploaded_documents')
    .select('id, title, document_type, zimsec_level, year, paper_number, ai_summary, topics, file_size, created_at, subject:subjects(name, code)')
    .eq('moderation_status', 'published')
    .order('created_at', { ascending: false })
    .limit(60)

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%`)
  }
  if (docType !== 'all') {
    dbQuery = dbQuery.eq('document_type', docType)
  }
  if (level !== 'all') {
    dbQuery = dbQuery.eq('zimsec_level', level)
  }

  const { data } = await dbQuery as { data: DocRow[] | null; error: unknown }
  const docs = data ?? []

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Search size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Search Resources</h1>
                <p className="text-gray-400 text-xs mt-0.5">948+ ZIMSEC documents at your fingertips</p>
              </div>
            </div>
            {/* Client-side search bar */}
            <SearchClient initialQuery={query} initialType={docType} initialLevel={level} />
          </div>
        </div>

        {/* Results summary */}
        {query && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Search size={14} />
            <span>
              {docs.length} result{docs.length !== 1 ? 's' : ''} for &ldquo;<span className="font-semibold text-gray-900">{query}</span>&rdquo;
              {docType !== 'all' && ` · ${DOC_TYPE_CONFIG[docType]?.label}`}
              {level !== 'all' && ` · ${level === 'primary' ? 'Primary' : level === 'olevel' ? 'O-Level' : 'A-Level'}`}
            </span>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {/* Level filters */}
          {(['all', 'primary', 'olevel', 'alevel'] as const).map((lvl) => {
            const labels = { all: 'All Levels', primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }
            const active = level === lvl
            const href = `/student/search?${new URLSearchParams({
              ...(query ? { q: query } : {}),
              ...(docType !== 'all' ? { type: docType } : {}),
              ...(lvl !== 'all' ? { level: lvl } : {}),
            }).toString()}`
            return (
              <Link
                key={lvl}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {labels[lvl]}
              </Link>
            )
          })}
          <span className="text-gray-200">|</span>
          {/* Type filters */}
          {(['all', 'past_paper', 'marking_scheme', 'notes', 'textbook', 'syllabus'] as const).map((t) => {
            const label = t === 'all' ? 'All Types' : DOC_TYPE_CONFIG[t]?.label ?? t
            const active = docType === t
            const href = `/student/search?${new URLSearchParams({
              ...(query ? { q: query } : {}),
              ...(t !== 'all' ? { type: t } : {}),
              ...(level !== 'all' ? { level } : {}),
            }).toString()}`
            return (
              <Link
                key={t}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {t !== 'all' && DOC_TYPE_CONFIG[t]?.icon} {label}
              </Link>
            )
          })}
        </div>

        {/* Results */}
        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {query ? <Search size={28} className="text-gray-300" /> : <BookOpen size={28} className="text-gray-300" />}
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">
              {query ? 'No results found' : 'Search ZIMSEC Resources'}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {query
                ? `No published documents match &ldquo;${query}&rdquo;. Try different keywords or remove filters.`
                : 'Type keywords like "Physics", "Maths 2022", "O-Level notes" or a document title to search across all published resources.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const config = DOC_TYPE_CONFIG[doc.document_type] ?? DOC_TYPE_CONFIG.other
              const subjectCode = doc.subject?.code ?? 'unknown'
              return (
                <Link
                  key={doc.id}
                  href={`/student/resources/${subjectCode}/${doc.id}`}
                  className="group flex gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${config.bg}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          {doc.zimsec_level && (
                            <span className="text-xs text-gray-500 font-medium capitalize">
                              {doc.zimsec_level === 'olevel' ? 'O-Level' : doc.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'}
                            </span>
                          )}
                          {doc.year && <span className="text-xs text-gray-500">{doc.year}</span>}
                          {doc.paper_number && <span className="text-xs text-gray-400">· Paper {doc.paper_number}</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{doc.title}</h3>
                        {doc.subject && (
                          <p className="text-xs text-gray-400 mt-0.5">{doc.subject.name}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition" />
                    </div>
                    {doc.ai_summary && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{doc.ai_summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(doc.topics ?? []).slice(0, 3).map((t) => (
                        <span key={t} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {doc.file_size && (
                        <span className="text-xs text-gray-400 ml-auto">{formatSize(doc.file_size)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {docs.length === 60 && (
          <p className="text-center text-sm text-gray-400 py-4">
            Showing first 60 results. Refine your search for more specific results.
          </p>
        )}

        {/* Footer CTA */}
        {!query && docs.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3">Or browse by subject:</p>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <FileText size={15} />
              Go to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
