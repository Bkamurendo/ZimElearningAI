'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Loader2, CheckCircle } from 'lucide-react'

const PRIORITIES = [
  { value: 'normal',    label: 'Normal',    desc: 'Regular update or info',         color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'important', label: 'Important', desc: 'Something users should know',    color: 'border-amber-200 bg-amber-50 text-amber-700' },
  { value: 'urgent',    label: 'Urgent',    desc: 'Action required immediately',    color: 'border-red-200 bg-red-50 text-red-700' },
]

const AUDIENCES = [
  { value: 'all',      label: 'Everyone',  desc: 'Students, teachers & parents' },
  { value: 'students', label: 'Students',  desc: 'Student users only' },
  { value: 'teachers', label: 'Teachers',  desc: 'Teacher users only' },
  { value: 'parents',  label: 'Parents',   desc: 'Parent users only' },
]

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    audience: 'all',
    expires_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          priority: form.priority,
          audience: form.audience,
          expires_at: form.expires_at || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create announcement')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/admin/announcements'), 1500)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-sm mx-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-1">Announcement Published!</h2>
          <p className="text-sm text-gray-500">Redirecting to announcements…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/announcements" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4">
            <ArrowLeft size={14} />
            Back to Announcements
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Megaphone size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">New Announcement</h1>
              <p className="text-sm text-gray-500">Broadcast a message to platform users</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. System maintenance on Saturday"
              maxLength={120}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.title.length}/120</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={5}
              placeholder="Write your announcement here…"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center ${
                    form.priority === p.value ? p.color + ' ring-2 ring-offset-1' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] font-normal opacity-70 mt-0.5 hidden sm:block">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Audience</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, audience: a.value }))}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    form.audience === a.value
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold">{a.label}</div>
                  <div className={`text-[10px] font-normal mt-0.5 ${form.audience === a.value ? 'text-gray-300' : 'text-gray-400'}`}>{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Expiry Date <span className="text-gray-400 font-normal normal-case">(optional — leave blank for no expiry)</span>
            </label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.body.trim()}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Publishing…</>
            ) : (
              <><Megaphone size={16} /> Publish Announcement</>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
