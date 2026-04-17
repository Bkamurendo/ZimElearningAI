import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Upload, Search, Sparkles, Lock } from 'lucide-react'

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  past_paper:     { label: 'Past Paper',     icon: '📝', color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  marking_scheme: { label: 'Mark Scheme',    icon: '✅', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  notes:          { label: 'Study Notes',    icon: '📖', color: 'text-indigo-700',bg: 'bg-indigo-50 border-indigo-200' },
  textbook:       { label: 'Textbook',       icon: '📚', color: 'text-purple-700',bg: 'bg-purple-50 border-purple-200' },
  syllabus:       { label: 'Syllabus',       icon: '🗂️',  color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200' },
  other:          { label: 'Resource',       icon: '📄', color: 'text-gray-700',  bg: 'bg-gray-50 border-gray-200' },
}

const FILTER_TABS = [
  { value: 'all',            label: 'All',         icon: '📂' },
  { value: 'past_paper',     label: 'Past Papers', icon: '📝' },
  { value: 'marking_scheme', label: 'Mark Schemes',icon: '✅' },
  { value: 'notes',          label: 'Notes',       icon: '📖' },
  { value: 'textbook',       label: 'Textbooks',   icon: '📚' },
]

type DocumentRow = {
  id: string
  title: string
  document_type: string
  zimsec_level: string | null
  year: number | null
  paper_number: number | null
  ai_summary: string | null
  topics: string[] | null
  file_size: number | null
  uploaded_by: string
  uploader_role: string
  created_at: string
}

export default async function StudentResourcesPage({
  params,
  searchParams,
}: {
  params: { subjectCode: string }
  searchParams: { filter?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const subjectCode = params.subjectCode
  const activeFilter = searchParams.filter ?? 'all'

  // Get subject info
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('code', subjectCode)
    .single() as { data: { id: string; name: string; code: string; zimsec_level: string } | null; error: unknown }

  if (!subject) redirect('/student/dashboard')

  const { data: planProfile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPaid = ['starter', 'pro', 'elite'].includes(planProfile?.plan ?? 'free')

  // Build query — published docs for this subject OR own uploads
  let query = supabase
    .from('uploaded_documents')
    .select('id, title, document_type, zimsec_level, year, paper_number, ai_summary, topics, file_size, uploaded_by, uploader_role, created_at')
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    query = query.eq('document_type', activeFilter)
  }

  const { data: allDocs } = await query as { data: DocumentRow[] | null; error: unknown }

  // RLS policies on uploaded_documents handle visibility — no additional filter needed
  const docs = allDocs ?? []

  // Counts per type for filter badges (use full list for accurate counts)
  const countByType: Record<string, number> = {}
  for (const d of docs) {
    countByType[d.document_type] = (countByType[d.document_type] ?? 0) + 1
  }
  const totalCount = docs.length

  // Free users see 3 documents as a teaser; paid users see all
  const FREE_LIMIT = 3
  const visibleDocs = isPaid ? docs : docs.slice(0, FREE_LIMIT)
  const lockedCount = isPaid ? 0 : Math.max(0, docs.length - FREE_LIMIT)

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`
  }

  const levelLabel = subject.zimsec_level === 'primary' ? 'Primary'
    : subject.zimsec_level === 'olevel' ? 'O-Level' : 'A-Level'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href={`/student/subjects/${subjectCode}`} className="text-gray-400 hover:text-gray-600 transition">
            {subject.name}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">Resources</span>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {levelLabel}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <p className="text-indigo-200 text-sm mt-1">
                {totalCount} resource{totalCount !== 1 ? 's' : ''} available
              </p>
            </div>
            <Link
              href={`/student/solver?subject=${subjectCode}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition border border-white/20 flex-shrink-0"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Problem Solver</span>
              <span className="sm:hidden">Solver</span>
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const count = tab.value === 'all' ? totalCount : (countByType[tab.value] ?? 0)
            const active = activeFilter === tab.value
            return (
              <Link
                key={tab.value}
                href={`/student/resources/${subjectCode}${tab.value !== 'all' ? `?filter=${tab.value}` : ''}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Document list */}
        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No resources yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {activeFilter === 'all'
                ? 'No documents have been published for this subject yet. Check back soon!'
                : `No ${DOC_TYPE_CONFIG[activeFilter]?.label ?? 'documents'} available for this subject yet.`}
            </p>
            <Link
              href={`/student/subjects/${subjectCode}`}
              className="inline-flex items-center gap-2 mt-5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to subject
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDocs.map((doc) => {
              const config = DOC_TYPE_CONFIG[doc.document_type] ?? DOC_TYPE_CONFIG.other
              const isOwn = doc.uploaded_by === user.id
              return (
                <Link
                  key={doc.id}
                  href={`/student/resources/${subjectCode}/${doc.id}`}
                  className="group flex gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  {/* Type icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${config.bg}`}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          {doc.year && (
                            <span className="text-xs text-gray-500 font-medium">{doc.year}</span>
                          )}
                          {doc.paper_number && (
                            <span className="text-xs text-gray-400">· Paper {doc.paper_number}</span>
                          )}
                          {isOwn && (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              My Upload
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                          {doc.title}
                        </h3>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition" />
                    </div>

                    {doc.ai_summary && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.ai_summary}
                      </p>
                    )}

                    {/* Topics + meta */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {(doc.topics ?? []).slice(0, 3).map((topic) => (
                        <span key={topic} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                      {doc.file_size && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatSize(doc.file_size)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Locked resources upgrade card */}
            {lockedCount > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lock size={22} className="text-indigo-500" />
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">
                  {lockedCount} more resource{lockedCount !== 1 ? 's' : ''} locked
                </p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                  Upgrade to access all {totalCount} resources for {subject.name}, plus AI study tools, model answers and practice questions.
                </p>
                <Link
                  href="/student/upgrade"
                  className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition"
                >
                  Unlock all resources — from $2/month →
                </Link>
                <p className="text-[10px] text-gray-400 mt-2">Less than the cost of one exercise book</p>
              </div>
            )}
          </div>
        )}

        {/* Upload prompt */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-indigo-900 text-sm">Have a useful resource?</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Upload past papers, notes or textbook excerpts. All uploads are reviewed before being shared with other students.
            </p>
          </div>
          <Link
            href={`/student/resources/${subjectCode}/upload`}
            className="flex-shrink-0 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition"
          >
            Upload
          </Link>
        </div>

      </div>
    </div>
  )
}
