'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FlaskConical, Leaf, ArrowRight, Sparkles, Bot } from 'lucide-react'

const ZIMSEC_SUBJECTS = [
  'Mathematics', 'English Language', 'Shona', 'Ndebele',
  'Combined Science', 'Biology', 'Physics', 'Chemistry',
  'Agriculture', 'Geography', 'History', 'Commerce',
  'Accounts', 'Computer Science', 'Food and Nutrition',
  'Fashion and Fabrics', 'Building Technology', 'Art and Craft',
  'Music', 'Physical Education', 'General Paper',
  'Environmental Science', 'Social Science', 'Other',
]

const HERITAGE_THEMES = [
  'Local environment & ecology',
  'Indigenous farming & food systems',
  'Community health & nutrition',
  'Water & sanitation',
  'Traditional technology & craft',
  'Cultural heritage & oral traditions',
  'Entrepreneurship & local economy',
  'Energy & natural resources',
  'Disaster risk & climate resilience',
  'Other (describe in your proposal)',
]

function StartProjectForm() {
  const router = useRouter()
  const params = useSearchParams()
  const assignmentId = params.get('assignment') ?? ''
  const isSelfInitiated = !assignmentId

  const [projectTitle, setProjectTitle] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [heritageTheme, setHeritageTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [assignment, setAssignment] = useState<{
    title: string
    description: string | null
    heritage_theme: string | null
    max_marks: number
    subject: { name: string } | null
  } | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    fetch('/api/student/sbp')
      .then(r => r.json())
      .then(d => {
        const found = d.available?.find((a: { id: string }) => a.id === assignmentId)
        if (found) setAssignment(found)
      })
  }, [assignmentId])

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!projectTitle.trim()) { setError('Please enter a project title'); return }
    if (isSelfInitiated && !subjectName) { setError('Please select a subject'); return }
    setLoading(true)
    setError('')
    try {
      const body = isSelfInitiated
        ? {
            self_initiated: true,
            project_title: projectTitle.trim(),
            subject_name: subjectName,
            heritage_theme: heritageTheme || null,
          }
        : {
            sbp_assignment_id: assignmentId,
            project_title: projectTitle.trim(),
          }

      const res = await fetch('/api/student/sbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start project'); return }
      router.push(`/student/projects/${data.submission.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            {isSelfInitiated
              ? <Sparkles size={22} className="text-white" />
              : <FlaskConical size={22} className="text-white" />
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isSelfInitiated ? 'Start Your Own Project' : 'Start This Project'}
            </h1>
            <p className="text-sm text-slate-500">ZIMSEC School-Based Project</p>
          </div>
        </div>

        {/* Teacher assignment context */}
        {assignment && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-emerald-600 mb-1">
              {assignment.subject?.name ?? 'Subject'} — {assignment.max_marks} marks
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{assignment.title}</p>
            {assignment.heritage_theme && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <Leaf size={11} />{assignment.heritage_theme}
              </p>
            )}
            {assignment.description && (
              <p className="text-xs text-slate-500 mt-2">{assignment.description}</p>
            )}
          </div>
        )}

        {/* MaFundi intro for self-initiated */}
        {isSelfInitiated && (
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-6 flex gap-3">
            <Bot size={18} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-violet-800 dark:text-violet-300">
              <p className="font-semibold mb-1">MaFundi will guide you every step of the way.</p>
              <p className="text-xs leading-relaxed">
                Choose any topic that connects to your community, environment, or Zimbabwe&apos;s heritage.
                MaFundi will ask you questions — not write it for you — so your project is truly yours.
                Work through all 6 stages: <strong>Proposal → Research → Planning → Implementation → Evaluation → Submission.</strong>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4">
          {/* Subject picker — only for self-initiated */}
          {isSelfInitiated && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select a subject…</option>
                {ZIMSEC_SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Heritage theme picker — only for self-initiated */}
          {isSelfInitiated && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Heritage Theme <span className="text-xs text-slate-400 font-normal">(optional but recommended)</span>
              </label>
              <select
                value={heritageTheme}
                onChange={e => setHeritageTheme(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Select a heritage theme…</option>
                {HERITAGE_THEMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Leaf size={11} className="text-emerald-500" />
                All ZIMSEC SBPs should connect to Zimbabwe&apos;s heritage and local context
              </p>
            </div>
          )}

          {/* Project title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Your Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              placeholder={
                isSelfInitiated
                  ? 'e.g. The Effect of Irrigation on Maize Yields in Mashonaland'
                  : 'Give your project a specific, descriptive title'
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Choose a clear, specific title — you can refine it later in your workspace
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !projectTitle.trim() || (isSelfInitiated && !subjectName)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Starting…'
              : <>{isSelfInitiated ? 'Start Project with MaFundi' : 'Begin Project'} <ArrowRight size={16} /></>
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default function StartProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    }>
      <StartProjectForm />
    </Suspense>
  )
}
