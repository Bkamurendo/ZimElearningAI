import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, Flame, Star, ChevronRight } from 'lucide-react'

const LEVEL_LABEL: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default async function ParentChildrenPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'parent') redirect(`/${profile?.role}/dashboard`)

  type ChildRow = {
    id: string
    grade: string
    zimsec_level: string
    user: { full_name: string } | null
  }
  const { data: children } = await supabase
    .from('student_profiles')
    .select('id, grade, zimsec_level, user:profiles(full_name)')
    .eq('parent_id', user.id) as { data: ChildRow[] | null; error: unknown }

  // Per-child quick stats
  type ChildStat = ChildRow & {
    streak: number; totalXp: number; subjectCount: number
  }
  const stats: ChildStat[] = []
  for (const child of children ?? []) {
    const { data: sk } = await supabase
      .from('student_streaks').select('current_streak, total_xp')
      .eq('student_id', child.id).single() as { data: { current_streak: number; total_xp: number } | null; error: unknown }
    const { count: subCount } = await supabase
      .from('student_subjects').select('id', { count: 'exact', head: true }).eq('student_id', child.id)
    stats.push({
      ...child,
      streak: sk?.current_streak ?? 0,
      totalXp: sk?.total_xp ?? 0,
      subjectCount: subCount ?? 0,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Children</h1>
              <p className="text-purple-200 text-sm mt-0.5">
                {stats.length === 0
                  ? 'No children linked yet'
                  : `${stats.length} child${stats.length !== 1 ? 'ren' : ''} linked to your account`}
              </p>
            </div>
          </div>
        </div>

        {/* Children list */}
        {stats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center shadow-sm">
            <div className="text-5xl mb-4">👨‍👧</div>
            <p className="font-semibold text-gray-700 text-lg">No linked children yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Children can link your account during their registration or onboarding process.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map(child => (
              <Link
                key={child.id}
                href={`/parent/children/${child.id}`}
                className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all overflow-hidden"
              >
                {/* Child header */}
                <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold text-lg">
                        {(child.user?.full_name ?? 'S')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{child.user?.full_name ?? 'Student'}</p>
                      <p className="text-xs text-gray-500">
                        {child.grade} · {LEVEL_LABEL[child.zimsec_level] ?? child.zimsec_level}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </div>

                {/* Quick stats strip */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Flame size={14} className="text-orange-500" />
                      <p className="text-xl font-bold text-gray-900">{child.streak}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Day streak</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Star size={14} className="text-yellow-500" />
                      <p className="text-xl font-bold text-gray-900">{child.totalXp.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Total XP</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <TrendingUp size={14} className="text-blue-500" />
                      <p className="text-xl font-bold text-gray-900">{child.subjectCount}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Subjects</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
