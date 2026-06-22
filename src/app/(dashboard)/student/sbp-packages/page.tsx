import { Package, CheckCircle, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import SbpPackageGenerator from '@/components/SbpPackageGenerator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SBP Packages | ZimLearn AI',
}

export default function StudentSbpPackagesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SBP Packages</h1>
              <span className="text-xs font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                <CheckCircle size={10} /> HBC 2024–2030
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate a complete ZIMSEC-compliant SBP example for any subject, form, and topic
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: CheckCircle, text: 'ZIMSEC SBP Guidelines Compliant', color: 'text-green-600 dark:text-green-400' },
            { icon: BookOpen, text: 'All 5 stages with MaFundi annotations', color: 'text-blue-600 dark:text-blue-400' },
            { icon: ExternalLink, text: 'Share via WhatsApp or download', color: 'text-slate-600 dark:text-slate-400' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm">
              <Icon size={14} className={`flex-shrink-0 ${color}`} />
              <span className="text-slate-600 dark:text-slate-400">{text}</span>
            </div>
          ))}
        </div>

        {/* Reminder */}
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <span className="text-base leading-none flex-shrink-0">⚠️</span>
          <span>
            <strong>Guidance only.</strong> Use this package to understand structure and what ZIMSEC markers look for.
            Your submitted project must be written in your own words, based on your own community observations and research.
            <Link href="/student/projects" className="underline ml-1">Start your real project →</Link>
          </span>
        </div>
      </div>

      <SbpPackageGenerator upgradeHref="/student/upgrade" />
    </div>
  )
}
