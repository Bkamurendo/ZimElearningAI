'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, MessageSquare, Save, Loader2, Edit3 } from 'lucide-react'

type Entry = {
  id: string
  stage: string
  content: string
  teacher_comment: string | null
}

interface Props {
  submissionId: string
  assignmentId: string
  currentMarks: number | null
  currentFeedback: string | null
  maxMarks: number
  entries: Entry[]
}

export default function GradePanel({ submissionId, assignmentId, currentMarks, currentFeedback, maxMarks, entries }: Props) {
  const router = useRouter()
  const [marks, setMarks] = useState<string>(currentMarks?.toString() ?? '')
  const [feedback, setFeedback] = useState(currentFeedback ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [commentEntryId, setCommentEntryId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  async function saveGrade() {
    if (!marks) return
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/teacher/sbp/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          marks_awarded: parseInt(marks),
          teacher_feedback: feedback,
        }),
      })
      setSaved(true)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function saveComment(entryId: string) {
    setSavingComment(true)
    await fetch(`/api/teacher/sbp/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId, teacher_comment: commentText }),
    })
    setSavingComment(false)
    setCommentEntryId(null)
    setCommentText('')
    router.refresh()
  }

  const STAGE_LABELS: Record<string, string> = {
    proposal: 'Proposal', research: 'Research', planning: 'Planning',
    implementation: 'Implementation', evaluation: 'Evaluation',
  }

  return (
    <div className="space-y-4">
      {/* Add comment to specific entries */}
      {entries.filter(e => e.stage !== 'submitted').length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Add Stage Comments</h4>
          <div className="space-y-2">
            {entries.filter(e => e.stage !== 'submitted').map(entry => (
              <div key={entry.id}>
                {commentEntryId === entry.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder={`Comment on the ${STAGE_LABELS[entry.stage] ?? entry.stage} stage...`}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveComment(entry.id)}
                        disabled={savingComment || !commentText.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                      >
                        {savingComment ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save Comment
                      </button>
                      <button onClick={() => { setCommentEntryId(null); setCommentText('') }} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setCommentEntryId(entry.id); setCommentText(entry.teacher_comment ?? '') }}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Edit3 size={11} />
                    {entry.teacher_comment ? 'Edit' : 'Add'} comment on {STAGE_LABELS[entry.stage] ?? entry.stage}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Grade */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
          <Trophy size={13} />
          Mark This Project (out of {maxMarks})
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={maxMarks}
            value={marks}
            onChange={e => setMarks(e.target.value)}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-500">/ {maxMarks} marks</span>
          {marks && <span className="text-sm font-bold text-amber-700">{Math.round((parseInt(marks) / maxMarks) * 100)}%</span>}
        </div>
        <div>
          <label className="block text-xs font-medium text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
            <MessageSquare size={11} />
            Overall Feedback to Student
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            placeholder="Write your overall feedback on the student's project — strengths, areas for improvement, ZIMSEC moderation notes..."
            className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={saveGrade}
          disabled={saving || !marks}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saved ? '✓ Saved!' : 'Save Marks & Feedback'}
        </button>
      </div>
    </div>
  )
}
