import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Upload, Search, Sparkles, Lock } from 'lucide-react'
import { isPremium } from '@/lib/subscription'

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; headingBg: string; headingText: string }> = {
  past_paper:     { label: 'Past Paper',     icon: '📝', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    headingBg: 'bg-blue-50 border-blue-200',    headingText: 'text-blue-800'   },
  marking_scheme: { label: 'Mark Scheme',    icon: '✅', color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  headingBg: 'bg-green-50 border-green-200',  headingText: 'text-green-800'  },
  notes:          { label: 'Study Notes',    icon: '📖', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',headingBg: 'bg-indigo-50 border-indigo-200',headingText: 'text-indigo-800' },
  textbook:       { label: 'Textbook',       icon: '📚', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200',headingBg: 'bg-purple-50 border-purple-200',headingText: 'text-purple-800' },
  syllabus:       { label: 'Syllabus',       icon: '🗂️', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',headingBg: 'bg-orange-50 border-orange-200',headingText: 'text-orange-800' },
  other:          { label: 'Resource',       icon: '📄', color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200',    headingBg: 'bg-gray-50 border-gray-200',    headingText: 'text-gray-800'   },
}

// Display order for grouped sections
const TYPE_ORDER = ['past_paper', 'marking_scheme', 'notes', 'textbook', 'syllabus', 'other']

const FILTER_TABS = [
  { value: 'all',            label: 'All',         icon: '📂' },
  { value: 'past_paper',     label: 'Past Papers', icon: '📝' },
  { value: 'marking_scheme', label: 'Mark Schemes',icon: '✅' },
  { value: 'notes',          label: 'Notes',       icon: '📖' },
  { value: 'textbook',       label: 'Textbooks',   icon: '📚' },
  { value: 'syllabus',       label: 'Syllabi',     icon: '🗂️' },
]

// Level-based breadcrumb config
const LEVEL_BREADCRUMBS: Record<string, { label: string; href: string; color: string }> = {
  primary: { label: 'Primary School', href: '/student/resources/primary', color: 'text-emerald-600' },
  olevel:  { label: 'O-Level',        href: '/student/resources/olevel',  color: 'text-blue-600'    },
  alevel:  { label: 'A-Level',        href: '/student/resources/alevel',  color: 'text-purple-600'  },
}

const LEVEL_ACCENT: Record<string, string> = {
  primary: 'hover:border-emerald-300',
  olevel:  'hover:border-blue-300',
  alevel:  'hover:border-purple-300',
}

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
  searchParams: { filter?: string; year?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, pro_expires_at, trial_ends_at')
    .eq('id', user.id)
    .single()

  const isUserPremium = isPremium(profile)

  const subjectCode = params.subjectCode
  const activeFilter = searchParams.filter ?? 'all'
  const yearFilter = searchParams.year ?? ''

  // Get subject info
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('code', subjectCode)
    .single() as { data: { id: string; name: string; code: string; zimsec_level: string } | null; error: unknown }

  if (!subject) redirect('/student/resources')

  // Build query — enforce zimsec_level match to prevent cross-level contamination
  // (e.g. Primary resources leaking into O-Level folders, or wrong-subject docs showing here)
  let query = supabase
    .from('uploaded_documents')
    .select('id, title, document_type, zimsec_level, year, paper_number, ai_summary, topics, file_size, uploaded_by, uploader_role, created_at')
    .eq('subject_id', subject.id)
    .eq('zimsec_level', subject.zimsec_level)   // ← level guard: blocks mislabeled cross-level docs
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (activeFilter !== 'all') {
    query = query.eq('document_type', activeFilter)
  }
  if (yearFilter) {
    query = query.eq('year', parseInt(yearFilter))
  }

  const { data: allDocs } = await query as { data: DocumentRow[] | null; error: unknown }

  // RLS handles visibility — no extra filter needed
  const docs = allDocs ?? []

  // Counts per type (always from full unfiltered for tab badges — same level guard)
  const { data: allDocsForCount } = await supabase
    .from('uploaded_documents')
    .select('document_type')
    .eq('subject_id', subject.id)
    .eq('zimsec_level', subject.zimsec_level) as { data: { document_type: string }[] | null; error: unknown }

  const countByType: Record<string, number> = {}
  for (const d of allDocsForCount ?? []) {
    countByType[d.document_type] = (countByType[d.document_type] ?? 0) + 1
  }
  const totalCount = (allDocsForCount ?? []).length

  // Distinct years for past papers (year picker)
  const distinctYears = Array.from(new Set(
    docs.map(d => d.year).filter((y): y is number => y !== null)
  )).sort((a, b) => b - a)

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`
  }

  const levelBreadcrumb = LEVEL_BREADCRUMBS[subject.zimsec_level]
  const levelLabel = levelBreadcrumb?.label ?? subject.zimsec_level
  const levelAccent = LEVEL_ACCENT[subject.zimsec_level] ?? 'hover:border-indigo-300'

  // Group docs by type for the "all" view
  const groupedDocs: Record<string, DocumentRow[]> = {}
  for (const doc of docs) {
    const type = doc.document_type
    if (!groupedDocs[type]) groupedDocs[type] = []
    groupedDocs[type].push(doc)
  }
  const presentTypes = TYPE_ORDER.filter(t => (groupedDocs[t]?.length ?? 0) > 0)

  // For non-"all" views, just render flat list
  const showGrouped = activeFilter === 'all' && docs.length > 0

  // Gate content for free users
  const DISPLAY_LIMIT = 3
  const isGated = !isUserPremium && docs.length > DISPLAY_LIMIT

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href="/student/resources" className="text-gray-400 hover:text-gray-600 transition">
            Library
          </Link>
          {levelBreadcrumb && (
            <>
              <ChevronRight size={14} className="text-gray-300" />
              <Link href={levelBreadcrumb.href} className={`${levelBreadcrumb.color} hover:opacity-70 transition font-medium`}>
                {levelBreadcrumb.label}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">{subject.name}</span>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
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

        {/* Year filter — shown when past papers are visible */}
        {(activeFilter === 'all' || activeFilter === 'past_paper') && distinctYears.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Filter by year:</span>
            {yearFilter && (
              <Link
                href={`/student/resources/${subjectCode}${activeFilter !== 'all' ? `?filter=${activeFilter}` : ''}`}
                className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition"
              >
                ✕ Clear ({yearFilter})
              </Link>
            )}
            {distinctYears.map((yr) => (
              <Link
                key={yr}
                href={`/student/resources/${subjectCode}?${activeFilter !== 'all' ? `filter=${activeFilter}&` : ''}year=${yr}`}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                  yearFilter === String(yr)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {yr}
              </Link>
            ))}
          </div>
        )}

        {/* Document list */}
        {docs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No resources found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {activeFilter === 'all'
                ? 'No documents have been published for this subject yet. Check back soon!'
                : `No ${DOC_TYPE_CONFIG[activeFilter]?.label ?? 'documents'} available for this subject yet.`}
              {yearFilter ? ` (filtered to ${yearFilter})` : ''}
            </p>
            {(activeFilter !== 'all' || yearFilter) && (
              <Link
                href={`/student/resources/${subjectCode}`}
                className="inline-flex items-center gap-2 mt-5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← View all resources
              </Link>
            )}
          </div>
        ) : showGrouped ? (
          /* ── Grouped view (all filter) ── */
          <div className="space-y-6">
            {(() => {
              let totalDisplayed = 0
              return presentTypes.map((type) => {
                const cfg = DOC_TYPE_CONFIG[type] ?? DOC_TYPE_CONFIG.other
                const typeDocs = groupedDocs[type] ?? []

                // If we've already hit the limit, don't show any more sections (or show empty ones?)
                // Actually, let's keep showing sections but stop adding docs once limit reached.
                if (isGated && totalDisplayed >= DISPLAY_LIMIT) return null

                const docsToRender = isGated
                  ? typeDocs.slice(0, Math.max(0, DISPLAY_LIMIT - totalDisplayed))
                  : typeDocs

                totalDisplayed += docsToRender.length

                if (docsToRender.length === 0) return null

                return (
                  <div key={type}>
                    {/* Section header */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-2 ${cfg.headingBg}`}>
                      <span className="text-base">{cfg.icon}</span>
                      <span className={`font-bold text-sm ${cfg.headingText}`}>{cfg.label}s</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 ${cfg.headingText}`}>
                        {typeDocs.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {docsToRender.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          subjectCode={subjectCode}
                          userId={user.id}
                          config={cfg}
                          levelAccent={levelAccent}
                          formatSize={formatSize}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            })()}

            {isGated && (
              <Link
                href="/student/upgrade"
                className="group flex items-center justify-between p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all text-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-500">
                    <Lock size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-indigo-900 text-sm">{docs.length - DISPLAY_LIMIT} more resources locked</p>
                    <p className="text-xs text-indigo-600">Upgrade to Pro for full access from just $2/month</p>
                  </div>
                </div>
                <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-indigo-700 transition">
                  Unlock All
                </div>
              </Link>
            )}
          </div>
        ) : (
          /* ── Flat view (filtered) ── */
          <div className="space-y-3">
            {docs.slice(0, isGated ? DISPLAY_LIMIT : undefined).map((doc) => {
              const config = DOC_TYPE_CONFIG[doc.document_type] ?? DOC_TYPE_CONFIG.other
              return (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  subjectCode={subjectCode}
                  userId={user.id}
                  config={config}
                  levelAccent={levelAccent}
                  formatSize={formatSize}
                />
              )
            })}

            {isGated && (
              <Link
                href="/student/upgrade"
                className="group flex items-center justify-between p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all text-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-500">
                    <Lock size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-indigo-900 text-sm">{docs.length - DISPLAY_LIMIT} more resources locked</p>
                    <p className="text-xs text-indigo-600">Upgrade to Pro for full access from just $2/month</p>
                  </div>
                </div>
                <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-indigo-700 transition">
                  Unlock All
                </div>
              </Link>
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

// ── Document card (extracted to avoid repetition) ──────────────────────────────

function DocumentCard({
  doc,
  subjectCode,
  userId,
  config,
  levelAccent,
  formatSize,
}: {
  doc: DocumentRow
  subjectCode: string
  userId: string
  config: typeof DOC_TYPE_CONFIG[string]
  levelAccent: string
  formatSize: (b: number | null) => string
}) {
  const isOwn = doc.uploaded_by === userId
  return (
    <Link
      href={`/student/resources/${subjectCode}/${doc.id}`}
      className={`group flex gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md ${levelAccent} transition-all`}
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
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">{doc.year}</span>
              )}
              {doc.paper_number && (
                <span className="text-xs text-gray-400">Paper {doc.paper_number}</span>
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
}
