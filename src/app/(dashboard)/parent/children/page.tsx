export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Users, TrendingUp, Flame, Star, ChevronRight } from 'lucide-react'

const LEVEL_LABEL: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default async function ParentChildrenPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name, monitoring_expires_at').eq('id', user.id).single()
  if (profile?.role !== 'parent') redirect(`/${profile?.role}/dashboard`)

  const isPremiumMonitoring = profile.monitoring_expires_at 
    ? new Date(profile.monitoring_expires_at) > new Date()
    : false

  type ChildRow = {
    id: string
    grade: string
    zimsec_level: string
    user_id: string
    user: { full_name: string } | null
  }

  // Use service client to bypass RLS for the profiles join
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: childProfiles } = await serviceClient
    .from('student_profiles')
    .select('id, grade, zimsec_level, user_id')
    .eq('parent_id', user.id) as { data: { id: string; grade: string; zimsec_level: string; user_id: string }[] | null; error: unknown }

  const children: ChildRow[] = []
  for (const cp of childProfiles ?? []) {
    const { data: prof } = await serviceClient
      .from('profiles').select('full_name').eq('id', cp.user_id).single() as { data: { full_name: string } | null; error: unknown }
    children.push({ ...cp, user: prof ?? null })
  }

  // Per-child quick stats
  type ChildStat = ChildRow & {
    streak: number; totalXp: number; subjectCount: number
  }
  const stats: ChildStat[] = []
  for (const child of children) {
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-2xl p-6 overflow-hidden shadow-lg shadow-purple-200">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
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
            {isPremiumMonitoring && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Premium Monitoring Active
              </div>
            )}
          </div>
        </div>

        {/* Premium Upgrade Banner */}
        {!isPremiumMonitoring && stats.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-indigo-100 p-5 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp size={80} className="text-indigo-600" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Star size={18} className="text-amber-500" fill="currentColor" /> Upgrade to Premium Monitoring
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Get weekly SMS progress reports, detailed activity logs for every quiz, and AI-powered performance insights for just <span className="font-bold text-indigo-600">$3/month</span>.
                </p>
              </div>
              <Link
                href="/parent/upgrade-monitoring"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-lg shadow-indigo-100 text-center"
              >
                Unlock Premium →
              </Link>
            </div>
          </div>
        )}

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
                  <div className="flex items-center gap-2">
                    {isPremiumMonitoring && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Reports Ready</span>
                    )}
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                  </div>
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
