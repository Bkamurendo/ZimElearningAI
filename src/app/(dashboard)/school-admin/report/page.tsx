'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Loader2, ExternalLink } from 'lucide-react'

export default function SchoolReportPage() {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      window.open('/api/school-admin/report', '_blank')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/school-admin/analytics"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">School Report</h1>
              <p className="text-emerald-200 text-sm">Download a printable analytics report for your school</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Report card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText size={28} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">School Analytics Report</h2>
              <p className="text-slate-500 text-sm mt-1">
                A full PDF-ready report including student roster, enrolment trends by month,
                teaching staff, AI usage stats, and seat capacity — ready to share with
                your school board or administration.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Report includes:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {[
                'Summary statistics (students, teachers, AI requests, seat capacity)',
                'Student enrolment by month — last 6 months cohort',
                'Full student roster (name, email, join date, AI usage)',
                'Teaching staff directory',
                'School subscription & license details',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loading ? 'Generating...' : 'Open Report'}
            </button>
            <a
              href="/api/school-admin/report"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 text-sm font-semibold rounded-xl transition"
            >
              <ExternalLink size={16} />
              Open in new tab
            </a>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Once open, use <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">Ctrl + P</kbd> (or <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs">⌘ P</kbd> on Mac) to print or save as PDF.
          </p>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">Tip: Save as PDF</p>
          <p className="text-sm text-amber-700">
            When printing, select &ldquo;Save as PDF&rdquo; as the destination in your browser&apos;s print dialog.
            The report is formatted for A4 paper. Set margins to &ldquo;None&rdquo; or &ldquo;Minimum&rdquo; for best results.
          </p>
        </div>
      </div>
    </div>
  )
}
