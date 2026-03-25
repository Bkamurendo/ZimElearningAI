'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Settings,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  School,
  MapPin,
  Phone,
  Mail,
  Image,
  Globe,
  CreditCard,
  ChevronRight,
} from 'lucide-react'

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
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold transition-all duration-300 ${
        type === 'success'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle size={16} className="flex-shrink-0" />
      ) : (
        <XCircle size={16} className="flex-shrink-0" />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-75 hover:opacity-100 transition"
      >
        ×
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SchoolAdminSettingsPage() {
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

  // ── Load school data ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/school-admin/school')
      .then((r) => r.json())
      .then((data: { school?: SchoolData; error?: string }) => {
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
        setLoading(false)
      })
      .catch(() => {
        setToast({ type: 'error', message: 'Failed to load school data.' })
        setLoading(false)
      })
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Save handler ───────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('error', 'School name is required.')
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
        showToast('error', json.error ?? 'Failed to save settings.')
      } else {
        showToast('success', 'School settings saved successfully.')
        setSchool((prev) =>
          prev ? { ...prev, ...form } : prev
        )
      }
    } catch {
      showToast('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  // ── Plan display helpers ───────────────────────────────────────────────────
  const planLabel =
    school?.plan === 'pro'
      ? 'Pro'
      : school?.plan === 'elite'
      ? 'Elite'
      : 'Starter (Free)'

  const planColor =
    school?.plan === 'pro'
      ? 'bg-blue-50 text-blue-700'
      : school?.plan === 'elite'
      ? 'bg-purple-50 text-purple-700'
      : 'bg-slate-100 text-slate-600'

  const expiryDate = school?.subscription_expires_at
    ? new Date(school.subscription_expires_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/school-admin/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-200 hover:text-white text-sm mb-4 transition"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                School Settings
              </h1>
              <p className="text-emerald-200 text-sm">
                Manage your school profile and contact details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* ── School profile form ── */}
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <School size={16} className="text-emerald-500" />
              <h2 className="font-bold text-slate-800">School Profile</h2>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* School Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  School Name{' '}
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <School
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => field('name', e.target.value)}
                    placeholder="e.g. Harare High School"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Address
                </label>
                <div className="relative">
                  <MapPin
                    size={15}
                    className="absolute left-3.5 top-3 text-slate-400"
                  />
                  <textarea
                    value={form.address}
                    onChange={(e) => field('address', e.target.value)}
                    placeholder="e.g. 12 Samora Machel Ave, Harare"
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Province
                </label>
                <div className="relative">
                  <Globe
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <select
                    value={form.province}
                    onChange={(e) => field('province', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white appearance-none"
                  >
                    <option value="">— Select province —</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone & Email in a grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => field('phone', e.target.value)}
                      placeholder="+263 77 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => field('email', e.target.value)}
                      placeholder="admin@school.ac.zw"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Logo URL
                </label>
                <div className="relative">
                  <Image
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => field('logo_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                {form.logo_url && (
                  <div className="mt-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt="School logo preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <p className="text-xs text-slate-400">Logo preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── Subscription info (read-only) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-500" />
            <h2 className="font-bold text-slate-800">Subscription</h2>
          </div>

          <div className="px-6 py-6 space-y-4">
            {/* Current plan */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Current Plan
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your active subscription tier
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${planColor}`}
              >
                {planLabel}
              </span>
            </div>

            {/* Max students */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Student Limit
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maximum students on this plan
                </p>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {school?.max_students != null
                  ? school.max_students.toLocaleString()
                  : 'Unlimited'}
              </span>
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Subscription Expires
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your plan renews or expires on this date
                </p>
              </div>
              <span className="text-sm font-medium text-slate-600">
                {expiryDate ?? (
                  <span className="text-slate-300">—</span>
                )}
              </span>
            </div>
          </div>

          {/* Upgrade CTA */}
          {school?.plan !== 'elite' && (
            <div className="px-6 pb-6">
              <Link
                href="/student/upgrade"
                className="flex items-center justify-between w-full px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition shadow-sm"
              >
                <div>
                  <p>Upgrade to Pro</p>
                  <p className="text-xs font-normal text-emerald-100 mt-0.5">
                    Unlock more students, AI features &amp; analytics
                  </p>
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
