import Link from 'next/link'
import {
  Bot,
  Leaf,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { getSampleProject, type SampleProject, type SampleStage } from '@/data/sbp-sample-projects'

// ── Constants ────────────────────────────────────────────────────────────────

type StageKey = keyof SampleProject['stages']

const STAGES: { key: StageKey; label: string; color: string; badgeClass: string }[] = [
  { key: 'proposal',       label: 'Proposal',       color: 'text-violet-700',  badgeClass: 'bg-violet-100 text-violet-700' },
  { key: 'research',       label: 'Research',        color: 'text-blue-700',    badgeClass: 'bg-blue-100 text-blue-700' },
  { key: 'planning',       label: 'Planning',        color: 'text-amber-700',   badgeClass: 'bg-amber-100 text-amber-700' },
  { key: 'implementation', label: 'Implementation',  color: 'text-orange-700',  badgeClass: 'bg-orange-100 text-orange-700' },
  { key: 'evaluation',     label: 'Evaluation',      color: 'text-teal-700',    badgeClass: 'bg-teal-100 text-teal-700' },
]

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

// ── Sub-components (plain functions, no 'use client') ─────────────────────────

function StageSection({
  stageKey,
  stageNum,
  label,
  badgeClass,
  stage,
}: {
  stageKey: string
  stageNum: number
  label: string
  badgeClass: string
  stage: SampleStage
}) {
  return (
    <section id={stageKey} className="scroll-mt-6">
      {/* Stage header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
          {stageNum}
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Stage {stageNum}: {label}
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {label}
        </span>
      </div>

      {/* Written content */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <p className="whitespace-pre-line font-mono text-sm leading-relaxed text-gray-800">
          {stage.content}
        </p>
      </div>

      {/* MaFundi annotation */}
      <div className="mb-4 rounded-xl bg-violet-50 border border-violet-200 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Bot className="h-4 w-4 shrink-0 text-violet-600" />
          <span className="text-sm font-semibold text-violet-800">MaFundi&rsquo;s Analysis</span>
        </div>
        <p className="text-sm leading-relaxed text-violet-700">{stage.mafundiNote}</p>
      </div>

      {/* Key strengths */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Key Strengths
        </p>
        <ul className="space-y-1.5">
          {stage.keyStrengths.map((strength, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {strength}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function Page({ params }: { params: { slug: string } }) {
  const project = getSampleProject(params.slug)

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <BookOpen className="h-12 w-12 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-700">Project not found</h1>
        <p className="text-sm text-gray-500">
          This example project does not exist or may have been removed.
        </p>
        <Link
          href="/student/projects/examples"
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Examples
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/student/projects/examples"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            All Examples
          </Link>

          {/* Badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <BookOpen className="h-3 w-3" />
              {project.subject}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                DIFFICULTY_BADGE[project.difficulty]
              }`}
            >
              {DIFFICULTY_LABEL[project.difficulty]}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            {project.title}
          </h1>

          {/* Heritage theme */}
          <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
            <Leaf className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{project.heritageTheme}</span>
          </div>

          {/* Grade + marks */}
          <div className="mb-4 flex flex-wrap items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              {project.grade}
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-400" />
              Estimated marks: <span className="font-semibold text-gray-700">{project.estimatedMarks}</span>
            </span>
          </div>

          {/* Summary */}
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-gray-600">
            {project.summary}
          </p>

          {/* How to use box */}
          <div className="flex gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 max-w-3xl">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-sm text-emerald-800 leading-relaxed">
              <span className="font-semibold">How to use this example: </span>
              Read each stage carefully. For each stage, read MaFundi&rsquo;s annotation
              (the purple boxes) to understand <em>WHY</em> it works. Then write{' '}
              <span className="font-semibold">YOUR OWN version</span> based on your
              community and observations.
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* LEFT: Stage navigator */}
          <aside className="shrink-0 lg:w-56">
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Stages
              </p>
              <nav className="space-y-1">
                {STAGES.map((s, i) => (
                  <a
                    key={s.key}
                    href={`#${s.key}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>
                      {i + 1}. {s.label}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* RIGHT: Stage content */}
          <div className="min-w-0 flex-1 space-y-10">
            {STAGES.map((s, i) => (
              <StageSection
                key={s.key}
                stageKey={s.key}
                stageNum={i + 1}
                label={s.label}
                badgeClass={s.badgeClass}
                stage={project.stages[s.key]}
              />
            ))}

            {/* ── Key Lessons ─────────────────────────────────────────── */}
            <section>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">
                    Key Lessons from This Example
                  </h3>
                </div>
                <ul className="space-y-2">
                  {project.keyLessons.map((lesson, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── Common Mistakes ─────────────────────────────────────── */}
            <section>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">
                    Common Mistakes to Avoid
                  </h3>
                </div>
                <ul className="space-y-2">
                  {project.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────────── */}
            <section>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                <h3 className="mb-1 text-lg font-bold text-gray-900">
                  Ready to write YOUR project?
                </h3>
                <p className="mb-5 text-sm text-gray-500">
                  You&rsquo;ve seen how it&rsquo;s done — now put your own voice and
                  community into it.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/student/projects/start"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Start Your Own Project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/student/projects/examples"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Browse More Examples
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
