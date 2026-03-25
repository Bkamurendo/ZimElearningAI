import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FlaskConical, Users, CheckCircle2, Clock, Leaf } from 'lucide-react'
import TeacherProjectActions from './TeacherProjectActions'

type SBPAssignment = {
  id: string
  title: string
  description: string | null
  guidelines: string | null
  heritage_theme: string | null
  max_marks: number
  due_date: string | null
  zimsec_level: string | null
  published: boolean
  created_at: string
  subject: { name: string; code: string } | null
  submission_count: number
  submitted_count: number
  graded_count: number
}

export default async function TeacherProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: { id: string } | null; error: unknown }

  if (!teacher) redirect('/teacher/dashboard')

  const { data: rawAssignments } = await supabase
    .from('sbp_assignments')
    .select('id, title, description, guidelines, heritage_theme, max_marks, due_date, zimsec_level, published, created_at, subject:subjects(name, code)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false }) as {
      data: Omit<SBPAssignment, 'submission_count' | 'submitted_count' | 'graded_count'>[] | null
      error: unknown
    }

  const assignments = rawAssignments ?? []
  const ids = assignments.map(a => a.id)

  const { data: subs } = await supabase
    .from('sbp_submissions')
    .select('sbp_assignment_id, current_stage, graded_at')
    .in('sbp_assignment_id', ids.length > 0 ? ids : ['none']) as {
      data: { sbp_assignment_id: string; current_stage: string; graded_at: string | null }[] | null
      error: unknown
    }

  const counts: Record<string, { total: number; submitted: number; graded: number }> = {}
  for (const s of subs ?? []) {
    if (!counts[s.sbp_assignment_id]) counts[s.sbp_assignment_id] = { total: 0, submitted: 0, graded: 0 }
    counts[s.sbp_assignment_id].total++
    if (s.current_stage === 'submitted') counts[s.sbp_assignment_id].submitted++
    if (s.graded_at) counts[s.sbp_assignment_id].graded++
  }

  const list: SBPAssignment[] = assignments.map(a => ({
    ...a,
    submission_count: counts[a.id]?.total ?? 0,
    submitted_count: counts[a.id]?.submitted ?? 0,
    graded_count: counts[a.id]?.graded ?? 0,
  }))

  // Teacher's subjects for the create modal
  const { data: teacherSubjects } = await supabase
    .from('teacher_subjects')
    .select('subject:subjects(id, name, code)')
    .eq('teacher_id', teacher.id) as {
      data: { subject: { id: string; name: string; code: string } }[] | null
      error: unknown
    }

  const subjects = (teacherSubjects ?? []).map(ts => ts.subject).filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <FlaskConical size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School-Based Projects</h1>
            <p className="text-sm text-slate-500">ZIMSEC Heritage Curriculum — create and manage SBP assignments</p>
          </div>
        </div>
        <TeacherProjectActions subjects={subjects} mode="create" />
      </div>

      {/* Stats Row */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{list.length}</p>
            <p className="text-xs text-slate-500">Total Projects</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-emerald-600">{list.filter(a => a.published).length}</p>
            <p className="text-xs text-slate-500">Published</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-blue-600">{list.reduce((s, a) => s + a.submission_count, 0)}</p>
            <p className="text-xs text-slate-500">Active Students</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-2xl font-bold text-amber-600">{list.reduce((s, a) => s + a.submitted_count, 0)}</p>
            <p className="text-xs text-slate-500">Awaiting Marking</p>
          </div>
        </div>
      )}

      {/* Assignments List */}
      {list.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <FlaskConical size={36} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Projects Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Create your first School-Based Project assignment. Students will work through 6 stages and get AI guidance from MaFundi.
          </p>
          <TeacherProjectActions subjects={subjects} mode="create-prominent" />
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(asgn => (
            <div key={asgn.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {asgn.subject?.name ?? 'No Subject'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${asgn.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {asgn.published ? 'Published' : 'Draft'}
                    </span>
                    {asgn.zimsec_level && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{asgn.zimsec_level}</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{asgn.title}</h3>

                  {asgn.heritage_theme && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mb-2"><Leaf size={11} />{asgn.heritage_theme}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><Users size={11} />{asgn.submission_count} student{asgn.submission_count !== 1 ? 's' : ''} working</span>
                    {asgn.submitted_count > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium"><Clock size={11} />{asgn.submitted_count} to mark</span>
                    )}
                    {asgn.graded_count > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={11} />{asgn.graded_count} graded</span>
                    )}
                    <span className="font-medium text-slate-600">{asgn.max_marks} marks</span>
                    {asgn.due_date && (
                      <span className="flex items-center gap-1"><Clock size={11} />Due {new Date(asgn.due_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/teacher/projects/${asgn.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Users size={12} />
                    View Submissions
                  </Link>
                  <TeacherProjectActions assignment={asgn} subjects={subjects} mode="manage" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
