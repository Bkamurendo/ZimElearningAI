export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  past_paper:     { label: 'Past Papers',  icon: '📝', color: 'text-blue-600'   },
  marking_scheme: { label: 'Mark Schemes', icon: '✅', color: 'text-green-600'  },
  notes:          { label: 'Study Notes',  icon: '📖', color: 'text-indigo-600' },
  textbook:       { label: 'Textbooks',    icon: '📚', color: 'text-purple-600' },
  syllabus:       { label: 'Syllabi',      icon: '🗂️', color: 'text-orange-600' },
  other:          { label: 'Other',        icon: '📄', color: 'text-gray-600'   },
}

const SUBJECT_EMOJI: Record<string, string> = {
  mathematics: '📐', english: '📝', science: '🔬', 'social studies': '🌍',
  shona: '🗣️', ndebele: '🗣️', 'home economics': '🏠', art: '🎨',
  music: '🎵', 'physical education': '🏃', agriculture: '🌱',
  'religious and moral education': '✝️', geography: '🌍',
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '📚'
}

// Grade 3 and Grade 7 are the key primary ZIMSEC milestones
const PRIMARY_GRADES = [
  { grade: 1, desc: 'Early literacy & numeracy', key: false },
  { grade: 2, desc: 'Foundation skills', key: false },
  { grade: 3, desc: 'Grade 3 Examinations', key: true },
  { grade: 4, desc: 'Intermediate level', key: false },
  { grade: 5, desc: 'Building skills', key: false },
  { grade: 6, desc: 'Grade 7 preparation', key: false },
  { grade: 7, desc: 'Grade 7 National Exams', key: true },
]

type SubjectRow = {
  id: string
  name: string
  code: string
  zimsec_level: string
}

export default async function PrimaryResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all primary subjects
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('zimsec_level', 'primary')
    .order('name') as { data: SubjectRow[] | null; error: unknown }

  const subjects = subjectsRaw ?? []

  // Fetch all published docs for primary level (one query, aggregate in JS)
  const subjectIds = subjects.map(s => s.id)

  let docRows: { subject_id: string; document_type: string }[] = []
  if (subjectIds.length > 0) {
    const { data } = await supabase
      .from('uploaded_documents')
      .select('subject_id, document_type')
      .in('subject_id', subjectIds)
      .eq('moderation_status', 'published') as { data: { subject_id: string; document_type: string }[] | null; error: unknown }
    docRows = data ?? []
  }

  // Aggregate: per-subject counts by type
  const docsBySubject: Record<string, Record<string, number>> = {}
  const totalBySubject: Record<string, number> = {}
  for (const d of docRows) {
    if (!docsBySubject[d.subject_id]) docsBySubject[d.subject_id] = {}
    docsBySubject[d.subject_id][d.document_type] = (docsBySubject[d.subject_id][d.document_type] ?? 0) + 1
    totalBySubject[d.subject_id] = (totalBySubject[d.subject_id] ?? 0) + 1
  }

  const totalDocs = docRows.length

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/student/dashboard" className="text-gray-400 hover:text-gray-600 transition">Dashboard</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href="/student/resources" className="text-gray-400 hover:text-gray-600 transition">Resource Library</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">Primary School</span>
        </div>

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/4 pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-2">🏫</div>
            <h1 className="text-2xl font-bold">Primary School Resources</h1>
            <p className="text-emerald-100 text-sm mt-1">Grades 1 – 7 · {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {totalDocs} resource{totalDocs !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Grade overview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Grade Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIMARY_GRADES.map(({ grade, desc, key }) => (
              <div
                key={grade}
                className={`p-3 rounded-xl border text-center ${
                  key
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <p className={`font-bold text-lg ${key ? 'text-emerald-700' : 'text-gray-700'}`}>
                  Grade {grade}
                </p>
                <p className={`text-[10px] mt-0.5 ${key ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  {desc}
                </p>
                {key && (
                  <span className="inline-block mt-1.5 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Key Exam
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">
            📌 Resources cover all primary grades. Filter by document title or year to find grade-specific materials.
          </p>
        </div>

        {/* Subjects grid */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Primary Subjects</h2>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
              <div className="text-5xl mb-3">📚</div>
              <p className="font-semibold text-gray-600">No primary subjects found</p>
              <p className="text-sm text-gray-400 mt-1">Primary subjects will appear here once added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => {
                const emoji = getEmoji(subject.name)
                const total = totalBySubject[subject.id] ?? 0
                const typeMap = docsBySubject[subject.id] ?? {}
                const topTypes = Object.entries(typeMap)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)

                return (
                  <Link
                    key={subject.id}
                    href={`/student/resources/${subject.code}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all duration-200 shadow-sm"
                  >
                    {/* Subject header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                      <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{subject.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Primary · {total} resource{total !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-400 transition flex-shrink-0" />
                    </div>

                    {/* Type breakdown */}
                    <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
                      {topTypes.length > 0 ? (
                        topTypes.map(([type, count]) => {
                          const cfg = DOC_TYPE_CONFIG[type] ?? DOC_TYPE_CONFIG.other
                          return (
                            <span key={type} className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                              {cfg.icon} {count} {cfg.label}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-xs text-gray-400">No resources yet</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
