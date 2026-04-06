import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const LEVEL_BADGES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  primary: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Primary'  },
  olevel:  { bg: 'bg-blue-50',   text: 'text-blue-700',    border: 'border-blue-200',    label: 'O-Level'   },
  alevel:  { bg: 'bg-purple-50', text: 'text-purple-700',  border: 'border-purple-200',  label: 'A-Level'   },
}

const LEVEL_LABELS: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

const SUBJECT_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-500',
  'from-red-500 to-rose-600',
]

const SUBJECT_EMOJI: Record<string, string> = {
  mathematics: '📐', english: '📝', science: '🔬', physics: '⚛️', chemistry: '🧪',
  biology: '🧬', history: '🏛️', geography: '🌍', commerce: '💼', accounts: '📊',
  economics: '📈', literature: '📖', divinity: '✝️', agriculture: '🌱',
  'computer science': '💻', 'family and religious studies': '🙏', art: '🎨',
  music: '🎵', shona: '🗣️', ndebele: '🗣️', french: '🇫🇷', spanish: '🇪🇸',
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '📚'
}

type SubjectRow = {
  id: string
  name: string
  code: string
  zimsec_level: string
  course_count: number
  resource_count: number
}

export default async function StudentSubjectsPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level, grade')
      .eq('user_id', user.id)
      .single() as {
      data: { id: string; zimsec_level: string; grade: string } | null; error: unknown
    }

    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('subject_id')
      .eq('student_id', sp?.id ?? '') as {
      data: { subject_id: string }[] | null; error: unknown
    }

    const subjectIds = (enrolments ?? []).map((e) => e.subject_id)
    const subjects: SubjectRow[] = []

    if (subjectIds.length > 0) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id, name, code, zimsec_level')
        .in('id', subjectIds) as { data: { id: string; name: string; code: string; zimsec_level: string }[] | null; error: unknown }

      if (subjectData) {
        for (const s of subjectData) {
          const { count: courseCount } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', s.id)
            .eq('published', true)
            
          const { count: resourceCount } = await supabase
            .from('uploaded_documents')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', s.id)
            .eq('moderation_status', 'published')

          subjects.push({
            ...s,
            course_count: courseCount ?? 0,
            resource_count: resourceCount ?? 0
          })
        }
      }
    }

    const levelLabel = LEVEL_LABELS[sp?.zimsec_level ?? ''] ?? ''

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {/* Header */}
          <div
            className="relative text-white rounded-2xl p-6 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981, #0d9488)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/4"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                <BookOpen size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">My Subjects</h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {sp?.grade ? `${sp.grade} · ` : ''}{levelLabel} · {subjects.length} enrolled 
                </p>
              </div>
              <Link href="/student/subjects/marketplace" className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl text-xs backdrop-blur-sm border border-white/20 transition flex items-center gap-1.5 flex-shrink-0">
                <Sparkles size={14} className="text-yellow-300" fill="currentColor" /> Marketplace
              </Link>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center shadow-sm">
              <div className="text-6xl mb-4 flex justify-center gap-2">
                <span>📚</span><span>🎓</span><span>📖</span>
              </div>
              <p className="font-bold text-gray-700 mb-2">No subjects enrolled yet</p>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                You haven&apos;t selected any subjects. Update your profile to add subjects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject, idx) => {
                const badge = LEVEL_BADGES[subject.zimsec_level] ?? LEVEL_BADGES.olevel
                const emoji = getEmoji(subject.name)
                const gradient = SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length]
                return (
                  <Link
                    key={subject.id}
                    href={`/student/subjects/${subject.code}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.01] transition-all duration-200 shadow-sm"
                  >
                    <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm border border-white/10">
                          {emoji}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm leading-tight">{subject.name}</h3>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📖 {subject.course_count} course{subject.course_count !== 1 ? 's' : ''}</span>
                        <span>📄 {subject.resource_count} resource{subject.resource_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/student/quiz',      emoji: '🧠', label: 'Quiz',     desc: 'Test yourself'  },
                { href: '/student/search',    emoji: '🔍', label: 'Search',   desc: 'Find resources' },
                { href: '/student/progress',  emoji: '📈', label: 'Progress', desc: 'Track growth'   },
                { href: '/student/bookmarks', emoji: '🔖', label: 'Saved',    desc: 'Bookmarked'     },
              ].map(({ href, emoji, label, desc }) => (
                <Link key={href} href={href}
                  className="text-center p-3.5 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all duration-150 group hover:shadow-sm"
                >
                  <div className="text-xl mb-1">{emoji}</div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[StudentSubjects] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <BookOpen size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Couldn&apos;t load subjects</h2>
        <p className="text-slate-500 max-w-xs">We encountered an error while fetching your enrolled subjects. Please refresh the page.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
