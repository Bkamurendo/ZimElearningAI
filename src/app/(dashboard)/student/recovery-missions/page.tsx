export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, CheckCircle2, BookOpen, Bot, ChevronRight, Clock, Target } from 'lucide-react'
import MissionCompleteButton from './MissionCompleteButton'

function daysUntil(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

function hoursUntil(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 3600000))
}

export default async function RecoveryMissionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!sp) redirect('/student/dashboard')

  const { data: missions } = await supabase
    .from('student_remediation_missions')
    .select('id, topic, status, score_at_failure, total_at_failure, deadline, diagnosis, created_at, subject_id, subjects(name, code)')
    .eq('student_id', sp.id)
    .order('deadline', { ascending: true })

  const active = (missions ?? []).filter(m => m.status === 'active')
  const completed = (missions ?? []).filter(m => m.status !== 'active')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
            <Target size={20} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recovery Missions</h1>
        </div>
        <p className="text-sm text-slate-500 font-medium pl-[52px]">
          MaFundi detected topics where you scored below 65%. Complete these missions to master them.
        </p>
      </div>

      {/* Active Missions */}
      {active.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
          <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-black text-emerald-800 mb-1">All clear!</h2>
          <p className="text-sm text-emerald-600 font-medium">You have no active recovery missions. Keep it up!</p>
          <Link href="/student/quiz" className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-5 py-2.5 rounded-xl transition">
            Practice more quizzes <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-500" />
            {active.length} Active Mission{active.length > 1 ? 's' : ''}
          </h2>
          {active.map(mission => {
            const subj = mission.subjects as unknown as { name: string; code: string } | null
            const pct = Math.round((mission.score_at_failure / mission.total_at_failure) * 100)
            const days = daysUntil(mission.deadline)
            const hours = hoursUntil(mission.deadline)
            const urgent = hours < 24

            return (
              <div
                key={mission.id}
                className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm ${urgent ? 'border-red-400' : 'border-amber-200'}`}
              >
                {/* Mission header */}
                <div className={`px-5 py-4 flex items-center justify-between ${urgent ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                      <BookOpen size={16} className={urgent ? 'text-red-600' : 'text-amber-600'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{mission.topic}</p>
                      {subj && <p className="text-xs font-bold text-slate-500">{subj.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <p className={`text-lg font-black leading-none ${pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Score</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase ${urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      <Clock size={11} />
                      {days > 0 ? `${days}d left` : `${hours}h left`}
                    </div>
                  </div>
                </div>

                {/* MaFundi Diagnosis */}
                {mission.diagnosis && (
                  <div className="px-5 py-4 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">MaFundi&apos;s Recovery Plan</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{mission.diagnosis}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {subj && (
                    <Link
                      href={`/student/quiz/${subj.code}?topic=${encodeURIComponent(mission.topic)}`}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl transition uppercase tracking-wide"
                    >
                      <Target size={13} /> Retry Quiz
                    </Link>
                  )}
                  <Link
                    href={`/student/ai-teacher?topic=${encodeURIComponent(mission.topic)}`}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl transition uppercase tracking-wide"
                  >
                    <Bot size={13} /> Ask MaFundi
                  </Link>
                  <MissionCompleteButton missionId={mission.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed Missions */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Completed ({completed.length})
          </h2>
          {completed.map(mission => {
            const subj = mission.subjects as unknown as { name: string; code: string } | null
            const pct = Math.round((mission.score_at_failure / mission.total_at_failure) * 100)
            return (
              <div key={mission.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 opacity-70">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-700 uppercase truncate">{mission.topic}</p>
                    {subj && <p className="text-xs text-slate-400 font-medium">{subj.name}</p>}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 flex-shrink-0">Was {pct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Back link */}
      <div>
        <Link href="/student/dashboard" className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
