'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { updateAssignment, deleteAssignment } from '@/app/actions/assignments'

interface Props {
  id: string
  title: string
  description: string
  dueDate: string | null
  maxScore: number
}

export default function AssignmentActions({ id, title, description, dueDate, maxScore }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDesc, setEditDesc] = useState(description)
  const [editDue, setEditDue] = useState(dueDate ?? '')
  const [editMax, setEditMax] = useState(maxScore)
  const [isPending, startTransition] = useTransition()

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('id', id)
    fd.set('title', editTitle)
    fd.set('description', editDesc)
    fd.set('due_date', editDue)
    fd.set('max_score', String(editMax))
    startTransition(async () => {
      await updateAssignment(fd)
      setShowEdit(false)
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => { await deleteAssignment(fd) })
  }

  // today's date for min on date input
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setShowEdit(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
          title="Edit assignment"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          title="Delete assignment"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Edit Assignment</h2>
              <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions / Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date"
                    value={editDue}
                    onChange={e => setEditDue(e.target.value)}
                    min={today}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={editMax}
                    onChange={e => setEditMax(Number(e.target.value))}
                    min={1}
                    max={1000}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
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

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg text-center mb-2">Delete Assignment?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-semibold text-gray-800">&ldquo;{title}&rdquo;</span> and all student submissions will be permanently deleted.
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
