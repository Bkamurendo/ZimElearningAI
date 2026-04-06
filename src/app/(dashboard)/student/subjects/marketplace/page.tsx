import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, CheckCircle2, ChevronRight, Lock, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Subject Marketplace – ZimLearn AI',
  description: 'Buy full access to individual ZIMSEC subjects.',
}

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

export default async function SubjectMarketplacePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('plan, full_name').eq('id', user.id).single()

  const { data: sp } = await supabase
    .from('student_profiles').select('id, zimsec_level').eq('user_id', user.id).single() as {
    data: { id: string; zimsec_level: string } | null; error: unknown
  }

  // Get all subjects for student's level
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, code, zimsec_level')
    .eq('zimsec_level', sp?.zimsec_level ?? 'olevel')
    .order('name', { ascending: true })

  // Get already enrolled/purchased subjects
  const { data: enrolments } = await supabase
    .from('student_subjects')
    .select('subject_id')
    .eq('student_id', sp?.id ?? '')

  const enrolledIds = new Set((enrolments ?? []).map(e => e.subject_id))

  // Get specifically purchased subject access (lifetime)
  const { data: purchasedAccess } = await supabase
    .from('subject_access')
    .select('subject_id')
    .eq('user_id', user.id)
  
  const purchasedIds = new Set((purchasedAccess ?? []).map(a => a.subject_id))

  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10 backdrop-blur-sm">
            <Sparkles size={12} fill="currentColor" /> Unlocked Learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Subject Marketplace</h1>
          <p className="text-emerald-100 max-w-lg mx-auto text-base">
            Don't need a full Pro subscription? Get <span className="font-bold underline">Lifetime Access</span> to any individual subject for just <span className="text-white font-bold">$1.50</span>.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-8">
        
        {/* Pro Banner if not pro */}
        {!isPro && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-tight">ZimLearn Pro unlocks ALL subjects</p>
                <p className="text-gray-500 text-xs">For $5/mo you get every subject plus unlimited AI tutoring.</p>
              </div>
            </div>
            <Link href="/student/upgrade" className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition text-center shadow-lg shadow-emerald-100">
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSubjects?.map((subject) => {
            const _isEnrolled = enrolledIds.has(subject.id)
            const isPurchased = purchasedIds.has(subject.id)
            const emoji = getEmoji(subject.name)
            
            return (
              <div key={subject.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-100">
                      {emoji}
                    </div>
                    {isPurchased || isPro ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Fully Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 uppercase tracking-wider">
                        <Lock size={10} /> Limited Access
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{subject.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{subject.code}</p>
                  
                  <div className="space-y-2">
                    {[
                      'Full Syllabus Coverage',
                      'Daily Quiz Access',
                      'ZIMSEC Past Papers',
                      'AI Topic Analysis'
                    ].map(feat => (
                      <div key={feat} className="flex items-center gap-2 text-[11px] text-gray-500">
                        <CheckCircle2 size={12} className={isPurchased || isPro ? 'text-emerald-500' : 'text-gray-300'} />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                  {isPurchased || isPro ? (
                    <Link
                      href={`/student/subjects/${subject.code}`}
                      className="block w-full py-2.5 text-center bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                    >
                      Start Learning →
                    </Link>
                  ) : (
                    <Link
                      href={`/student/upgrade?plan=subject_pack&subject=${subject.id}`}
                      className="block w-full py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      Unlock for $1.50 <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="text-center">
          <Link href="/student/subjects" className="text-sm text-gray-400 hover:text-gray-600 font-medium">
            ← Back to My Subjects
          </Link>
        </div>
      </div>
    </div>
  )
}
