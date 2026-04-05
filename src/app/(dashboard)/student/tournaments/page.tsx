import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Clock, Users, Zap, Lock, ChevronRight, Star } from 'lucide-react'

export const metadata = {
  title: 'Study Tournaments – ZimLearn AI',
  description: 'Compete in monthly ZIMSEC quiz tournaments. Win cash prizes!',
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Now
    </span>
  )
  if (status === 'upcoming') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
      <Clock size={10} /> Upcoming
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
      Ended
    </span>
  )
}

export default async function TournamentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, full_name')
    .eq('id', user.id)
    .single()

  // Fetch tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(20)

  // Fetch user's entries
  const { data: myEntries } = await supabase
    .from('tournament_entries')
    .select('tournament_id, score, rank, completed, paid')
    .eq('user_id', user.id)

  const entryMap = new Map(myEntries?.map(e => [e.tournament_id, e]) ?? [])

  const now = new Date()

  // Compute leaderboard for active or ended tournaments
  const activeTournament = tournaments?.find(t => t.status === 'active')
  let leaderboard: { full_name: string; score: number; rank: number }[] = []
  if (activeTournament) {
    const { data: topEntries } = await supabase
      .from('tournament_entries')
      .select('score, rank, user_id, profiles(full_name)')
      .eq('tournament_id', activeTournament.id)
      .eq('completed', true)
      .order('score', { ascending: false })
      .limit(5)

    leaderboard = (topEntries ?? []).map((e: any, i) => ({
      full_name: e.profiles?.full_name ?? 'Anonymous',
      score: e.score ?? 0,
      rank: i + 1,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-10 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <Trophy size={13} fill="currentColor" /> Monthly Tournaments
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Compete. Win. Earn.
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-base">
            Enter monthly ZIMSEC quiz competitions. Top students win real cash prizes.
            $1 entry fee — prize pool grows with every entry.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-6">
        {/* Stats bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Prize per winner', value: '$20+' },
            { label: 'Entry fee', value: '$1' },
            { label: 'Questions', value: '20 MCQ' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active leaderboard */}
        {activeTournament && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-500" />
              <h2 className="font-bold text-gray-900 text-sm">Current Leaders — {activeTournament.title}</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{entry.full_name}</span>
                  <span className="text-sm font-black text-indigo-600">{entry.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tournament list */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Tournaments</h2>
          <div className="space-y-3">
            {!tournaments?.length && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                <Trophy size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="font-semibold">No tournaments yet</p>
                <p className="text-sm mt-1">Check back soon — the first tournament is coming!</p>
              </div>
            )}

            {tournaments?.map(t => {
              const myEntry = entryMap.get(t.id)
              const isEntered = !!myEntry
              const isCompleted = myEntry?.completed
              const startsAt = new Date(t.starts_at)
              const endsAt = new Date(t.ends_at)
              const timeLeft = endsAt.getTime() - now.getTime()
              const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))
              const entryFree = t.entry_fee_usd === 0

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      t.status === 'active' ? 'bg-green-100' : t.status === 'upcoming' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Trophy size={22} className={
                        t.status === 'active' ? 'text-green-600' : t.status === 'upcoming' ? 'text-blue-600' : 'text-gray-400'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base">{t.title}</h3>
                        <StatusBadge status={t.status} />
                      </div>
                      {t.description && <p className="text-sm text-gray-500 mb-2">{t.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Users size={11} /> {t.max_participants} max</span>
                        <span className="flex items-center gap-1"><Zap size={11} /> {t.question_count} questions</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {t.time_limit_minutes} min</span>
                        {t.status === 'active' && <span className="flex items-center gap-1 text-red-500 font-semibold"><Clock size={11} /> {hoursLeft}h left</span>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${entryFree ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {entryFree ? 'FREE entry' : `$${t.entry_fee_usd} entry`}
                          </span>
                          {t.prize_pool_usd > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              🏆 $${t.prize_pool_usd} prize pool
                            </span>
                          )}
                        </div>

                        {t.status === 'ended' ? (
                          <span className="text-xs text-gray-400">
                            {isCompleted ? `Your rank: #${myEntry?.rank ?? '—'}` : 'Ended'}
                          </span>
                        ) : isCompleted ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            ✓ Submitted · {myEntry?.score ?? 0} pts
                          </span>
                        ) : isEntered ? (
                          <Link
                            href={`/student/tournaments/${t.id}/quiz`}
                            className="flex items-center gap-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition"
                          >
                            Start Quiz <ChevronRight size={14} />
                          </Link>
                        ) : t.status === 'active' ? (
                          <Link
                            href={`/student/tournaments/${t.id}/enter`}
                            className="flex items-center gap-1.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl transition shadow-sm"
                          >
                            Enter {!entryFree && `$${t.entry_fee_usd}`} <ChevronRight size={14} />
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} /> Opens {startsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Star size={18} fill="currentColor" /> How Tournaments Work</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Pay $1 entry fee via EcoCash or card' },
              { step: '2', text: 'Answer 20 ZIMSEC-style questions in 30 minutes' },
              { step: '3', text: 'Top 3 students win from the prize pool ($20 · $10 · $5)' },
              { step: '4', text: 'Winners paid via EcoCash within 24 hours' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0">{step}</div>
                <p className="text-sm text-indigo-100">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/student/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
