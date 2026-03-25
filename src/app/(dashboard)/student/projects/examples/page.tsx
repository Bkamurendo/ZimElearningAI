import Link from 'next/link'
import {
  BookOpen,
  Leaf,
  Trophy,
  FlaskConical,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from 'lucide-react'
import { SAMPLE_PROJECTS } from '@/data/sbp-sample-projects'

const DIFFICULTY_BADGE: Record<string, string> = {
  foundation:   'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced:     'bg-red-100 text-red-700',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  foundation:   'Foundation',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

export default function SBPExamplesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              SBP Example Projects
            </h1>
          </div>
          <p className="mt-1 text-gray-500 text-sm sm:text-base max-w-2xl">
            Learn from annotated model projects — see how great Zimbabwe students think,
            research, and write
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── Info Banner ───────────────────────────────────────────────── */}
        <div className="mb-8 flex gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800 leading-relaxed">
            <span className="font-semibold">These are model projects created by MaFundi</span> to
            show you what excellent ZIMSEC SBP work looks like. Use them as
            inspiration&nbsp;—&nbsp;your project must be based on{' '}
            <span className="font-semibold">YOUR OWN observations and community</span>.
          </p>
        </div>

        {/* ── Project Grid ──────────────────────────────────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_PROJECTS.map((p) => (
            <Link
              key={p.slug}
              href={`/student/projects/examples/${p.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md"
            >
              {/* Badges row */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  <BookOpen className="h-3 w-3" />
                  {p.subject}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    DIFFICULTY_BADGE[p.difficulty]
                  }`}
                >
                  {DIFFICULTY_LABEL[p.difficulty]}
                </span>
              </div>

              {/* Title */}
              <h2 className="mb-2 text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-emerald-700">
                {p.title}
              </h2>

              {/* Heritage theme */}
              <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Leaf className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="line-clamp-1">{p.heritageTheme}</span>
              </div>

              {/* Grade + marks */}
              <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                  {p.grade}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  {p.estimatedMarks}
                </span>
              </div>

              {/* Summary */}
              <p className="mb-3 flex-1 text-xs leading-relaxed text-gray-600 line-clamp-2">
                {p.summary}
              </p>

              {/* Tags */}
              {p.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto flex items-center justify-end gap-1 text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                View Walkthrough
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {SAMPLE_PROJECTS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <FlaskConical className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">No example projects yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
