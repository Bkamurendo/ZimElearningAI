'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function SchoolReportPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        const user = authData?.user
        
        if (authError || !user) {
          window.location.href = '/login'
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, school_id')
          .eq('id', user.id)
          .single()

        if (profileError || profile?.role?.toLowerCase() !== 'school_admin' || !profile?.school_id) {
          window.location.href = '/login'
          return
        }
      } catch (err) {
        console.error('Access check failed:', err)
        setError('Access verification failed.')
      } finally {
        setInitialLoading(false)
      }
    }
    checkAccess()
  }, [])

  async function handleDownload() {
    setLoading(true)
    try {
      window.open('/api/school-admin/report', '_blank')
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to generate report window.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-4xl mx-auto font-bold uppercase">
          <Link
            href="/school-admin/analytics"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-[10px] mb-4 transition uppercase font-bold"
          >
            <ArrowLeft size={14} /> Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Institutional Audit Report</h1>
              <p className="text-emerald-200 text-[10px] uppercase font-bold">Download a printable analytics report for your institution</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase px-4 py-3 rounded-xl shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 font-bold uppercase">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
              <FileText size={28} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Consolidated School Analytics</h2>
              <p className="text-slate-500 text-[10px] mt-1 italic font-medium lowercase first-letter:uppercase">
                Full PDF-ready intelligence report including student roster, enrolment trends,
                teaching staff directory, and platform capacity metrics.
              </p>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 mb-6 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Report Schema Includes:</p>
            <ul className="text-[10px] text-slate-600 space-y-2 uppercase font-bold">
              {[
                'Summary metrics (enrollment, staff, ai throughput)',
                'Enrolment cohort analysis — trailing 6 months',
                'Institutional student registry & identity logs',
                'Teaching staff authentication directory',
                'Subscription tier & institutional capacity verify',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl transition shadow-lg border-none uppercase tracking-widest"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loading ? 'Generating...' : 'Download Report'}
            </Button>
            <a
              href="/api/school-admin/report"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl transition shadow-sm uppercase tracking-widest"
            >
              <ExternalLink size={16} />
              Open In Tab
            </a>
          </div>

          <p className="text-[9px] text-slate-400 mt-6 font-bold uppercase italic tracking-tighter">
            PRO TIP: Use <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">CTRL + P</kbd> to save as PDF. Set margins to "None" for optimal rendering.
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-sm font-bold uppercase">
          <p className="text-[10px] font-black text-amber-800 mb-2 tracking-widest leading-none">PDF Generation Logic</p>
          <p className="text-[10px] text-amber-700 font-medium italic lowercase first-letter:uppercase">
            When printing, select "Save as PDF" as the destination. The report is calibrated for A4 landscape/portrait. Minimum margins recommended for high-fidelity export.
          </p>
        </div>
      </div>
    </div>
  )
}
