'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { updateCourse, deleteCourse } from '@/app/actions/courses'

interface Props {
  courseId: string
  currentTitle: string
  currentDescription: string | null
}

export default function CourseActions({ courseId, currentTitle, currentDescription }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [title, setTitle] = useState(currentTitle)
  const [description, setDescription] = useState(currentDescription ?? '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('course_id', courseId)
    fd.set('title', title)
    fd.set('description', description)
    startTransition(async () => {
      await updateCourse(fd)
      setShowEdit(false)
      router.refresh()
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.set('course_id', courseId)
    startTransition(async () => {
      await deleteCourse(fd)
    })
  }

  return (
    <>
      <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
        <button
          onClick={() => setShowEdit(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
          title="Edit course"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          title="Delete course"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Edit Course</h2>
              <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save changes'}
                </button>
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg text-center mb-2">Delete Course?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <span className="font-semibold text-gray-800">&ldquo;{currentTitle}&rdquo;</span> and all its lessons. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                {isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Yes, delete'}
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
