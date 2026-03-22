'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import {
  Mail, GraduationCap, ArrowLeft, Loader2, Check, Edit2, LogOut,
} from 'lucide-react'

interface ProfileData {
  full_name: string
  email: string
  qualification: string | null
  bio: string | null
}

export default function TeacherSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [profile, setProfile]         = useState<ProfileData | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName]         = useState('')
  const [saved, setSaved]             = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { data: tp } = await supabase
        .from('teacher_profiles')
        .select('qualification, bio')
        .eq('user_id', user.id)
        .single()

      setProfile({
        full_name:     p?.full_name     ?? 'Teacher',
        email:         user.email       ?? '',
        qualification: tp?.qualification ?? null,
        bio:           tp?.bio          ?? null,
      })
      setNewName(p?.full_name ?? '')
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveName() {
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, full_name: newName.trim() } : prev)
    }
    setSaving(false)
    setEditingName(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    )
  }

  const initials = (profile?.full_name ?? 'T')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'T'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">

        {/* Back link */}
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-5"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ring-4 ring-blue-500/20 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>

          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-2 max-w-xs mx-auto mt-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your full name"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                autoFocus
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-50 transition"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-1">
              <h1 className="text-lg font-bold text-slate-900">{profile?.full_name}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Edit name"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {saved && (
            <p className="text-xs text-blue-600 font-medium mt-1">✓ Name updated!</p>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 text-sm">
            <Mail size={13} className="shrink-0" />
            <span className="break-all">{profile?.email}</span>
          </div>

          {profile?.qualification && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-500 text-sm">
              <GraduationCap size={13} className="shrink-0" />
              <span>{profile.qualification}</span>
            </div>
          )}

          {profile?.bio && (
            <p className="text-xs text-slate-400 mt-3 max-w-xs mx-auto line-clamp-3">{profile.bio}</p>
          )}
        </div>

        {/* Sign out */}
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
          ZimLearn · Teacher Portal · v2.0
        </p>
      </div>
    </div>
  )
}
