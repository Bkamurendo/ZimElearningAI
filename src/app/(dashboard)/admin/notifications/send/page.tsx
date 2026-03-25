'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, ArrowLeft, Send, Users } from 'lucide-react'

type Audience = 'all' | 'students' | 'teachers' | 'parents'
type NotifType = 'info' | 'success' | 'warning' | 'alert'

const AUDIENCE_OPTIONS: { value: Audience; label: string; description: string }[] = [
  { value: 'all', label: 'All Users', description: 'Every registered user' },
  { value: 'students', label: 'Students Only', description: 'All student accounts' },
  { value: 'teachers', label: 'Teachers Only', description: 'All teacher accounts' },
  { value: 'parents', label: 'Parents Only', description: 'All parent accounts' },
]

const TYPE_OPTIONS: { value: NotifType; label: string; color: string }[] = [
  { value: 'info', label: 'Info', color: 'bg-blue-500' },
  { value: 'success', label: 'Success', color: 'bg-emerald-500' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-500' },
  { value: 'alert', label: 'Alert', color: 'bg-red-500' },
]

export default function SendNotificationPage() {
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' as Audience, type: 'info' as NotifType })
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')

  async function handleSend() {
    setSending(true); setError('')
    const res = await fetch('/api/admin/notifications/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSending(false); return }
    setResult({ sent: json.sent })
    setStep('done'); setSending(false)
  }

  const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === form.audience)?.label ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-orange-100 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Send Notification</h1>
              <p className="text-orange-100 text-sm">Push a notification to users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {step === 'done' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Sent!</h2>
            <p className="text-gray-500 mb-6">Delivered to <strong>{result?.sent.toLocaleString()}</strong> users ({audienceLabel})</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStep('form'); setForm({ title: '', message: '', audience: 'all', type: 'info' }) }} className="bg-orange-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition">
                Send Another
              </button>
              <Link href="/admin/dashboard" className="px-5 py-2.5 text-gray-500 rounded-xl text-sm hover:bg-gray-100 transition">Back to Dashboard</Link>
            </div>
          </div>
        ) : step === 'confirm' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Confirm Notification</h2>
              <p className="text-gray-500 text-sm">Review before sending</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Audience</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5"><Users size={13} /> {audienceLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${TYPE_OPTIONS.find(t => t.value === form.type)?.color}`} />
                  <span className="font-semibold text-gray-800 capitalize">{form.type}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Title</span>
                <span className="font-semibold text-gray-800">{form.title}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block mb-1">Message</span>
                <p className="text-gray-800 bg-white rounded-lg p-3 border border-gray-100 text-xs leading-relaxed">{form.message}</p>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-orange-600 disabled:opacity-50 transition">
                <Send size={14} /> {sending ? 'Sending…' : 'Confirm & Send'}
              </button>
              <button onClick={() => setStep('form')} className="px-6 py-2.5 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition">Edit</button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setStep('confirm') }} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="e.g. New O-Level Past Papers Available" maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
                  rows={4} placeholder="Write your notification message here…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              {/* Audience */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Audience *</label>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${form.audience === opt.value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="audience" value={opt.value} checked={form.audience === opt.value} onChange={() => setForm(f => ({ ...f, audience: opt.value }))} className="mt-0.5 accent-orange-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Notification Type</label>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition ${form.type === opt.value ? `${opt.color} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${form.type === opt.value ? 'bg-white' : opt.color}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="flex items-center gap-2 bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition">
              <Send size={14} /> Preview & Send
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
