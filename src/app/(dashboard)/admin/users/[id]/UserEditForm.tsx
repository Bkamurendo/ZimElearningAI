'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  GraduationCap, BookOpen, Heart, Shield,
  Save, Key, Check, Copy, AlertCircle, Loader2,
} from 'lucide-react'

const ROLES = [
  { value: 'student', label: 'Student', icon: GraduationCap, active: 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-300 ring-offset-1',  idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'teacher', label: 'Teacher', icon: BookOpen,       active: 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-300 ring-offset-1',      idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'parent',  label: 'Parent',  icon: Heart,          active: 'bg-purple-50 border-purple-400 text-purple-700 ring-2 ring-purple-300 ring-offset-1', idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'admin',   label: 'Admin',   icon: Shield,         active: 'bg-gray-100 border-gray-400 text-gray-800 ring-2 ring-gray-300 ring-offset-1',       idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
]

const PLANS = [
  { value: 'free', label: 'Free',      active: 'bg-gray-50 border-gray-400 text-gray-700 ring-2 ring-gray-300 ring-offset-1',  idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'starter', label: 'Starter', active: 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-300 ring-offset-1',  idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'pro',     label: 'Pro',     active: 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-300 ring-offset-1', idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
  { value: 'elite',   label: 'Elite',   active: 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300 ring-offset-1', idle: 'bg-white border-gray-200 text-gray-500 hover:border-gray-300' },
]

interface Props {
  userId: string
  initialName: string
  initialRole: string
  initialPlan: string
  initialOnboarded: boolean
  isCurrentUser: boolean
}

export default function UserEditForm({
  userId,
  initialName,
  initialRole,
  initialPlan,
  initialOnboarded,
  isCurrentUser,
}: Props) {
  const router = useRouter()

  // Edit state
  const [name, setName]           = useState(initialName)
  const [role, setRole]           = useState(initialRole)
  const [plan, setPlan]           = useState(initialPlan)
  const [onboarded, setOnboarded] = useState(initialOnboarded)
  const [saving, setSaving]       = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Password reset state
  const [resetting, setResetting]   = useState(false)
  const [resetLink, setResetLink]   = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  const dirty =
    name !== initialName ||
    role !== initialRole ||
    plan !== initialPlan ||
    onboarded !== initialOnboarded

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, role, plan, onboarding_completed: onboarded }),
      })
      if (res.ok) {
        setSaveStatus('saved')
        router.refresh()
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    setResetting(true)
    setResetLink(null)
    setResetError(null)
    try {
      const res  = await fetch(`/api/admin/users/${userId}`, { method: 'POST' })
      const json = await res.json() as { link?: string; error?: string }
      if (res.ok && json.link) {
        setResetLink(json.link)
      } else {
        setResetError(json.error ?? 'Failed to generate reset link')
      }
    } catch {
      setResetError('Network error — please try again')
    } finally {
      setResetting(false)
    }
  }

  async function handleCopy() {
    if (!resetLink) return
    await navigator.clipboard.writeText(resetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-5">

      {/* ── Edit form ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Edit Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">Changes take effect immediately</p>
        </div>

        <div className="p-5 space-y-5">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User's full name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Role
            </label>
            {isCurrentUser && (
              <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                <AlertCircle size={12} />
                Changing your own role will redirect you away from the admin area
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map(({ value, label, icon: Icon, active, idle }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${role === value ? active : idle}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Subscription Plan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANS.map(({ value, label, active, idle }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlan(value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${plan === value ? active : idle}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Onboarding toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Onboarding complete</p>
              <p className="text-xs text-gray-400 mt-0.5">When off, the user is redirected to /onboarding on next login</p>
            </div>
            <button
              type="button"
              onClick={() => setOnboarded(!onboarded)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${onboarded ? 'bg-green-500' : 'bg-gray-300'}`}
              aria-label="Toggle onboarding complete"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${onboarded ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                dirty && !saving
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>

            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Check size={14} /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-500 font-medium flex items-center gap-1">
                <AlertCircle size={14} /> Save failed — try again
              </span>
            )}
          </div>

        </div>
      </div>

      {/* ── Password reset ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Password Reset</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Generate a one-time sign-in link — share it with the user so they can reset their password
          </p>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={handlePasswordReset}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-sm font-semibold transition-all"
          >
            {resetting
              ? <Loader2 size={14} className="animate-spin text-amber-600" />
              : <Key size={14} />}
            {resetting ? 'Generating…' : 'Generate Reset Link'}
          </button>

          {resetError && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} /> {resetError}
            </p>
          )}

          {resetLink && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
                <Check size={13} /> Link generated — share this with the user:
              </p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs text-green-700 font-mono break-all bg-white border border-green-200 rounded-lg p-2.5 select-all leading-relaxed">
                  {resetLink}
                </code>
                <button
                  onClick={handleCopy}
                  title="Copy link"
                  className="flex-shrink-0 p-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition mt-0.5"
                >
                  {copied
                    ? <Check size={14} className="text-green-600" />
                    : <Copy size={14} className="text-gray-500" />}
                </button>
              </div>
              <p className="text-xs text-green-600">This link expires after a single use.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
