'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  FlaskConical, Leaf, ChevronRight, CheckCircle2, Circle,
  Bot, Send, Loader2, Trophy, Calendar, Edit3, Save, AlertCircle,
  BookOpen, Lightbulb, ArrowRight, Sparkles, Crown, LayoutList, FileText,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const STAGES = [
  { key: 'proposal',       label: 'Stage 1',       title: 'Proposal',       desc: 'Identify your problem and write your project proposal' },
  { key: 'research',       label: 'Stage 2',       title: 'Research',       desc: 'Gather information from books, community, field observations' },
  { key: 'planning',       label: 'Stage 3',       title: 'Planning',       desc: 'Design your methodology, materials list and timeline' },
  { key: 'implementation', label: 'Stage 4',       title: 'Implementation', desc: 'Carry out your project and record observations and data' },
  { key: 'evaluation',     label: 'Stage 5',       title: 'Evaluation',     desc: 'Analyse results, reflect, draw conclusions' },
  { key: 'submitted',      label: 'Stage 6',       title: 'Submitted',      desc: 'Project submitted for teacher marking' },
]

const STAGE_PROMPTS: Record<string, string> = {
  proposal: `Write your project proposal here. Include:\n- What problem or topic did you choose?\n- Why is it important to your community?\n- How does it connect to Zimbabwe's heritage or local resources?\n- What are your aims and objectives?\n- Initial hypothesis (if applicable)`,
  research: `Document your research here. Include:\n- Key facts and information you found\n- Sources you consulted (books, internet, interviews, observations)\n- What local community members or experts said\n- Any relevant scientific/theoretical background\n- What you observed in the field`,
  planning: `Write your project plan here. Include:\n- Step-by-step methodology (numbered list)\n- Materials needed (prioritise local/affordable resources)\n- Timeline with dates and milestones\n- Variables (independent, dependent, controlled — for science projects)\n- How you will collect and record data`,
  implementation: `Record your implementation progress here. Include:\n- What you did (step by step, in order)\n- Specific measurements, quantities, dates, times\n- Observations and what you noticed\n- Any unexpected results or problems and how you handled them\n- Evidence collected (describe photos, samples, data tables)`,
  evaluation: `Write your evaluation and conclusion here. Include:\n- Analysis of your results — what patterns do you see?\n- Do results support your hypothesis? Why or why not?\n- Connection between your findings and your research\n- Limitations of your project\n- What you would do differently next time\n- The real-world value of your project to your community\n- Your final conclusion`,
}

type Entry = {
  id: string
  stage: string
  content: string
  ai_feedback: string | null
  teacher_comment: string | null
  created_at: string
}

type Assignment = {
  id: string
  title: string
  description: string | null
  guidelines: string | null
  heritage_theme: string | null
  max_marks: number
  due_date: string | null
  subject: { name: string; code: string } | null
}

type Submission = {
  id: string
  project_title: string | null
  current_stage: string
  marks_awarded: number | null
  teacher_feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  self_initiated: boolean
  subject_name: string | null
  heritage_theme: string | null
  assignment: Assignment | null
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStageKey, setActiveStageKey] = useState('proposal')
  const [entryText, setEntryText] = useState('')
  const [saving, setSaving] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [aiFeedback, setAiFeedback] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [lastEntryId, setLastEntryId] = useState<string | null>(null)
  const [orientation, setOrientation] = useState('')
  const [orientationLoading, setOrientationLoading] = useState(false)
  const [mafundiMode, setMafundiMode] = useState<'feedback' | 'structure' | 'example'>('feedback')

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/student/sbp/${id}`)
    const data = await res.json()
    if (data.submission) {
      setSubmission(data.submission)
      setEntries(data.entries ?? [])
      setActiveStageKey(data.submission.current_stage === 'submitted' ? 'evaluation' : data.submission.current_stage)
      setTitleInput(data.submission.project_title ?? '')
      // Auto-load orientation if no entries yet
      if (!data.entries?.length && data.submission.project_title) {
        setOrientationLoading(true)
        fetch('/api/ai-teacher/sbp-orientation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: data.submission.id }),
        })
          .then(r => r.json())
          .then(d => { if (d.orientation) setOrientation(d.orientation) })
          .catch(() => {})
          .finally(() => setOrientationLoading(false))
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  const stageEntries = entries.filter(e => e.stage === activeStageKey)
  const currentStageIndex = STAGES.findIndex(s => s.key === submission?.current_stage)
  const activeStageIndex = STAGES.findIndex(s => s.key === activeStageKey)
  const isCurrentStage = activeStageKey === submission?.current_stage
  const isSubmitted = submission?.current_stage === 'submitted'

  async function saveEntry(advance = false) {
    if (!entryText.trim()) { setSaveError('Please write something before saving'); return }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/student/sbp/${id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: activeStageKey, content: entryText, advance_stage: advance }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error ?? 'Failed to save'); return }

      const newEntry: Entry = { ...data.entry, ai_feedback: null, teacher_comment: null }
      setEntries(prev => [...prev, newEntry])
      setLastEntryId(data.entry.id)
      if (advance && data.current_stage !== activeStageKey) {
        setSubmission(prev => prev ? { ...prev, current_stage: data.current_stage } : prev)
        setActiveStageKey(data.current_stage === 'submitted' ? 'evaluation' : data.current_stage)
      }
      setEntryText('')
    } catch {
      setSaveError('Network error — try again')
    } finally {
      setSaving(false)
      setAdvancing(false)
    }
  }

  async function getMafundiFeedback(overrideMode?: 'feedback' | 'structure' | 'example') {
    const activeMode = overrideMode ?? mafundiMode
    if (activeMode === 'feedback' && !entryText.trim() && stageEntries.length === 0) return
    setAiLoading(true)
    setAiFeedback('')
    setAiError('')
    const contentToReview = entryText.trim() || stageEntries[stageEntries.length - 1]?.content || ''
    try {
      const res = await fetch('/api/ai-teacher/sbp-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: id,
          stage: activeStageKey,
          entry_content: activeMode === 'feedback' ? contentToReview : '',
          entry_id: activeMode === 'feedback' ? lastEntryId : null,
          mode: activeMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error ?? 'MaFundi could not respond'); return }
      setAiFeedback(data.feedback)
    } catch {
      setAiError('Network error — try again')
    } finally {
      setAiLoading(false)
    }
  }

  async function updateTitle() {
    if (!titleInput.trim()) return
    await fetch('/api/student/sbp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, project_title: titleInput.trim() }),
    })
    setSubmission(prev => prev ? { ...prev, project_title: titleInput.trim() } : prev)
    setEditingTitle(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 size={32} className="animate-spin text-emerald-500" />
    </div>
  )

  if (!submission) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-slate-500">Project not found</p>
    </div>
  )

  const asgn = submission.assignment
  const subjectLabel = asgn?.subject?.name ?? submission.subject_name ?? 'My Project'
  const heritageLabel = asgn?.heritage_theme ?? submission.heritage_theme

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <FlaskConical size={12} />
                <span>School-Based Project</span>
                <ChevronRight size={12} />
                {submission.self_initiated && (
                  <span className="flex items-center gap-1 text-violet-600 font-semibold">
                    <Sparkles size={11} /> Self-Initiated
                  </span>
                )}
                <span className="font-medium text-slate-700 dark:text-slate-300">{subjectLabel}</span>
              </div>

              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') updateTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                    className="text-xl font-bold bg-transparent border-b-2 border-emerald-500 outline-none text-slate-900 dark:text-white flex-1 min-w-0"
                  />
                  <button onClick={updateTitle} className="text-emerald-600"><Save size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                    {submission.project_title || asgn?.title || 'Untitled Project'}
                  </h1>
                  {!isSubmitted && (
                    <button onClick={() => setEditingTitle(true)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {heritageLabel && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1"><Leaf size={11} />{heritageLabel}</span>
                )}
                {asgn?.due_date && (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11} />Due {new Date(asgn.due_date).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>

            {submission.marks_awarded !== null && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2">
                <Trophy size={18} className="text-amber-500" />
                <span className="font-bold text-amber-700 dark:text-amber-400">{submission.marks_awarded}/{asgn?.max_marks ?? 100}</span>
                <span className="text-xs text-amber-600">marks</span>
              </div>
            )}
          </div>

          {/* Stage progress bar */}
          <div className="mt-4 flex gap-1">
            {STAGES.map((s, i) => {
              const done = i < currentStageIndex || isSubmitted
              const active = s.key === submission.current_stage && !isSubmitted
              return (
                <div key={s.key} className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all ${done || isSubmitted ? 'bg-emerald-500' : active ? 'bg-emerald-300 animate-pulse' : 'bg-transparent'}`} style={{ width: done || active || isSubmitted ? '100%' : '0%' }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 flex gap-6 flex-col lg:flex-row">
        {/* Stage Navigator */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            {STAGES.map((s, i) => {
              const done = i < currentStageIndex || isSubmitted
              const current = s.key === submission.current_stage && !isSubmitted
              const locked = i > currentStageIndex && !isSubmitted
              const isActive = s.key === activeStageKey

              return (
                <button
                  key={s.key}
                  onClick={() => !locked && setActiveStageKey(s.key)}
                  disabled={locked}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : locked
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : current ? (
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle size={16} className="flex-shrink-0 opacity-40" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{s.label}</p>
                    <p className="text-xs font-medium leading-tight truncate">{s.title}</p>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Guidelines toggle — only for teacher-assigned projects */}
          {asgn?.guidelines && (
            <>
              <button
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="mt-3 w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 transition-colors"
              >
                <BookOpen size={12} />
                {showGuidelines ? 'Hide' : 'View'} Teacher Guidelines
              </button>
              {showGuidelines && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 whitespace-pre-line">
                  {asgn.guidelines}
                </div>
              )}
            </>
          )}

          {/* Self-initiated tip */}
          {submission.self_initiated && (
            <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300 flex gap-2">
              <Sparkles size={13} className="flex-shrink-0 mt-0.5" />
              <span>This is your own project. Use MaFundi&apos;s feedback at every stage to strengthen it before submitting to your teacher.</span>
            </div>
          )}
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Stage header */}
          {(() => {
            const stageInfo = STAGES.find(s => s.key === activeStageKey)!
            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {stageInfo.label}: {stageInfo.title}
                </h2>
                <p className="text-sm text-slate-500">{stageInfo.desc}</p>
              </div>
            )
          })()}

          {/* Previous entries for this stage */}
          {stageEntries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Your Entries</h3>
              {stageEntries.map(entry => (
                <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <p className="text-xs text-slate-400 mb-2">{new Date(entry.created_at).toLocaleString('en-ZW')}</p>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{entry.content}</div>

                  {/* Teacher comment */}
                  {entry.teacher_comment && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Teacher Comment</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{entry.teacher_comment}</p>
                    </div>
                  )}

                  {/* AI feedback */}
                  {entry.ai_feedback && (
                    <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={13} className="text-violet-500" />
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">MaFundi Feedback</span>
                      </div>
                      <div className="text-xs text-violet-700 dark:text-violet-300 prose prose-xs max-w-none">
                        <ReactMarkdown>{entry.ai_feedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Teacher overall feedback */}
          {submission.teacher_feedback && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <BookOpen size={14} />
                Teacher Feedback
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">{submission.teacher_feedback}</p>
            </div>
          )}

          {/* Write new entry — only if not submitted and on current/earlier stage */}
          {!isSubmitted && activeStageIndex <= currentStageIndex && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Edit3 size={14} />
                {isCurrentStage ? 'Add to Your Entry' : 'Add Additional Notes'}
              </h3>
              <textarea
                value={entryText}
                onChange={e => setEntryText(e.target.value)}
                placeholder={STAGE_PROMPTS[activeStageKey] ?? 'Write your notes for this stage...'}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-y font-mono"
              />
              {saveError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{saveError}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => saveEntry(false)}
                  disabled={saving || !entryText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {saving && !advancing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Entry
                </button>

                {isCurrentStage && activeStageKey !== 'evaluation' && (
                  <button
                    onClick={() => { setAdvancing(true); saveEntry(true) }}
                    disabled={saving || !entryText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                  >
                    {saving && advancing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Save &amp; Advance to Next Stage
                  </button>
                )}

                {isCurrentStage && activeStageKey === 'evaluation' && (
                  <button
                    onClick={() => { setAdvancing(true); saveEntry(true) }}
                    disabled={saving || !entryText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                  >
                    {saving && advancing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Project to Teacher
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submitted state */}
          {isSubmitted && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">Project Submitted!</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Your project has been submitted to your teacher for marking. Well done!</p>
              {submission.submitted_at && (
                <p className="text-xs text-emerald-600 mt-2">Submitted: {new Date(submission.submitted_at).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          )}
        </main>

        {/* MaFundi Panel */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-4">
            {/* Panel header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">MaFundi</p>
                <p className="text-[11px] text-slate-500">SBP Guidance</p>
              </div>
            </div>

            {/* Orientation (first-open) */}
            {orientationLoading && (
              <div className="p-4 flex items-center gap-2 text-violet-600 text-xs border-b border-slate-100 dark:border-slate-800">
                <Loader2 size={14} className="animate-spin" />
                <span>MaFundi is preparing your personalized project guide…</span>
              </div>
            )}
            {orientation && !aiFeedback && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-700 dark:text-slate-300 prose prose-xs max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-headings:font-bold prose-h2:text-xs prose-h3:text-xs">
                  <ReactMarkdown>{orientation}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Mode tabs */}
              {!isSubmitted && (
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {([
                    { key: 'feedback', icon: <Bot size={11} />, label: 'Feedback' },
                    { key: 'structure', icon: <LayoutList size={11} />, label: 'Structure' },
                    { key: 'example', icon: <FileText size={11} />, label: 'Example' },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setMafundiMode(tab.key); setAiFeedback('') }}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        mafundiMode === tab.key
                          ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Mode descriptions */}
              {!aiFeedback && !aiLoading && (
                <div className="text-xs text-slate-500 space-y-1.5">
                  {mafundiMode === 'feedback' && (
                    <>
                      <p className="flex items-start gap-1.5"><Lightbulb size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />Socratic method — I guide with questions, not answers.</p>
                      <p>Write your entry, then tap <strong>Get Feedback</strong> for personalised guidance on what you wrote.</p>
                    </>
                  )}
                  {mafundiMode === 'structure' && (
                    <p className="flex items-start gap-1.5"><LayoutList size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />Get a <strong>topic-specific project outline</strong> — what to include at each stage for your exact project title.</p>
                  )}
                  {mafundiMode === 'example' && (
                    <p className="flex items-start gap-1.5"><FileText size={12} className="text-green-500 mt-0.5 flex-shrink-0" />See <strong>what good work looks like</strong> for this stage of your specific project — to guide, not copy.</p>
                  )}
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center gap-2 text-violet-600 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">
                    {mafundiMode === 'feedback' && 'Reviewing your work…'}
                    {mafundiMode === 'structure' && 'Building your project outline…'}
                    {mafundiMode === 'example' && 'Generating an example…'}
                  </span>
                </div>
              )}

              {aiError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{aiError}</p>
              )}

              {aiFeedback && (
                <div className="text-xs text-slate-700 dark:text-slate-300 prose prose-xs max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-200">
                  <ReactMarkdown>{aiFeedback}</ReactMarkdown>
                </div>
              )}

              <button
                onClick={() => getMafundiFeedback(mafundiMode)}
                disabled={aiLoading || (mafundiMode === 'feedback' && stageEntries.length === 0 && !entryText.trim())}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                {mafundiMode === 'feedback' && 'Get MaFundi\'s Feedback'}
                {mafundiMode === 'structure' && 'Get Project Structure'}
                {mafundiMode === 'example' && `See ${activeStageKey.charAt(0).toUpperCase() + activeStageKey.slice(1)} Example`}
              </button>

              <p className="text-[10px] text-slate-400 text-center">MaFundi guides — never writes your project for you</p>

              {/* Quick links */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                <Link
                  href="/student/projects/examples"
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <BookOpen size={12} />
                  Browse example projects
                </Link>
                <Link
                  href="/student/projects/templates"
                  className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                >
                  <Crown size={12} />
                  <span>Pro: Generate full template</span>
                  <Sparkles size={10} />
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
