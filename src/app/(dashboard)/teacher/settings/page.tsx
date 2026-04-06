'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import {
  Mail, GraduationCap, ArrowLeft, Loader2, Check, Edit2, LogOut, AlertCircle,
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
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        
        // Safely check for user
        const { data: authData, error: authError } = await supabase.auth.getUser()
        const user = authData?.user
        
        if (authError || !user) {
          window.location.href = '/login'
          return
        }

        const { data: p, error: _pError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const { data: tp, error: _tpError } = await supabase
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
      } catch (err) {
        console.error('[Settings] Load failed:', err)
        setError('Failed to load profile data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveName() {
    if (!newName.trim()) return
    try {
      setSaving(true)
      setError(null)
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: newName.trim() })
          .eq('id', user.id)
        
        if (updateError) throw updateError
        
        setProfile(prev => prev ? { ...prev, full_name: newName.trim() } : prev)
        setEditingName(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      console.error('[Settings] Save failed:', err)
      setError('Failed to update name.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 uppercase mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  const initials = (profile?.full_name ?? 'T')
    .split(' ')
    .filter(Boolean)
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
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-5 uppercase"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ring-4 ring-blue-500/20 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span className="text-white text-2xl font-bold uppercase">{initials}</span>
          </div>

          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-2 max-w-xs mx-auto mt-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your full name"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 uppercase"
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
              <h1 className="text-lg font-bold text-slate-900 uppercase">{profile?.full_name}</h1>
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
            <p className="text-xs text-blue-600 font-medium mt-1 uppercase">✓ Name updated!</p>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 text-sm">
            <Mail size={13} className="shrink-0" />
            <span className="break-all uppercase">{profile?.email}</span>
          </div>

          {profile?.qualification && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-500 text-sm uppercase">
              <GraduationCap size={13} className="shrink-0" />
              <span>{profile.qualification}</span>
            </div>
          )}

          {profile?.bio && (
            <p className="text-xs text-slate-400 mt-3 max-w-xs mx-auto line-clamp-3 uppercase">{profile.bio}</p>
          )}
        </div>

        {/* Sign out */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-white border-2 border-red-200 text-red-500 font-semibold text-base rounded-2xl hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition shadow-sm uppercase"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-5 uppercase">
          ZimLearn · Teacher Portal · v2.1
        </p>
      </div>
    </div>
  )
}
