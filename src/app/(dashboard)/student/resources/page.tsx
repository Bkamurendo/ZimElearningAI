export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Library } from 'lucide-react'

// ── Level cards ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  primary: {
    label: 'Primary School',
    sub: 'Grades 1 – 7',
    emoji: '🏫',
    gradient: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    href: '/student/resources/primary',
    note: 'Includes Grade 3 & Grade 7 exams',
  },
  olevel: {
    label: 'O-Level',
    sub: 'Forms 1 – 4',
    emoji: '📚',
    gradient: 'from-blue-500 to-indigo-600',
    text: 'text-blue-700',
    border: 'border-blue-200',
    href: '/student/resources/olevel',
    note: 'ZIMSEC Ordinary Level',
  },
  alevel: {
    label: 'A-Level',
    sub: 'Lower 6 & Upper 6',
    emoji: '🎓',
    gradient: 'from-purple-500 to-violet-600',
    text: 'text-purple-700',
    border: 'border-purple-200',
    href: '/student/resources/alevel',
    note: 'ZIMSEC Advanced Level',
  },
} as const

// ── Material type config ──────────────────────────────────────────────────────

const MATERIAL_TYPES = [
  { type: 'past_paper',     label: 'Past Papers',     icon: '📝', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   hover: 'hover:bg-blue-100'   },
  { type: 'marking_scheme', label: 'Mark Schemes',    icon: '✅', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  hover: 'hover:bg-green-100'  },
  { type: 'notes',          label: 'Study Notes',     icon: '📖', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', hover: 'hover:bg-indigo-100' },
  { type: 'textbook',       label: 'Textbooks',       icon: '📚', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
  { type: 'syllabus',       label: 'Syllabi',         icon: '🗂️', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', hover: 'hover:bg-orange-100' },
  { type: 'other',          label: 'Other Resources', icon: '📄', bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   hover: 'hover:bg-gray-100'   },
] as const

const TYPE_ICONS: Record<string, string> = {
  past_paper: '📝', marking_scheme: '✅', notes: '📖',
  textbook: '📚', syllabus: '🗂️', other: '📄',
}

export default async function ResourcesLandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel queries — subjects count + published docs by level & type
  const [subjectsRes, docsRes] = await Promise.all([
    supabase.from('subjects').select('id, zimsec_level'),
    supabase
      .from('uploaded_documents')
      .select('zimsec_level, document_type')
      .eq('moderation_status', 'published'),
  ])

  const allSubjects = (subjectsRes.data ?? []) as { id: string; zimsec_level: string }[]
  const allDocs = (docsRes.data ?? []) as { zimsec_level: string; document_type: string }[]

  // Aggregate
  const subjectCounts: Record<string, number> = {}
  const docCounts: Record<string, number> = {}
  const docTypeCounts: Record<string, Record<string, number>> = {}

  for (const s of allSubjects) {
    subjectCounts[s.zimsec_level] = (subjectCounts[s.zimsec_level] ?? 0) + 1
  }
  for (const d of allDocs) {
    const lv = d.zimsec_level ?? 'unknown'
    docCounts[lv] = (docCounts[lv] ?? 0) + 1
    if (!docTypeCounts[lv]) docTypeCounts[lv] = {}
    docTypeCounts[lv][d.document_type] = (docTypeCounts[lv][d.document_type] ?? 0) + 1
  }

  const totalDocs = allDocs.length

  // Cross-level type totals for the material-type grid
  const globalTypeCounts: Record<string, number> = {}
  for (const lvMap of Object.values(docTypeCounts)) {
    for (const [type, count] of Object.entries(lvMap)) {
      globalTypeCounts[type] = (globalTypeCounts[type] ?? 0) + count
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">Resource Library</span>
        </div>

        {/* Hero banner */}
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
              <Library size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Resource Library</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {totalDocs} published document{totalDocs !== 1 ? 's' : ''} · Past papers, notes, textbooks & syllabi
              </p>
              <p className="text-slate-300 text-sm mt-2 max-w-lg">
                Browse resources organised by education level — Primary School (Grades 1–7), O-Level, and A-Level.
              </p>
            </div>
          </div>
        </div>

        {/* Level directory */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Education Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(LEVEL_CONFIG) as [string, typeof LEVEL_CONFIG.primary][]).map(([key, cfg]) => {
              const subjects = subjectCounts[key] ?? 0
              const docs = docCounts[key] ?? 0
              const types = docTypeCounts[key] ?? {}
              const topTypes = Object.entries(types)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)

              return (
                <Link
                  key={key}
                  href={cfg.href}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 shadow-sm"
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${cfg.gradient} p-5 text-white`}>
                    <div className="text-3xl mb-2">{cfg.emoji}</div>
                    <h3 className="font-bold text-lg leading-tight">{cfg.label}</h3>
                    <p className="text-white/70 text-xs mt-0.5">{cfg.sub}</p>
                  </div>

                  {/* Stats body */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{subjects} subject{subjects !== 1 ? 's' : ''}</span>
                      <span className="font-bold text-gray-800">{docs} resource{docs !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Document type pills */}
                    {topTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {topTypes.map(([type, count]) => (
                          <span key={type} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {TYPE_ICONS[type] ?? '📄'} {count}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 italic">{cfg.note}</p>

                    <div className={`flex items-center gap-1 text-xs font-semibold ${cfg.text} group-hover:gap-2 transition-all`}>
                      Browse {cfg.label} <ChevronRight size={12} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Material type quick-browse */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Browse by Material Type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MATERIAL_TYPES.map(({ type, label, icon, bg, border, text, hover }) => {
              const count = globalTypeCounts[type] ?? 0
              return (
                <Link
                  key={type}
                  href={`/student/search?type=${type}`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${bg} ${border} ${hover} transition-colors`}
                >
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${text}`}>{label}</p>
                    <p className={`text-xs opacity-60 ${text}`}>{count} available</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Help tip */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Finding resources by grade?</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Within each subject, use the document title and year to identify grade-specific materials.
              Primary Grade 3 and Grade 7 past papers are tagged in the Past Papers section.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
