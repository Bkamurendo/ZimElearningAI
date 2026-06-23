export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Brain, ChevronRight, BookOpen } from 'lucide-react'

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
  'computer science': '💻', art: '🎨', music: '🎵', shona: '🗣️', ndebele: '🗣️',
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '📚'
}

const LEVEL_LABEL: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default async function AiTutorIndexPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sp } = await supabase
    .from('student_profiles').select('id').eq('user_id', user.id).single() as {
    data: { id: string } | null; error: unknown
  }

  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject:subjects(id, name, code, zimsec_level)')
    .eq('student_id', sp?.id ?? '') as {
    data: { subject: { id: string; name: string; code: string; zimsec_level: string } | null }[] | null
    error: unknown
  }

  const subjects = (enrolments ?? [])
    .map(e => e.subject)
    .filter((s): s is NonNullable<typeof s> => s !== null)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Tutor</h1>
          </div>
          <p className="text-emerald-100 text-sm">
            Choose a subject to start a personalised tutoring session with EduZim AI
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
            <h2 className="text-lg font-bold text-slate-700 mb-1">No subjects enrolled</h2>
            <p className="text-slate-500 text-sm mb-4">Enrol in subjects to unlock the AI Tutor</p>
            <Link href="/student/subjects" className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm">
              Browse Subjects
            </Link>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-4 font-medium">Your enrolled subjects</p>
            <div className="flex flex-col gap-3">
              {subjects.map((subject, i) => {
                const gradient = SUBJECT_GRADIENTS[i % SUBJECT_GRADIENTS.length]
                const emoji = getEmoji(subject.name)
                return (
                  <Link
                    key={subject.code}
                    href={`/student/ai-tutor/${subject.code}`}
                    className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-emerald-200 active:scale-[0.99] transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-base leading-tight">{subject.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{LEVEL_LABEL[subject.zimsec_level] ?? subject.zimsec_level} · {subject.code}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
