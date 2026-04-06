'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Settings,
  ArrowLeft,
  AlertTriangle,
  User,
  Shield,
  Lock,
  Clock,
  CheckCircle2,
  LogOut,
  Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { logout } from '@/app/actions/auth'

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
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'platform' | 'account'>('platform')
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState<{ key: string; status: 'idle' | 'saving' | 'saved' | 'error' }>({ key: '', status: 'idle' })
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')
        
        const { data: authData, error: authError } = await supabase.auth.getUser()
        const user = authData?.user
        
        if (authError || !user) {
          window.location.href = '/login'
          return
        }

        const [settingsRes, profileRes] = await Promise.all([
          fetch('/api/admin/settings').then(r => r.json()),
          supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single()
        ])

        if (profileRes.data?.role?.toLowerCase() !== 'admin') {
          window.location.href = '/admin/dashboard'
          return
        }

        setSettings(settingsRes.settings ?? {})
        setProfile({
          full_name: profileRes.data?.full_name ?? 'Admin',
          email: profileRes.data?.email ?? user.email ?? ''
        })
      } catch (err) {
        console.error('Error loading settings/profile:', err)
        setError('Failed to load system settings.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function saveSetting(key: string, value: unknown) {
    setSavingStatus({ key, status: 'saving' }); setError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      
      setSettings(s => ({ ...s, [key]: value }))
      setSavingStatus({ key, status: 'saved' })
      setTimeout(() => setSavingStatus({ key: '', status: 'idle' }), 2000)
    } catch (err: any) {
      setError(err.message)
      setSavingStatus({ key, status: 'error' })
    }
  }

  async function updateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingStatus({ key: 'profile', status: 'saving' }); setError('')
    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('full_name') as string

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('Not authenticated')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', authData.user.id)
        
      if (updateError) throw updateError
      
      setProfile(p => p ? { ...p, full_name: fullName } : null)
      setSavingStatus({ key: 'profile', status: 'saved' })
      setTimeout(() => setSavingStatus({ key: '', status: 'idle' }), 2000)
    } catch (err: any) {
      setError(err.message)
      setSavingStatus({ key: 'profile', status: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  const initials = (profile?.full_name ?? 'A')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'A'

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Premium Admin Header */}
      <div className="bg-slate-900 border-b border-emerald-500/20 px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="max-w-4xl mx-auto relative z-10 font-bold">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-[10px] mb-6 transition-colors group px-3 py-1.5 rounded-lg hover:bg-slate-800 uppercase font-bold">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10">
                <Settings size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Settings HQ</h1>
                <p className="text-slate-400 text-[10px] uppercase font-bold mt-1">Global platform parameters and admin security.</p>
              </div>
            </div>
            
            <div className="flex bg-slate-800 p-1 rounded-xl shadow-inner border border-white/5">
               <button 
                 onClick={() => setActiveTab('platform')}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'platform' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 Platform
               </button>
               <button 
                 onClick={() => setActiveTab('account')}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 My Account
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl px-5 py-4 text-[10px] uppercase font-bold mb-8 flex items-center gap-3 shadow-sm">
             <AlertTriangle size={18} /> {error}
          </div>
        )}

        {activeTab === 'platform' ? (
          <div className="space-y-8">
            {settings['maintenance_mode'] === true && (
              <div className="bg-amber-500 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl shadow-amber-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={22} className="animate-pulse" />
                  <div>
                    <p className="font-black uppercase tracking-tight text-sm">MAINTENANCE MODE IS ENABLED</p>
                    <p className="text-[10px] font-bold text-amber-100 uppercase italic">Students and teachers are currently blocked from access.</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-white text-amber-600 border-none font-black shadow-sm"
                  onClick={() => saveSetting('maintenance_mode', false)}
                >
                  DEACTIVATE
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {SETTING_DEFS.map(group => (
                <Card key={group.group} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 font-bold">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.group}</h2>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.settings.map(setting => {
                      const currentValue = settings[setting.key]
                      const isSaving = savingStatus.key === setting.key && savingStatus.status === 'saving'
                      const isSaved = savingStatus.key === setting.key && savingStatus.status === 'saved'

                      return (
                        <div key={setting.key} className="px-6 py-6 flex items-center justify-between gap-8 group">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-slate-800 dark:text-white text-xs uppercase">{setting.label}</p>
                              {('danger' in setting) && setting.danger && (
                                <Badge variant="rose" className="text-[8px] font-black uppercase">CRITICAL</Badge>
                              )}
                              {isSaved && <Badge variant="emerald" className="bg-emerald-500 text-white text-[8px] font-black uppercase">SAVED</Badge>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 max-w-md italic">{setting.description}</p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {setting.type === 'toggle' ? (
                              <button
                                onClick={() => saveSetting(setting.key, !(currentValue === true || currentValue === 'true'))}
                                disabled={isSaving}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${
                                  (currentValue === true || currentValue === 'true') 
                                    ? 'bg-emerald-500' 
                                    : 'bg-slate-200 dark:bg-slate-800'
                                } disabled:opacity-50`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                  (currentValue === true || currentValue === 'true') ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <input
                                    type="number"
                                    defaultValue={Number(currentValue)}
                                    onBlur={e => saveSetting(setting.key, Number(e.target.value))}
                                    className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all uppercase shadow-sm"
                                  />
                                  {isSaving && (
                                    <div className="absolute -right-1 -top-1">
                                       <Loader2 size={12} className="animate-spin text-emerald-500" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
               <Card className="p-6 text-center bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-700 shadow-xl overflow-hidden relative">
                     <span className="text-2xl font-black text-white italic uppercase">{initials}</span>
                     <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500" />
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{profile?.full_name}</h3>
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Super Administrator</p>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                     <div className="flex items-center gap-3 text-left">
                        <Shield size={16} className="text-slate-400" />
                        <div className="min-w-0">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Access Level</p>
                           <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Clearance Rank 4</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 text-left">
                        <Lock size={16} className="text-slate-400" />
                        <div className="min-w-0">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Security</p>
                           <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">AAL2 Hardened</p>
                        </div>
                     </div>
                  </div>
               </Card>
               
               <form action={logout}>
                <Button type="submit" className="w-full justify-start gap-3 group bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-rose-600/20">
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  TERMINATE SESSION
                </Button>
               </form>
            </div>

            <div className="md:col-span-2 space-y-6">
               <Card className="p-8 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-6">
                    <User size={18} className="text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Authorized Identity</h3>
                  </div>
                  
                  <form onSubmit={updateProfile} className="space-y-6">
                     <div className="space-y-2 uppercase">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Full Legal Name</label>
                        <input 
                          name="full_name"
                          defaultValue={profile?.full_name}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white uppercase shadow-sm"
                          required
                        />
                     </div>
                     <div className="space-y-2 uppercase">
                        <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 opacity-50">Admin Email (Static)</label>
                        <div className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 text-[10px] font-bold text-slate-400 flex items-center justify-between uppercase">
                           {profile?.email}
                           <Badge variant="slate" className="text-[8px] font-black tracking-widest">ENCRYPTED</Badge>
                        </div>
                     </div>
                     
                     <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div className="flex items-center gap-2">
                           {(savingStatus.key === 'profile' && savingStatus.status === 'saving') ? <Loader2 size={14} className="animate-spin text-emerald-500" /> : null}
                           {savingStatus.key === 'profile' && savingStatus.status === 'saved' && <CheckCircle2 size={14} className="text-emerald-500" />}
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">Re-auth required for global propagation.</p>
                        </div>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase shadow-lg shadow-emerald-600/20 border-none">
                           {savingStatus.key === 'profile' && savingStatus.status === 'saving' ? 'UPDATING...' : 'SAVE CHANGES'}
                        </Button>
                     </div>
                  </form>
               </Card>
               
               <Card className="p-8 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 font-bold">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Access Logs</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase italic">Login detected from Harare, ZW. Session key secured with AES-256 GCM.</p>
                  <Link href="/admin/audit-logs">
                    <Button variant="ghost" size="sm" className="mt-4 text-emerald-600 font-black text-[8px] uppercase tracking-widest hover:bg-emerald-50">VIEW SECURITY TRAIL</Button>
                  </Link>
               </Card>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[8px] text-slate-400 font-black text-center uppercase tracking-[0.3em]">ZimLearn Framework v2.4 · AdminHQ Core · Secured Environment</p>
        </footer>
      </div>
    </div>
  )
}
