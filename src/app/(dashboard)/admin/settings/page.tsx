'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, ArrowLeft, Save, AlertTriangle } from 'lucide-react'


const SETTING_DEFS = [
  {
    group: 'Access Control',
    settings: [
      { key: 'allow_student_registration', label: 'Allow Student Registration', type: 'toggle', description: 'Allow new students to register accounts' },
      { key: 'allow_teacher_registration', label: 'Allow Teacher Registration', type: 'toggle', description: 'Allow new teachers to register accounts' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle', description: 'Show maintenance page to all non-admin users', danger: true },
    ],
  },
  {
    group: 'Free Tier Limits',
    settings: [
      { key: 'free_tier_quiz_limit', label: 'Quiz Attempts Per Day (Free)', type: 'number', description: 'Max daily quiz attempts for free tier students' },
      { key: 'free_tier_ai_messages', label: 'AI Messages Per Day (Free)', type: 'number', description: 'Max daily AI tutor messages for free tier users' },
    ],
  },
  {
    group: 'Content Settings',
    settings: [
      { key: 'max_upload_size_mb', label: 'Max Upload Size (MB)', type: 'number', description: 'Maximum file size for document uploads' },
    ],
  },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setSettings(d.settings ?? {})
      setLoading(false)
    })
  }, [])

  async function saveSetting(key: string, value: unknown) {
    setSaving(key); setError('')
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSaving(null); return }
    setSettings(s => ({ ...s, [key]: value }))
    setSaving(null); setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading settings…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
              <p className="text-gray-400 text-sm">Configure platform behaviour and limits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

        {/* Maintenance warning */}
        {settings['maintenance_mode'] === true && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <strong>Maintenance mode is ON</strong> — non-admin users cannot access the platform
          </div>
        )}

        {SETTING_DEFS.map(group => (
          <div key={group.group} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-800">{group.group}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.settings.map(setting => {
                const currentValue = settings[setting.key]
                const isSaving = saving === setting.key
                const isSaved = saved === setting.key

                return (
                  <div key={setting.key} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{setting.label}</p>
                        {('danger' in setting) && setting.danger && (
                          <span className="bg-red-50 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded">Danger</span>
                        )}
                        {isSaved && <span className="text-emerald-500 text-xs font-semibold">✓ Saved</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {setting.type === 'toggle' ? (
                        <button
                          onClick={() => saveSetting(setting.key, !(currentValue === true || currentValue === 'true'))}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${(currentValue === true || currentValue === 'true') ? 'bg-emerald-500' : 'bg-gray-200'} disabled:opacity-50`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${(currentValue === true || currentValue === 'true') ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={Number(currentValue)}
                            onBlur={e => saveSetting(setting.key, Number(e.target.value))}
                            className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
                          />
                          {isSaving && <Save size={14} className="text-gray-400 animate-pulse" />}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-400 text-center">Settings take effect immediately. Changes are logged in the audit trail.</p>
      </div>
    </div>
  )
}
