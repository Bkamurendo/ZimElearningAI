'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Pencil, Trash2, ArrowLeft, Check, X } from 'lucide-react'

type Subject = { id: string; name: string; code: string; zimsec_level: string; description: string | null }

const LEVELS = [
  { value: 'primary', label: 'Primary' },
  { value: 'olevel', label: 'O-Level' },
  { value: 'alevel', label: 'A-Level' },
]

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', zimsec_level: 'olevel', description: '' })
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/subjects')
    const json = await res.json()
    setSubjects(json.subjects ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/admin/subjects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSaving(false); return }
    setSuccess('Subject created'); setShowAdd(false)
    setForm({ name: '', code: '', zimsec_level: 'olevel', description: '' })
    await load(); setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleEdit(id: string) {
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/subjects/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSaving(false); return }
    setEditId(null); await load(); setSaving(false)
    setSuccess('Subject updated'); setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setError(json.error); return }
    await load(); setSuccess('Subject deleted'); setTimeout(() => setSuccess(''), 3000)
  }

  const grouped = LEVELS.map(l => ({ ...l, items: subjects.filter(s => s.zimsec_level === l.value) }))
  const counts = { total: subjects.length, primary: subjects.filter(s => s.zimsec_level === 'primary').length, olevel: subjects.filter(s => s.zimsec_level === 'olevel').length, alevel: subjects.filter(s => s.zimsec_level === 'alevel').length }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Curriculum Manager</h1>
                <p className="text-teal-200 text-sm">Manage ZIMSEC subjects</p>
              </div>
            </div>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-white text-teal-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-teal-50 transition">
              <Plus size={16} /> Add Subject
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.total, color: 'text-gray-900' },
            { label: 'Primary', value: counts.primary, color: 'text-blue-600' },
            { label: 'O-Level', value: counts.olevel, color: 'text-emerald-600' },
            { label: 'A-Level', value: counts.alevel, color: 'text-purple-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm">{success}</div>}

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Add New Subject</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Subject Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Mathematics" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Subject Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required placeholder="e.g. MATH" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">ZIMSEC Level *</label>
                <select value={form.zimsec_level} onChange={e => setForm(f => ({ ...f, zimsec_level: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="bg-teal-600 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50 transition">
                  {saving ? 'Saving…' : 'Save Subject'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 px-5 py-2 rounded-xl text-sm hover:bg-gray-100 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Subject list grouped by level */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading subjects…</div>
        ) : (
          grouped.map(({ value, label, items }) => items.length > 0 && (
            <div key={value} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-800">{label} <span className="text-gray-400 font-normal text-sm">({items.length})</span></h2>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(subj => (
                  <div key={subj.id} className="px-6 py-4">
                    {editId === subj.id ? (
                      <div className="flex gap-3 items-center">
                        <input defaultValue={subj.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <input defaultValue={subj.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <input defaultValue={subj.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="border border-gray-200 rounded-lg px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <button onClick={() => handleEdit(subj.id)} disabled={saving} className="p-1.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">{subj.code}</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{subj.name}</p>
                            {subj.description && <p className="text-xs text-gray-400">{subj.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditId(subj.id); setEditForm({ name: subj.name, code: subj.code, description: subj.description ?? '' }) }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(subj.id, subj.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
