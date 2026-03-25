'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HelpCircle, Plus, Pencil, Trash2, ArrowLeft, Filter } from 'lucide-react'

type Question = {
  id: string; topic: string; difficulty: string; question_text: string
  created_at: string; subjects: { name: string; code: string } | null
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  hard: 'bg-red-50 text-red-600',
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState({ subject_id: '', difficulty: '', topic: '' })
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ offset: String(offset) })
    if (filters.subject_id) params.set('subject_id', filters.subject_id)
    if (filters.difficulty) params.set('difficulty', filters.difficulty)
    if (filters.topic) params.set('topic', filters.topic)
    const res = await fetch(`/api/admin/questions?${params}`)
    const json = await res.json()
    setQuestions(json.questions ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [filters, offset])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setError(json.error); return }
    setSuccess('Question deleted'); load()
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <HelpCircle size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Question Bank</h1>
                <p className="text-purple-200 text-sm">{total.toLocaleString()} question{total !== 1 ? 's' : ''} total</p>
              </div>
            </div>
            <Link href="/admin/questions/new" className="flex items-center gap-2 bg-white text-purple-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-purple-50 transition">
              <Plus size={16} /> New Question
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter size={14} className="text-gray-400" />
            <select value={filters.subject_id} onChange={e => { setFilters(f => ({ ...f, subject_id: e.target.value })); setOffset(0) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filters.difficulty} onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setOffset(0) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input value={filters.topic} onChange={e => { setFilters(f => ({ ...f, topic: e.target.value })); setOffset(0) }}
              placeholder="Search by topic…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-[160px]" />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm">{success}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading…</div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <HelpCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p>No questions found</p>
              <Link href="/admin/questions/new" className="mt-3 inline-flex items-center gap-1.5 text-purple-600 text-sm font-medium hover:underline">
                <Plus size={14} /> Create your first question
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Topic</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Difficulty</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Question</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700">{q.subjects?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{q.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFFICULTY_COLORS[q.difficulty] ?? ''}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{q.question_text.slice(0, 60)}{q.question_text.length > 60 ? '…' : ''}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/questions/${q.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Pencil size={14} />
                        </Link>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing {offset + 1}–{Math.min(offset + 50, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - 50))} disabled={offset === 0} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
              <button onClick={() => setOffset(offset + 50)} disabled={offset + 50 >= total} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
