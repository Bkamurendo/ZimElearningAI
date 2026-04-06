'use client'

import { useState, useEffect } from 'react'
import { Activity, Target, ChevronRight, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AuditItem {
  id: string
  name: string
  code: string
  score: number
  confidence: string
  color: string
  masteryCount: number
  totalTopics: number
  isCore: boolean
  recommendation: string
}

export default function PassPulseRings() {
  const [audit, setAudit]       = useState<AuditItem[]>([])
  const [overall, setOverall]   = useState<number>(0)
  const [likelihood, setLikelihood] = useState<string>('')
  const [corePasses, setCorePasses] = useState<number>(0)
  const [totalPasses, setTotalPasses] = useState<number>(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/student/readiness-audit')
      .then(res => res.json())
      .then(data => {
        if (data.audit) {
          setAudit(data.audit)
          setOverall(data.overallReadiness)
          setLikelihood(data.certificateLikelihood)
          setCorePasses(data.corePasses)
          setTotalPasses(data.totalPasses)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 size={24} className="text-emerald-500 animate-spin mb-3" />
        <p className="text-xs text-gray-400 font-medium">Analyzing diagnostic data...</p>
      </div>
    )
  }

  if (audit.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Overall Diagnostic Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-gray-800">ZIMSEC Readiness Pulse</h2>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-400"><strong>Requirement:</strong> 5 O-Levels incl. Maths, English, Science.</p>
              <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalPasses >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                   {totalPasses}/5 Passes
                 </span>
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${corePasses >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                   {corePasses}/3 Core
                 </span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-1">
                Likelihood: <span className={likelihood.startsWith('High') ? 'text-emerald-500' : 'text-amber-500'}>{likelihood}</span>
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${overall >= 50 ? 'border-emerald-500 shadow-lg shadow-emerald-100' : 'border-amber-400 shadow-lg shadow-amber-100'}`}>
              <span className={`text-xl font-black ${overall >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{overall}%</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-gray-400">Total Score</span>
          </div>
        </div>
      </div>

      {/* Subject Rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {audit.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.code}</p>
                   {s.isCore && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Core</span>}
                </div>
                <h3 className="text-sm font-bold text-gray-900 truncate">{s.name}</h3>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full bg-opacity-10 border border-opacity-20 ${s.color.replace('text-', 'bg-')} ${s.color.replace('text-', 'border-')} ${s.color}`}>
                {s.confidence}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${s.score >= 50 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                style={{ width: `${s.score}%` }} 
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-gray-500 italic truncate flex-1 leading-tight">
                "{s.recommendation}"
              </p>
              <Link href={`/student/subjects/${s.code}`} className="flex-shrink-0 bg-gray-50 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition group-hover:scale-105">
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Action Nudge */}
      {overall < 60 && (
        <Link href="/student/study-planner" className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-4 group hover:bg-amber-100 transition shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Target size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Diagnostic Alert: Under Threshold</p>
              <p className="text-[10px] text-amber-700">You are currently below 65% (Grade B threshold). Activate Autopilot?</p>
            </div>
          </div>
          <Zap size={16} className="text-amber-600 group-hover:scale-125 transition-transform" />
        </Link>
      )}
    </div>
  )
}
