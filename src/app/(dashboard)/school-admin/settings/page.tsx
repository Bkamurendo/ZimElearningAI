'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Settings,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  School,
  MapPin,
  Phone,
  Mail,
  Image as ImageIcon,
  Globe,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ── Zimbabwe provinces ────────────────────────────────────────────────────────
const PROVINCES = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface SchoolData {
  id: string
  name: string
  address: string | null
  province: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  plan: string | null
  max_students: number | null
  subscription_expires_at: string | null
}

interface FormState {
  name: string
  address: string
  province: string
  phone: string
  email: string
  logo_url: string
}

// ── Toast component ───────────────────────────────────────────────────────────
function Toast({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-[10px] font-bold uppercase transition-all duration-300 border border-white/10 ${
        type === 'success'
          ? 'bg-emerald-600 text-white shadow-emerald-600/20'
          : 'bg-red-600 text-white shadow-red-600/20'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle size={16} className="flex-shrink-0" />
      ) : (
        <XCircle size={16} className="flex-shrink-0" />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100 transition text-lg leading-none">×</button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SchoolAdminSettingsPage() {
  const supabase = createClient()
  const [school, setSchool] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [form, setForm] = useState<FormState>({
    name: '',
    address: '',
    province: '',
    phone: '',
    email: '',
    logo_url: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        const user = authData?.user
        
        if (authError || !user) {
          window.location.href = '/login'
          return
        }

        const res = await fetch('/api/school-admin/school')
        const data = await res.json()
        
        if (data.school) {
          const s = data.school
          setSchool(s)
          setForm({
            name: s.name ?? '',
            address: s.address ?? '',
            province: s.province ?? '',
            phone: s.phone ?? '',
            email: s.email ?? '',
            logo_url: s.logo_url ?? '',
          })
        }
      } catch (err) {
        console.error('Error loading school data:', err)
        showToast('error', 'Critical failure loading institutional data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('error', 'INSTITUTION NAME IS REQUIRED.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/school-admin/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          province: form.province || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          logo_url: form.logo_url.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast('error', json.error ?? 'FAILED TO PERSIST SETTINGS.')
      } else {
        showToast('success', 'INSTITUTION SETTINGS VERIFIED & SAVED.')
        setSchool((prev) => prev ? { ...prev, ...form } : prev)
      }
    } catch {
      showToast('error', 'NETWORK PROTOCOL ERROR. RETRY.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  const planLabel = school?.plan?.toLowerCase() === 'pro' ? 'Pro' : school?.plan?.toLowerCase() === 'elite' ? 'Elite' : 'Starter'
  const planColor = school?.plan?.toLowerCase() === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-100' : school?.plan?.toLowerCase() === 'elite' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="min-h-screen bg-slate-50/50">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 shadow-sm">
        <div className="max-w-3xl mx-auto font-bold uppercase">
          <Link href="/school-admin/dashboard" className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-[10px] mb-4 transition uppercase font-bold">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">System Configuration</h1>
              <p className="text-emerald-200 text-[10px] uppercase font-bold mt-0.5">Manage your institutional profile and core parameters</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-bold uppercase">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 uppercase">
              <School size={16} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800 text-sm tracking-tight">Institutional Profile</h2>
            </div>

            <div className="px-6 py-6 space-y-5 uppercase">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Institution Name *</label>
                <div className="relative">
                  <School size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => field('name', e.target.value)}
                    placeholder="e.g. Harare High School"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Physical Address</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    value={form.address}
                    onChange={(e) => field('address', e.target.value)}
                    placeholder="e.g. 12 Samora Machel Ave, Harare"
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Province</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={form.province}
                      onChange={(e) => field('province', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm appearance-none bg-white"
                    >
                      <option value="">— SELECT PROVINCE —</option>
                      {PROVINCES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Institutional Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => field('phone', e.target.value)}
                      placeholder="+263 77 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Public Identity Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => field('email', e.target.value)}
                    placeholder="admin@school.ac.zw"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Institutional Logo URL</label>
                <div className="relative">
                  <ImageIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => field('logo_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase shadow-lg border-none tracking-widest px-8">
                {saving ? 'Saving...' : 'COMMIT CHANGES'}
              </Button>
            </div>
          </div>
        </form>

        {/* Subscription */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-bold uppercase">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-500" />
            <h2 className="font-bold text-slate-800 text-sm tracking-tight uppercase">License & Subscription</h2>
          </div>

          <div className="px-6 py-6 space-y-4 uppercase">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 uppercase">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Service Tier</p>
                <p className="text-xs font-bold text-slate-800 uppercase mt-0.5 tracking-tight">Active Subscription Rank</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black border shadow-sm ${planColor}`}>
                {planLabel}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100 uppercase">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Enrollment Capacity</p>
                <p className="text-xs font-bold text-slate-800 uppercase mt-0.5 tracking-tight">Authorized Student Slots</p>
              </div>
              <span className="text-xs font-black text-slate-800 uppercase shadow-sm border border-slate-100 px-3 py-1 rounded-lg bg-slate-50">
                {school?.max_students?.toLocaleString() ?? '50'} MAX
              </span>
            </div>
          </div>

          {school?.plan?.toLowerCase() !== 'elite' && (
            <div className="px-6 pb-6">
              <Link href="/student/upgrade" className="flex items-center justify-between w-full px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:from-emerald-600 transition-all font-bold">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest">Upgrade to Elite Rank</p>
                  <p className="text-[9px] font-bold text-emerald-100 uppercase italic mt-0.5">Unlock custom branding & secondary storage</p>
                </div>
                <ChevronRight size={18} className="flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
