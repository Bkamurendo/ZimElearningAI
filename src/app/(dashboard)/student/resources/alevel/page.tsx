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
  mathematics: '📐', english: '📝', physics: '⚛️', chemistry: '🧪',
  biology: '🧬', history: '🏛️', geography: '🌍', economics: '📈',
  accounts: '📊', literature: '📖', divinity: '✝️', agriculture: '🌱',
  'computer science': '💻', art: '🎨', music: '🎵', shona: '🗣️',
  ndebele: '🗣️', french: '🇫🇷', spanish: '🇪🇸', 'business studies': '💼',
  'further mathematics': '📐', statistics: '📊',
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '📚'
}

// A-Level subject groupings
const SUBJECT_GROUPS: Record<string, string[]> = {
  'Sciences': ['physics', 'chemistry', 'biology', 'agriculture', 'computer', 'mathematics', 'further', 'statistics'],
  'Humanities & Social Sciences': ['history', 'geography', 'divinity', 'literature', 'religious', 'shona', 'ndebele', 'french', 'spanish', 'english'],
  'Commerce & Economics': ['economics', 'accounts', 'business', 'commerce'],
  'Arts & Other': ['art', 'music', 'food', 'fashion', 'physical'],
}

type SubjectRow = {
  id: string
  name: string
  code: string
  zimsec_level: string
}

function classifySubject(name: string): string {
  const lower = name.toLowerCase()
  for (const [group, keywords] of Object.entries(SUBJECT_GROUPS)) {
    if (keywords.some(k => lower.includes(k))) return group
  }
  return 'Other'
}

export default async function ALevelResourcesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all A-Level subjects
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('zimsec_level', 'alevel')
    .order('name') as { data: SubjectRow[] | null; error: unknown }

  const subjects = subjectsRaw ?? []
  const subjectIds = subjects.map(s => s.id)

  // Fetch published doc counts
  let docRows: { subject_id: string; document_type: string }[] = []
  if (subjectIds.length > 0) {
    const { data } = await supabase
      .from('uploaded_documents')
      .select('subject_id, document_type')
      .in('subject_id', subjectIds)
      .eq('moderation_status', 'published') as { data: { subject_id: string; document_type: string }[] | null; error: unknown }
    docRows = data ?? []
  }

  const docsBySubject: Record<string, Record<string, number>> = {}
  const totalBySubject: Record<string, number> = {}
  for (const d of docRows) {
    if (!docsBySubject[d.subject_id]) docsBySubject[d.subject_id] = {}
    docsBySubject[d.subject_id][d.document_type] = (docsBySubject[d.subject_id][d.document_type] ?? 0) + 1
    totalBySubject[d.subject_id] = (totalBySubject[d.subject_id] ?? 0) + 1
  }

  // Group subjects
  const grouped: Record<string, SubjectRow[]> = {}
  for (const s of subjects) {
    const group = classifySubject(s.name)
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(s)
  }

  const groupOrder = ['Sciences', 'Humanities & Social Sciences', 'Commerce & Economics', 'Arts & Other', 'Other']
  const sortedGroups = groupOrder.filter(g => grouped[g]?.length > 0)

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
          <span className="font-semibold text-gray-900">A-Level</span>
        </div>

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/4 pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold">A-Level Resources</h1>
            <p className="text-purple-100 text-sm mt-1">
              Lower 6 & Upper 6 · ZIMSEC Advanced Level · {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {totalDocs} resource{totalDocs !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Exam info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📅', title: 'Exam Timeline', desc: 'A-Level exams at end of Upper 6 (Form 6)' },
            { icon: '📋', title: 'Subject Load', desc: '3–5 subjects typical for university entry' },
            { icon: '🎯', title: 'Key Focus', desc: 'In-depth content, past papers & mark schemes' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grouped subject listing */}
        {sortedGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">🎓</div>
            <p className="font-semibold text-gray-600">No A-Level subjects found</p>
            <p className="text-sm text-gray-400 mt-1">A-Level subjects will appear here once added.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map((groupName) => {
              const groupSubjects = grouped[groupName] ?? []
              return (
                <div key={groupName}>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{groupName}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupSubjects.map((subject) => {
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
                          className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                            <div className="w-11 h-11 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                              {emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{subject.name}</h3>
                              <p className="text-xs text-gray-400 mt-0.5">A-Level · {total} resource{total !== 1 ? 's' : ''}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-400 transition flex-shrink-0" />
                          </div>
                          <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
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
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
