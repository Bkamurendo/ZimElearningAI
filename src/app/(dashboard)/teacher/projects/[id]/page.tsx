export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FlaskConical, User, ChevronDown, Trophy, Clock, CheckCircle2, Leaf } from 'lucide-react'
import Link from 'next/link'
import GradePanel from './GradePanel'

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

type StageEntry = {
  id: string
  stage: string
  content: string
  ai_feedback: string | null
  teacher_comment: string | null
  created_at: string
}

type StudentSubmission = {
  id: string
  project_title: string | null
  current_stage: string
  marks_awarded: number | null
  teacher_feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  created_at: string
  student: {
    id: string
    user: { full_name: string; email: string } | null
  } | null
  stage_entries: StageEntry[]
}

type Assignment = {
  id: string
  title: string
  description: string | null
  guidelines: string | null
  heritage_theme: string | null
  max_marks: number
  due_date: string | null
  zimsec_level: string | null
  published: boolean
  subject: { name: string; code: string } | null
}

export default async function TeacherProjectSubmissionsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  const { data: assignment } = await supabase
    .from('sbp_assignments')
    .select('id, title, description, guidelines, heritage_theme, max_marks, due_date, zimsec_level, published, subject:subjects(name, code)')
    .eq('id', params.id)
    .eq('teacher_id', teacher.id)
    .single() as { data: Assignment | null; error: unknown }

  if (!assignment) redirect('/teacher/projects')

  const { data: rawSubs } = await supabase
    .from('sbp_submissions')
    .select(`
      id, project_title, current_stage, marks_awarded, teacher_feedback,
      submitted_at, graded_at, created_at,
      student:student_profiles(id, user:profiles(full_name, email))
    `)
    .eq('sbp_assignment_id', params.id)
    .order('created_at', { ascending: false })

  const submissionList = rawSubs ?? []
  const subIds = submissionList.map((s: { id: string }) => s.id)

  const { data: entries } = await supabase
    .from('sbp_stage_entries')
    .select('id, submission_id, stage, content, ai_feedback, teacher_comment, created_at')
    .in('submission_id', subIds.length > 0 ? subIds : ['none'])
    .order('created_at', { ascending: true }) as {
      data: (StageEntry & { submission_id: string })[] | null
      error: unknown
    }

  const entriesBySubmission: Record<string, StageEntry[]> = {}
  for (const e of entries ?? []) {
    if (!entriesBySubmission[e.submission_id]) entriesBySubmission[e.submission_id] = []
    entriesBySubmission[e.submission_id].push(e)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submissions: StudentSubmission[] = (submissionList as any[]).map((s: any) => ({
    ...s,
    stage_entries: entriesBySubmission[s.id] ?? [],
  }))

  const toMark = submissions.filter(s => s.current_stage === 'submitted' && !s.graded_at)
  const graded = submissions.filter(s => s.graded_at)
  const inProgress = submissions.filter(s => s.current_stage !== 'submitted')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/teacher/projects" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Projects</Link>
          <ChevronDown size={12} className="-rotate-90" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{assignment.title}</span>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {assignment.subject?.name ?? 'Subject'}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${assignment.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {assignment.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
            {assignment.heritage_theme && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><Leaf size={11} />{assignment.heritage_theme}</p>
            )}
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-semibold text-slate-800 dark:text-slate-200">{assignment.max_marks} marks</p>
            {assignment.due_date && <p>Due {new Date(assignment.due_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgress.length}</p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-bold text-amber-600">{toMark.length}</p>
          <p className="text-xs text-slate-500">To Mark</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-2xl font-bold text-emerald-600">{graded.length}</p>
          <p className="text-xs text-slate-500">Graded</p>
        </div>
      </div>

      {/* To Mark — highest priority */}
      {toMark.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            Submitted — Awaiting Your Marks ({toMark.length})
          </h2>
          <div className="space-y-4">
            {toMark.map(sub => (
              <SubmissionCard key={sub.id} sub={sub} maxMarks={assignment.max_marks} assignmentId={params.id} />
            ))}
          </div>
        </section>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">Still Working ({inProgress.length})</h2>
          <div className="space-y-4">
            {inProgress.map(sub => (
              <SubmissionCard key={sub.id} sub={sub} maxMarks={assignment.max_marks} assignmentId={params.id} />
            ))}
          </div>
        </section>
      )}

      {/* Graded */}
      {graded.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Graded ({graded.length})
          </h2>
          <div className="space-y-4">
            {graded.map(sub => (
              <SubmissionCard key={sub.id} sub={sub} maxMarks={assignment.max_marks} assignmentId={params.id} />
            ))}
          </div>
        </section>
      )}

      {submissions.length === 0 && (
        <div className="text-center py-20">
          <FlaskConical size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Submissions Yet</h3>
          <p className="text-sm text-slate-400">{assignment.published ? 'Students have not started this project yet.' : 'Publish this project so students can see it.'}</p>
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ sub, maxMarks, assignmentId }: { sub: StudentSubmission; maxMarks: number; assignmentId: string }) {
  const studentName = (sub.student?.user as unknown as { full_name: string } | null)?.full_name ?? 'Unknown Student'
  const stageIdx = STAGE_ORDER.indexOf(sub.current_stage)
  const progress = Math.round(((stageIdx + 1) / STAGE_ORDER.length) * 100)

  return (
    <details className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 group">
      <summary className="list-none cursor-pointer p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{studentName}</p>
              <p className="text-xs text-slate-500">{sub.project_title ?? 'No title set yet'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[sub.current_stage] ?? 'bg-gray-100 text-gray-600'}`}>
              {STAGE_LABELS[sub.current_stage] ?? sub.current_stage}
            </span>
            {sub.marks_awarded !== null && (
              <span className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                <Trophy size={13} />{sub.marks_awarded}/{maxMarks}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs">{progress}%</span>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
          </div>
        </div>
      </summary>

      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        {/* Stage entries timeline */}
        {sub.stage_entries.length > 0 ? (
          <div className="space-y-3 mb-5">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Student Work</h4>
            {sub.stage_entries.map(entry => (
              <div key={entry.id} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STAGE_COLORS[entry.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STAGE_LABELS[entry.stage]}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleDateString('en-ZW')}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line line-clamp-3">{entry.content}</p>
                {entry.teacher_comment && (
                  <p className="text-xs text-blue-600 mt-1 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                    <strong>Your comment:</strong> {entry.teacher_comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-4">Student has not added any entries yet.</p>
        )}

        {/* Grading Panel */}
        <GradePanel
          submissionId={sub.id}
          assignmentId={assignmentId}
          currentMarks={sub.marks_awarded}
          currentFeedback={sub.teacher_feedback}
          maxMarks={maxMarks}
          entries={sub.stage_entries}
        />
      </div>
    </details>
  )
}
