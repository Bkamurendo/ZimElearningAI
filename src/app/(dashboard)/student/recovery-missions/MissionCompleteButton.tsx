'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { completeMission } from './actions'

export default function MissionCompleteButton({ missionId }: { missionId: string }) {
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (done) {
    return (
      <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wide">
        <CheckCircle2 size={13} /> Marked Complete
      </span>
    )
  }

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await completeMission(missionId)
          setDone(true)
        })
      }}
      disabled={isPending}
      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs px-4 py-2 rounded-xl transition uppercase tracking-wide disabled:opacity-50"
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
      {isPending ? 'Saving…' : 'Mark Done'}
    </button>
  )
}
