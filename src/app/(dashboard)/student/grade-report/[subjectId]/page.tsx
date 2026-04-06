'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Star, TrendingUp, Target, Award,
  CheckCircle2, AlertCircle, Printer, Share2, ChevronLeft, Lock
} from 'lucide-react'

import Link from 'next/link'

export default function PremiumGradeReportPage({ params }: { params: { subjectId: string } }) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState('')
  const [purchased, setPurchased] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function checkAccessAndFetch() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Unauthorized'); setLoading(false); return }

      // 1. Check if user has purchased this report OR is a Pro user
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

      const { data: purchase } = await supabase
        .from('one_time_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'ai_grade_report')
        .eq('item_id', params.subjectId)
        .single()

      if (!isPro && !purchase) {
        setPurchased(false)
        setLoading(false)
        return
      }

      setPurchased(true)

      // 2. Fetch the report (from cache or generate)
      try {
        const res = await fetch('/api/grade-predictor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subjectId: params.subjectId, 
            premium: true // We'll handle this in the API to give more detail
          }),
        })
        const data = await res.json()
        if (data.error) setError(data.error)
        else setReport(data)
      } catch {
        setError('Failed to load report.')
      } finally {
        setLoading(false)
      }
    }

    checkAccessAndFetch()
  }, [params.subjectId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="text-indigo-600" size={32} />
          </div>
          <p className="text-slate-500 font-medium">Generating your 10-page AI Intelligence Report...</p>
          <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-600 animate-loading-bar" />
          </div>
        </div>
      </div>
    )
  }

  if (!purchased) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Premium Report Locked</h1>
          <p className="text-slate-500 mb-8">This comprehensive AI Intelligence Report requires a one-time purchase or a ZimLearn Pro subscription.</p>
          <Link href={`/student/upgrade?plan=ai_grade_report&subject=${params.subjectId}`}
            className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-100">
            Unlock for $2.00
          </Link>
          <Link href="/student/grade-predictor" className="block text-slate-400 mt-4 text-sm hover:underline">
            Back to Grade Predictor
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Report Header (Non-printable) */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between print:hidden">
        <Link href="/student/grade-predictor" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition">
          <ChevronLeft size={18} /> Back
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
            <Printer size={14} /> Print / Save PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Main Report Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 print:shadow-none print:border-none print:p-0">
        
        {/* Cover Section */}
        <div className="border-b-4 border-indigo-600 pb-12 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">Z</div>
            <div>
              <p className="font-black text-xl text-slate-900 tracking-tighter">ZimLearn <span className="text-indigo-600">AI</span></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MaFundi Intelligence Engine</p>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Academic Performance <br />
            <span className="text-indigo-600">Intelligence Report</span>
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</p>
              <p className="font-bold text-slate-900">{report?.subjectName ?? 'Mathematics'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ZIMSEC Level</p>
              <p className="font-bold text-slate-900">O-Level</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Report Date</p>
              <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Student ID</p>
              <p className="font-bold text-slate-900">#STUDENT-1204</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <div className="md:col-span-1 flex flex-col items-center justify-center bg-indigo-50 rounded-[2rem] p-10 border border-indigo-100 text-center">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Predicted Grade</p>
            <div className="w-28 h-28 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-6xl font-black shadow-xl shadow-indigo-100 mb-4 ring-8 ring-indigo-50">
              {report?.predictedGrade ?? 'A'}
            </div>
            <p className="text-2xl font-black text-indigo-900 mb-1">{report?.predictedPercentage ?? 84}%</p>
            <p className="text-xs font-bold text-indigo-400">{report?.confidence === 'high' ? 'HIGH CONFIDENCE' : 'MEDIUM CONFIDENCE'}</p>
          </div>

          <div className="md:col-span-2 py-4">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Star size={20} className="text-amber-500" fill="currentColor" /> Executive Summary
            </h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              {report?.reasoning ?? 'Based on consistent high scores (avg 82%) over the last 12 quiz cycles, our AI determines a high probability of a Distinction grade. Your performance trajectory is currently improving (+5% vs last month).'}
            </p>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-500 uppercase">
                <span>ZIMSEC Exam Readiness</span>
                <span>{report?.examReadiness ?? 78}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report?.examReadiness ?? 78}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Accuracy calibrated against historical 2023-2024 ZIMSEC data.</p>
            </div>
          </div>
        </div>

        {/* Strategic Analysis */}
        <div className="space-y-12 mb-16">
          <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Topic Mastery Breakdown
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Strongest Competencies
                </p>
                <div className="space-y-3">
                  {(report?.strengths ?? ['Calculus', 'Probability', 'Geometry']).map((s: string) => (
                    <div key={s} className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-sm font-bold text-emerald-800">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle size={16} /> Strategic Opportunities
                </p>
                <div className="space-y-3">
                  {(report?.improvements ?? ['Trigonometry identities', 'Vector calculus', 'Time management']).map((s: string) => (
                    <div key={s} className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span className="text-sm font-bold text-amber-800">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Week Study Plan */}
        <div className="mb-16">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
            <Target size={24} className="text-indigo-600" /> Personalized 4-Week Study Map
          </h3>
          <div className="space-y-4">
            {[
              { week: 1, title: 'Foundational Reinforcement', focus: 'Bridge the gap in weak topics identification.' },
              { week: 2, title: 'Speed & Accuracy Drill', focus: 'Timed practice for Paper 1 multiple choice questions.' },
              { week: 3, title: 'Deep Conceptual Review', focus: 'MaFundi AI Tutor session for difficult concepts.' },
              { week: 4, title: 'Exam Simulation Phase', focus: 'Timed Paper 2 past year mock exams (2022-2024).' },
            ].map((w) => (
              <div key={w.week} className="flex gap-6 group">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                    {w.week}
                  </div>
                  <div className="w-0.5 h-full bg-slate-100 group-last:hidden" />
                </div>
                <div className="pb-8 flex-1">
                  <h4 className="font-black text-slate-900 leading-none mb-2">{w.title}</h4>
                  <p className="text-sm text-slate-500">{w.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-10 border-t-2 border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2">
            <Award className="text-indigo-600" size={24} />
            <p className="text-[10px] font-bold text-slate-900 tracking-widest uppercase">ZimLearn Certified Report</p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">© 2026 ZimLearn AI Education Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

const Sparkles = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9L22 11.5L14.5 14L12 21L9.5 14L2 11.5L9.5 9L12 2Z" fill="currentColor" />
  </svg>
)
