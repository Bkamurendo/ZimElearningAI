'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Plus, CheckCircle2, XCircle, Loader2,
  Users, Calendar, MapPin, Phone, X,
} from 'lucide-react'

const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
]

type School = {
  id: string
  name: string
  slug: string | null
  province: string | null
  phone: string | null
  email: string | null
  subscription_plan: 'basic' | 'pro'
  subscription_expires_at: string | null
  max_students: number
  is_active: boolean
  created_at: string
  admin: { id: string; full_name: string | null; email: string } | null
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)

  const [form, setForm] = useState({
    name: '', province: '', phone: '', email: '',
    subscription_plan: 'basic', max_students: '50',
    admin_name: '', admin_email: '', admin_password: '',
  })

  useEffect(() => { loadSchools() }, [])

  async function loadSchools() {
    setLoading(true)
    const res = await fetch('/api/admin/schools')
    const data = await res.json()
    setSchools(data.schools ?? [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setResult(null)
    const res = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, max_students: parseInt(form.max_students) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok || data.error) {
      setResult({ error: data.error })
    } else {
      setResult({ success: `School "${data.school.name}" created${data.adminUser ? ` with admin ${data.adminUser.email}` : ''}.` })
      setShowForm(false)
      setForm({ name: '', province: '', phone: '', email: '', subscription_plan: 'basic', max_students: '50', admin_name: '', admin_email: '', admin_password: '' })
      loadSchools()
    }
  }

  const planBadge = (plan: string) => plan === 'pro'
    ? <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Pro</span>
    : <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Basic</span>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-indigo-500" /> Schools
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage school licenses and school admin accounts</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
          <Plus size={16} /> Add School
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {result.success ?? result.error}
          <button onClick={() => setResult(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Create School Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">Create New School</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">School Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. St. George's College" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Province</label>
                  <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Select...</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Plan</label>
                  <select value={form.subscription_plan} onChange={e => setForm(f => ({ ...f, subscription_plan: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="basic">Basic ($50/mo)</option>
                    <option value="pro">Pro ($120/mo)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Students</label>
                  <input type="number" min="1" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">School Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+263 ..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">School Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@school.ac.zw" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">School Admin Account (optional)</p>
                <div className="space-y-3">
                  <input value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))}
                    placeholder="Admin full name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                    placeholder="Admin email" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input type="password" value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                    placeholder="Temporary password" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schools table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No schools yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first school to get started with school licensing</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            Add First School
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Students</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Expires</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{school.name}</p>
                        {school.email && <p className="text-xs text-gray-400">{school.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin size={12} />{school.province ?? '—'}
                    </div>
                    {school.phone && <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5"><Phone size={10} />{school.phone}</div>}
                  </td>
                  <td className="px-4 py-3">{planBadge(school.subscription_plan)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <Users size={12} /> max {school.max_students}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {school.admin ? (
                      <div>
                        <p className="text-xs font-medium text-gray-700">{school.admin.full_name}</p>
                        <p className="text-xs text-gray-400">{school.admin.email}</p>
                      </div>
                    ) : <span className="text-xs text-gray-400">No admin set</span>}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {school.subscription_expires_at ? (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={11} />
                        {new Date(school.subscription_expires_at).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {school.is_active
                      ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                      : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {schools.length} school{schools.length !== 1 ? 's' : ''} registered
          </div>
        </div>
      )}
    </div>
  )
}
