import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FlaskConical, Plus, ChevronRight, Calendar, Trophy, Clock, Leaf, Sparkles, BookOpen, Crown } from 'lucide-react'

const STAGE_ORDER = ['proposal', 'research', 'planning', 'implementation', 'evaluation', 'submitted']

const STAGE_LABELS: Record<string, string> = {
  proposal: 'Proposal',
  research: 'Research',
  planning: 'Planning',
  implementation: 'Implementation',
  evaluation: 'Evaluation',
  submitted: 'Submitted',
}

const STAGE_COLORS: Record<string, string> = {
  proposal: 'bg-violet-100 text-violet-700',
  research: 'bg-blue-100 text-blue-700',
  planning: 'bg-amber-100 text-amber-700',
  implementation: 'bg-orange-100 text-orange-700',
  evaluation: 'bg-teal-100 text-teal-700',
  submitted: 'bg-emerald-100 text-emerald-700',
}

function stageProgress(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage)
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100)
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type Submission = {
  id: string
  project_title: string | null
  current_stage: string
  marks_awarded: number | null
  graded_at: string | null
  updated_at: string
  self_initiated: boolean
  subject_name: string | null
  heritage_theme: string | null
  assignment: {
    id: string
    title: string
    heritage_theme: string | null
    max_marks: number
    due_date: string | null
    subject: { name: string; code: string } | null
  } | null
}

type Available = {
  id: string
  title: string
  description: string | null
  heritage_theme: string | null
  max_marks: number
  due_date: string | null
  subject: { name: string; code: string } | null
}

export default async function StudentProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!student) redirect('/student/dashboard')

  // My active/completed submissions
  const { data: submissions } = await supabase
    .from('sbp_submissions')
    .select(`
      id, project_title, current_stage, marks_awarded, graded_at, updated_at,
      self_initiated, subject_name, heritage_theme,
      assignment:sbp_assignments(id, title, heritage_theme, max_marks, due_date, subject:subjects(name, code))
    `)
    .eq('student_id', student.id)
    .order('updated_at', { ascending: false }) as { data: Submission[] | null; error: unknown }

  // Available (published, enrolled subject, not started yet)
  const startedIds = (submissions ?? [])
    .map(s => s.assignment?.id)
    .filter(Boolean) as string[]

  const { data: enrolled } = await supabase
    .from('student_subjects')
    .select('subject_id')
    .eq('student_id', student.id) as { data: { subject_id: string }[] | null; error: unknown }

  const subjectIds = (enrolled ?? []).map(e => e.subject_id)

  let available: Available[] = []
  if (subjectIds.length > 0) {
    let q = supabase
      .from('sbp_assignments')
      .select('id, title, description, heritage_theme, max_marks, due_date, subject:subjects(name, code)')
      .eq('published', true)
      .in('subject_id', subjectIds)
      .order('due_date', { ascending: true })

    if (startedIds.length > 0) {
      q = q.not('id', 'in', `(${startedIds.join(',')})`)
    }
    const { data } = await q as { data: Available[] | null; error: unknown }
    available = data ?? []
  }

  const active = (submissions ?? []).filter(s => s.current_stage !== 'submitted')
  const completed = (submissions ?? []).filter(s => s.current_stage === 'submitted')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <FlaskConical size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School-Based Projects</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ZIMSEC Heritage Curriculum — continuous assessment projects
              </p>
            </div>
          </div>

          {/* ── Start Your Own Project button ── */}
          <Link
            href="/student/projects/start"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            <Plus size={16} />
            Start Your Own Project
          </Link>
        </div>

        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <Leaf size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            School-Based Projects are a formal ZIMSEC continuous assessment component. You can start your own project at any time, or begin one set by your teacher. Work through all 6 stages — <strong>Proposal → Research → Planning → Implementation → Evaluation → Submission</strong> — and get guided feedback from MaFundi at every step.
          </span>
        </div>

        {/* Resource cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/student/projects/examples"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Example Projects</p>
              <p className="text-xs text-slate-500">6 annotated model SBPs — learn how great projects are built</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 ml-auto flex-shrink-0" />
          </Link>
          <Link
            href="/student/projects/templates"
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-xl hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                Pro Templates <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">PRO</span>
              </p>
              <p className="text-xs text-slate-500">MaFundi generates a full example for your topic & subject</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 ml-auto flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Active Projects */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">My Active Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map(sub => {
              const days = daysUntil(sub.assignment?.due_date ?? null)
              const progress = stageProgress(sub.current_stage)
              const subjectLabel = sub.assignment?.subject?.name ?? sub.subject_name ?? 'My Project'
              const heritageLabel = sub.assignment?.heritage_theme ?? sub.heritage_theme
              return (
                <Link
                  key={sub.id}
                  href={`/student/projects/${sub.id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {sub.self_initiated && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                          <Sparkles size={10} /> Self-Initiated
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {subjectLabel}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[sub.current_stage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STAGE_LABELS[sub.current_stage] ?? sub.current_stage}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {sub.project_title || sub.assignment?.title || 'Untitled Project'}
                  </h3>

                  {heritageLabel && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
                      <Leaf size={11} />
                      {heritageLabel}
                    </p>
                  )}

                  {/* Stage Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Proposal</span>
                      <span>Submit</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    {days !== null && (
                      <span className={`flex items-center gap-1 ${days <= 7 ? 'text-red-500 font-semibold' : days <= 14 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <Calendar size={11} />
                        {days <= 0 ? 'Overdue' : `${days}d left`}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-emerald-600 font-medium ml-auto">
                      Continue <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Teacher-Set Projects Available to Start */}
      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Projects Set by Your Teacher</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map(asgn => {
              const days = daysUntil(asgn.due_date)
              return (
                <div key={asgn.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {asgn.subject?.name ?? 'Unknown Subject'}
                    </span>
                    <span className="text-xs text-slate-400">{asgn.max_marks} marks</span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">{asgn.title}</h3>

                  {asgn.heritage_theme && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                      <Leaf size={11} />
                      {asgn.heritage_theme}
                    </p>
                  )}

                  {asgn.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{asgn.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {days !== null && (
                      <span className={`text-xs flex items-center gap-1 ${days <= 7 ? 'text-red-500 font-semibold' : days <= 14 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <Clock size={11} />
                        {days <= 0 ? 'Overdue' : `Due in ${days}d`}
                      </span>
                    )}
                    <Link
                      href={`/student/projects/start?assignment=${asgn.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <Plus size={12} />
                      Start Project
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Completed Projects */}
      {completed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Completed &amp; Submitted</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map(sub => (
              <Link
                key={sub.id}
                href={`/student/projects/${sub.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {sub.assignment?.subject?.name ?? sub.subject_name ?? 'My Project'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Submitted
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {sub.project_title || sub.assignment?.title || 'Untitled Project'}
                </h3>
                {sub.marks_awarded !== null ? (
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">
                      {sub.marks_awarded}/{sub.assignment?.max_marks ?? 100}
                    </span>
                    <span className="text-xs text-slate-500">marks awarded</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Awaiting teacher marking</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State — always show Start Your Own Project prominently */}
      {active.length === 0 && available.length === 0 && completed.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <FlaskConical size={36} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Projects Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            You can start your own project right now — MaFundi will guide you through every stage with questions and feedback based on the ZIMSEC Heritage Curriculum.
          </p>
          <Link
            href="/student/projects/start"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            Start Your Own Project
          </Link>
        </div>
      )}
    </div>
  )
}
