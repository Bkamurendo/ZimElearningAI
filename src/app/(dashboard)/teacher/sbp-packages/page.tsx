import { Package, CheckCircle, Users, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import SbpPackageGenerator from '@/components/SbpPackageGenerator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SBP Packages | ZimLearn AI — Teacher',
}

export default function TeacherSbpPackagesPage() {
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
                <CheckCircle size={10} /> For Teachers
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate model SBP projects to guide your students — then share directly via WhatsApp
            </p>
          </div>
        </div>

        {/* Teacher-specific use cases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { icon: BookOpen, text: 'Show students what excellent work looks like' },
            { icon: Users, text: 'Share model projects to your class on WhatsApp' },
            { icon: CheckCircle, text: 'Align your assignment briefs to HBC themes' },
            { icon: ArrowRight, text: 'Create assignments based on generated models', href: '/teacher/projects' },
          ].map(({ icon: Icon, text, href }) => (
            <div key={text} className="flex items-start gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
              <Icon size={13} className="flex-shrink-0 text-green-500 mt-0.5" />
              {href
                ? <Link href={href} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{text}</Link>
                : <span>{text}</span>
              }
            </div>
          ))}
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <span className="text-base leading-none flex-shrink-0">💡</span>
          <span>
            <strong>Teacher tip:</strong> After generating a package, share the WhatsApp summary to your class group so students understand the expected structure.
            Then create an official assignment in <Link href="/teacher/projects" className="underline">Projects</Link> and let students submit their own original work through ZimLearn.
          </span>
        </div>
      </div>

      <SbpPackageGenerator upgradeHref="/teacher/upgrade" />
    </div>
  )
}
