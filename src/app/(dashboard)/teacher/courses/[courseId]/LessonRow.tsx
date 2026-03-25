'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Loader2, ChevronDown, GripVertical } from 'lucide-react'
import { updateLesson, deleteLesson } from '@/app/actions/courses'

type Lesson = {
  id: string
  title: string
  content_type: string
  content: string
  order_index: number
}

const typeLabels: Record<string, string> = {
  text: 'Text lesson',
  video: 'Video (YouTube)',
  pdf: 'PDF',
}

const typeBadge: Record<string, string> = {
  text: 'bg-blue-50 text-blue-600',
  video: 'bg-red-50 text-red-600',
  pdf: 'bg-amber-50 text-amber-600',
}

export default function LessonRow({ lesson, courseId, idx }: { lesson: Lesson; courseId: string; idx: number }) {
  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [contentType, setContentType] = useState(lesson.content_type)
  const [content, setContent] = useState(lesson.content)
  const [isPending, startTransition] = useTransition()

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('lesson_id', lesson.id)
    fd.set('course_id', courseId)
    fd.set('title', title)
    fd.set('content_type', contentType)
    fd.set('content', content)
    startTransition(async () => {
      await updateLesson(fd)
      setEditing(false)
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.set('lesson_id', lesson.id)
    fd.set('course_id', courseId)
    startTransition(async () => {
      await deleteLesson(fd)
    })
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <GripVertical size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />
          <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs text-blue-600 font-bold flex-shrink-0">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{lesson.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${typeBadge[lesson.content_type] ?? 'bg-gray-100 text-gray-500'}`}>
              {typeLabels[lesson.content_type] ?? lesson.content_type}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditing(e => !e)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Edit lesson"
            >
              {editing ? <ChevronDown size={14} /> : <Pencil size={14} />}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete lesson"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Inline edit form */}
        {editing && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="text">Text (Markdown)</option>
                  <option value="video">Video (YouTube URL)</option>
                  <option value="pdf">PDF (URL)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Content / URL</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {isPending ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-white transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">Delete Lesson?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-semibold text-gray-800">&ldquo;{lesson.title}&rdquo;</span> will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-1.5"
              >
                {isPending ? <><Loader2 size={13} className="animate-spin" /> Deleting…</> : 'Delete'}
              </button>
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
