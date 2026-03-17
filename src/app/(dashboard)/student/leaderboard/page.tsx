import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Crown, Medal } from 'lucide-react'

type LeaderRow = {
  rank: number
  student_id: string
  full_name: string
  grade: string
  zimsec_level: string
  total_xp: number
  current_streak: number
  isMe: boolean
}

const LEVEL_LABELS: Record<string, string> = { primary: 'Primary', olevel: 'O-Level', alevel: 'A-Level' }

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('student_profiles')
    .select('id, grade, zimsec_level')
    .eq('user_id', user.id)
    .single() as { data: { id: string; grade: string; zimsec_level: string } | null; error: unknown }

  type StreakRow = {
    student_id: string
    total_xp: number
    current_streak: number
    student_profile: { grade: string; zimsec_level: string; user: { full_name: string } | null } | null
  }

  const { data: rows } = await supabase
    .from('student_streaks')
    .select('student_id, total_xp, current_streak, student_profile:student_profiles(grade, zimsec_level, user:profiles(full_name))')
    .order('total_xp', { ascending: false })
    .limit(50) as { data: StreakRow[] | null; error: unknown }

  const leaders: LeaderRow[] = (rows ?? []).map((r, i) => ({
    rank: i + 1,
    student_id: r.student_id,
    full_name: r.student_profile?.user?.full_name ?? 'Student',
    grade: r.student_profile?.grade ?? '',
    zimsec_level: r.student_profile?.zimsec_level ?? '',
    total_xp: r.total_xp ?? 0,
    current_streak: r.current_streak ?? 0,
    isMe: r.student_id === myProfile?.id,
  }))

  const myEntry = leaders.find((l) => l.isMe)
  let myRank: LeaderRow | null = null
  if (!myEntry && myProfile) {
    const { data: myStreak } = await supabase
      .from('student_streaks').select('total_xp, current_streak').eq('student_id', myProfile.id).single() as { data: { total_xp: number; current_streak: number } | null; error: unknown }
    const { count } = await supabase
      .from('student_streaks').select('id', { count: 'exact', head: true }).gt('total_xp', myStreak?.total_xp ?? 0)
    const { data: myProf } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    myRank = {
      rank: (count ?? 0) + 1,
      student_id: myProfile.id,
      full_name: myProf?.full_name ?? 'You',
      grade: myProfile.grade,
      zimsec_level: myProfile.zimsec_level,
      total_xp: myStreak?.total_xp ?? 0,
      current_streak: myStreak?.current_streak ?? 0,
      isMe: true,
    }
  }

  const totalStudents = rows?.length ?? 0
  const topXp = leaders[0]?.total_xp ?? 0
  const top3 = leaders.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div
          className="relative text-white rounded-2xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444, #dc2626)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/4"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
              <Trophy size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-orange-100 text-sm mt-0.5">Top students by XP — keep studying to climb!</p>
              <div className="flex gap-3 mt-3">
                <div className="bg-white/15 rounded-xl px-3 py-2 text-center border border-white/10">
                  <p className="text-xl font-bold">{totalStudents}</p>
                  <p className="text-[10px] text-orange-100">Students</p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-2 text-center border border-white/10">
                  <p className="text-xl font-bold">{topXp.toLocaleString()}</p>
                  <p className="text-[10px] text-orange-100">Top XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My rank (if not in top 50) */}
        {myRank && (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm">
              #{myRank.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">You — {myRank.full_name}</p>
              <p className="text-xs text-gray-500">{LEVEL_LABELS[myRank.zimsec_level] ?? ''}{myRank.grade ? ` · ${myRank.grade}` : ''}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-emerald-700">{myRank.total_xp.toLocaleString()} XP</p>
              {myRank.current_streak > 0 && (
                <p className="text-xs text-orange-500 flex items-center gap-0.5 justify-end mt-0.5">
                  <Flame size={11} /> {myRank.current_streak}d
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length >= 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">🏆 Top 3 Podium</p>
            <div className="flex items-end justify-center gap-3">
              {/* 2nd place */}
              {top3[1] && (
                <div className={`flex-1 flex flex-col items-center pt-4 pb-3 px-2 rounded-2xl bg-gray-100 border-2 ${top3[1].isMe ? 'border-emerald-400' : 'border-gray-200'}`}>
                  <div className="text-2xl mb-2">🥈</div>
                  <p className="font-bold text-gray-800 text-xs text-center truncate w-full">{top3[1].full_name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">{top3[1].total_xp.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">XP</p>
                </div>
              )}
              {/* 1st place — tallest */}
              {top3[0] && (
                <div className={`flex-1 flex flex-col items-center pt-5 pb-3 px-2 rounded-2xl border-2 ${top3[0].isMe ? 'border-emerald-400' : 'border-amber-300'}`}
                  style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
                  <Crown size={20} className="text-amber-500 mb-1" />
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center font-bold text-white text-xl mb-2 shadow-md shadow-amber-200">
                    {top3[0].full_name[0]?.toUpperCase()}
                  </div>
                  <p className="font-bold text-amber-900 text-xs text-center truncate w-full">{top3[0].full_name.split(' ')[0]}</p>
                  <p className="text-sm text-amber-700 font-bold mt-1">{top3[0].total_xp.toLocaleString()}</p>
                  <p className="text-[10px] text-amber-600">XP</p>
                </div>
              )}
              {/* 3rd place */}
              {top3[2] && (
                <div className={`flex-1 flex flex-col items-center pt-4 pb-3 px-2 rounded-2xl bg-orange-50 border-2 ${top3[2].isMe ? 'border-emerald-400' : 'border-orange-200'}`}>
                  <div className="text-2xl mb-2">🥉</div>
                  <p className="font-bold text-gray-800 text-xs text-center truncate w-full">{top3[2].full_name.split(' ')[0]}</p>
                  <p className="text-xs text-orange-600 font-semibold mt-1">{top3[2].total_xp.toLocaleString()}</p>
                  <p className="text-[10px] text-orange-400">XP</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full leaderboard list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <Medal size={16} className="text-amber-500" />
            <h2 className="font-bold text-gray-900 text-sm">All Rankings</h2>
          </div>

          {leaders.length === 0 ? (
            <div className="text-center py-14 px-6">
              <span className="text-5xl block mb-3">🏆</span>
              <p className="text-sm text-gray-500 font-semibold">No scores yet — be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaders.map((leader) => (
                <div
                  key={leader.student_id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition ${
                    leader.isMe
                      ? 'bg-emerald-50 border-l-4 border-emerald-500'
                      : 'hover:bg-gray-50/60 border-l-4 border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-9 flex-shrink-0 text-center">
                    {leader.rank === 1 ? (
                      <Crown size={20} className="text-amber-500 mx-auto" />
                    ) : leader.rank === 2 ? (
                      <span className="text-lg">🥈</span>
                    ) : leader.rank === 3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">#{leader.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
                    leader.rank === 1
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200'
                      : leader.isMe
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-200'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {leader.full_name[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${leader.isMe ? 'text-emerald-800' : 'text-gray-900'}`}>
                      {leader.full_name} {leader.isMe && <span className="text-xs text-emerald-500 font-bold">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {LEVEL_LABELS[leader.zimsec_level] ?? ''}{leader.grade ? ` · ${leader.grade}` : ''}
                    </p>
                  </div>

                  {/* XP + Streak */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${
                      leader.rank === 1 ? 'text-amber-600' : leader.isMe ? 'text-emerald-700' : 'text-gray-700'
                    }`}>
                      {leader.total_xp.toLocaleString()} XP
                    </p>
                    {leader.current_streak > 0 && (
                      <p className="text-xs text-orange-500 flex items-center gap-0.5 justify-end mt-0.5">
                        <Flame size={11} /> {leader.current_streak}d
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">Leaderboard updates in real-time as students earn XP</p>
      </div>
    </div>
  )
}
