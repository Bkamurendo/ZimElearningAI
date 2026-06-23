'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, AlertCircle, Loader2, TrendingUp, BookOpen, Target, ChevronRight } from 'lucide-react'

interface SubjectAudit {
  id: string
  name: string
  code: string
  isCore: boolean
  score: number
  confidence: string
  color: string
  masteryCount: number
  totalTopics: number
  recommendation: string
}

interface AuditData {
  success: boolean
  audit: SubjectAudit[]
  overallReadiness: number
  certificateLikelihood: string
  corePasses: number
  totalPasses: number
}

const CONFIDENCE_CONFIG: Record<string, { bg: string; border: string; bar: string; badge: string }> = {
  'Distinction (A)': { bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  'Credit (B)':      { bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700'    },
  'Pass (C)':        { bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700'  },
  'Weak Pass (D)':   { bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700'},
}

const CERT_COLORS: Record<string, string> = {
  'High (On Track)':      'bg-emerald-50 border-emerald-200 text-emerald-700',
  'Medium (Bridging)':    'bg-amber-50 border-amber-200 text-amber-700',
  'Critical (Needs Attention)': 'bg-red-50 border-red-200 text-red-700',
}

export default function SyllabusMasteryMap() {
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/student/readiness-audit')
      .then(res => res.json())
      .then((json: AuditData) => {
        if (json.success) {
          setData(json)
        } else {
          setError('Could not load mastery data.')
        }
      })
      .catch(() => setError('Network error loading syllabus data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Syllabus Mastery Map</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-emerald-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !data || data.audit.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Syllabus Mastery Map</h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">
            {error ?? 'No mastery data yet. Take quizzes in your subjects to build your profile!'}
          </p>
          <Link
            href="/student/subjects"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            Browse subjects <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const certStyle = CERT_COLORS[data.certificateLikelihood] ?? CERT_COLORS['Critical (Needs Attention)']

  return (
    <div className="space-y-4">

      {/* Certificate Likelihood Banner */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${certStyle}`}>
        <div className="flex items-center gap-2.5">
          <Target size={18} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-black leading-tight">ZIMSEC Certificate Readiness</p>
            <p className="text-xs opacity-75 font-medium">
              {data.corePasses}/3 core passes · {data.totalPasses} subject passes
            </p>
          </div>
        </div>
        <span className="text-xs font-black uppercase tracking-tight px-3 py-1 rounded-full bg-white/60">
          {data.certificateLikelihood}
        </span>
      </div>

      {/* Overall Readiness */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Overall Exam Readiness</p>
          <span className={`text-lg font-black ${
            data.overallReadiness >= 65 ? 'text-emerald-600' :
            data.overallReadiness >= 50 ? 'text-amber-600' : 'text-red-500'
          }`}>{data.overallReadiness}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              data.overallReadiness >= 65 ? 'bg-emerald-500' :
              data.overallReadiness >= 50 ? 'bg-amber-400' : 'bg-red-400'
            }`}
            style={{ width: `${data.overallReadiness}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Based on quiz scores and topic mastery across all enrolled subjects</p>
      </div>

      {/* Per-Subject Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
          Subject-by-Subject Analysis
        </h3>
        {data.audit.map(subject => {
          const cfg = CONFIDENCE_CONFIG[subject.confidence] ?? { bg: 'bg-gray-50', border: 'border-gray-200', bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500' }
          return (
            <div key={subject.id} className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-sm">{subject.name}</h4>
                    {subject.isCore && (
                      <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase tracking-tight">
                        CORE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{subject.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-gray-900">{subject.score}<span className="text-xs font-semibold text-gray-400">%</span></p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight ${cfg.badge}`}>
                    {subject.confidence}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`}
                  style={{ width: `${subject.score}%` }}
                />
              </div>

              {/* Mastery counts */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {subject.totalTopics > 0 ? (
                    <>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={11} /> {subject.masteryCount} mastered
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Circle size={11} /> {subject.totalTopics - subject.masteryCount} remaining
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">No quiz attempts yet</span>
                  )}
                </div>
                <Link
                  href={`/student/quiz/${subject.code}`}
                  className="text-[10px] font-black text-gray-600 hover:text-emerald-600 transition underline underline-offset-2"
                >
                  Practice →
                </Link>
              </div>

              {/* Recommendation */}
              <div className="mt-3 flex items-start gap-2 p-2.5 bg-white/60 rounded-xl">
                <AlertCircle size={13} className="text-gray-400 flex-shrink-0 mt-px" />
                <p className="text-[10px] text-gray-600 leading-snug">
                  <span className="font-bold">Next step:</span> {subject.recommendation}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
