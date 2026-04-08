'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import {
  Mail, GraduationCap, Zap, ShieldCheck, LogOut,
  ChevronRight, Loader2, Check, Edit2, Star, Clock, ArrowLeft,
  Accessibility,
} from 'lucide-react'
import { AccessibilityControls } from '@/components/AccessibilityControls'

interface ProfileData {
  full_name: string
  email: string
  plan: string
  pro_expires_at: string | null
  zimsec_level: string | null
  grade: string | null
  phone_number: string | null
}

export default function ProfileSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [profile, setProfile]       = useState<ProfileData | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newPhone, setNewPhone]     = useState('')
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, plan, pro_expires_at, phone_number')
        .eq('id', user.id)
        .single()

      const { data: sp } = await supabase
        .from('student_profiles')
        .select('zimsec_level, grade')
        .eq('user_id', user.id)
        .single()

      setProfile({
        full_name:     p?.full_name     ?? 'Student',
        email:         user.email       ?? '',
        plan:          p?.plan          ?? 'free',
        pro_expires_at: p?.pro_expires_at ?? null,
        zimsec_level:  sp?.zimsec_level ?? null,
        grade:         sp?.grade        ?? null,
        phone_number:  p?.phone_number  ?? null,
      })
      setNewName(p?.full_name ?? '')
      setNewPhone(p?.phone_number ?? '')
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const updates = {
        full_name: newName.trim(),
        phone_number: newPhone.trim() || null,
      }
      await supabase.from('profiles').update(updates).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, ...updates } : prev)
    }
    setSaving(false)
    setEditingName(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  const isPro = profile?.plan === 'pro'
  const initials = (profile?.full_name ?? 'S')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  const levelLabel =
    profile?.zimsec_level === 'primary' ? 'Primary' :
    profile?.zimsec_level === 'olevel'  ? 'O Level' :
    profile?.zimsec_level === 'alevel'  ? 'A Level' : null

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">

        {/* Back link */}
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-5"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* ── Avatar + name card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ring-4 ring-emerald-500/20 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>

          {/* Editable settings (Name & Phone) */}
          {editingName ? (
            <div className="space-y-3 max-w-xs mx-auto mt-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                <input
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Used for 2FA and Ready Pulse alerts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingName(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition text-sm font-bold flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-1">
              <h1 className="text-lg font-bold text-slate-900">{profile?.full_name}</h1>
              <button
                onClick={() => {
                  setNewName(profile?.full_name ?? '')
                  setNewPhone(profile?.phone_number ?? '')
                  setEditingName(true)
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                title="Edit profile"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {saved && (
            <p className="text-xs text-emerald-600 font-medium mt-1">✓ Name updated!</p>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 text-sm">
            <Mail size={13} className="shrink-0" />
            <span className="break-all">{profile?.email}</span>
          </div>

          {levelLabel && profile?.grade && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-500 text-sm">
              <GraduationCap size={13} className="shrink-0" />
              <span>{levelLabel} — {profile.grade}</span>
            </div>
          )}
        </div>

        {/* ── Plan status ─────────────────────────────────────────── */}
        <div className={`rounded-2xl shadow-sm border p-5 mb-4 ${
          isPro
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-transparent'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPro ? 'bg-white/20' : 'bg-amber-50 border border-amber-100'
              }`}>
                {isPro
                  ? <Star size={20} className="text-yellow-300" />
                  : <Clock size={20} className="text-amber-500" />
                }
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm ${isPro ? 'text-white' : 'text-slate-800'}`}>
                  {isPro ? '✨ Pro Plan' : 'Free Plan'}
                </p>
                <p className={`text-xs mt-0.5 ${isPro ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {isPro
                    ? profile?.pro_expires_at
                      ? `Active until ${new Date(profile.pro_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Unlimited AI access'
                    : '25 AI requests per day · Upgrade for unlimited'}
                </p>
              </div>
            </div>
            {!isPro && (
              <Link
                href="/student/upgrade"
                className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <Zap size={13} />
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* ── Settings links ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
          <Link
            href="/student/settings/security"
            className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition border-b border-slate-100"
          >
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Security &amp; 2FA</p>
              <p className="text-xs text-slate-500 mt-0.5">Two-factor authentication settings</p>
            </div>
            <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
          </Link>

          <Link
            href="/student/upgrade"
            className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition"
          >
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Subscription &amp; Billing</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPro ? 'Manage your Pro plan' : 'Upgrade to Pro — from $2/mo'}
              </p>
            </div>
            <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
          </Link>
        </div>

        {/* ── Accessibility ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Accessibility size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Accessibility</p>
              <p className="text-xs text-slate-500 mt-0.5">Font, contrast &amp; motion settings</p>
            </div>
          </div>
          <AccessibilityControls />
        </div>

        {/* ── Sign out — large + prominent for mobile ─────────────── */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-white border-2 border-red-200 text-red-500 font-semibold text-base rounded-2xl hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition shadow-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5">
          ZimLearn · Student Portal · v2.0
        </p>
      </div>
    </div>
  )
}
