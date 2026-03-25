'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Tag, Plus, X, CheckCircle2, XCircle, Loader2, ChevronLeft,
  ToggleLeft, ToggleRight, Clock, Infinity,
} from 'lucide-react'
import { PLANS } from '@/lib/paynow'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed_usd'
  discount_value: number
  max_uses: number | null
  uses_count: number
  valid_from: string
  valid_until: string | null
  applies_to: string[]
  min_amount_usd: number
  is_active: boolean
  created_at: string
}

const ALL_PLAN_IDS = Object.keys(PLANS) as (keyof typeof PLANS)[]

const PLAN_LABELS: Record<string, string> = Object.fromEntries(
  ALL_PLAN_IDS.map(id => [id, PLANS[id].label])
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DiscountBadge({ coupon }: { coupon: Coupon }) {
  const label = coupon.discount_type === 'percent'
    ? `${coupon.discount_value}% off`
    : `$${Number(coupon.discount_value).toFixed(2)} off`
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
      <Tag size={10} />
      {label}
    </span>
  )
}

// ── Create Coupon Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreate: () => void
}

function CreateCouponModal({ onClose, onCreate }: CreateModalProps) {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed_usd'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [appliesTo, setAppliesTo] = useState<string[]>([])
  const [minAmount, setMinAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function togglePlan(planId: string) {
    setAppliesTo(prev =>
      prev.includes(planId) ? prev.filter(p => p !== planId) : [...prev, planId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!code.trim()) { setError('Coupon code is required'); return }
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) { setError('Discount value must be a positive number'); return }
    if (discountType === 'percent' && value > 100) { setError('Percent discount cannot exceed 100'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          discount_type: discountType,
          discount_value: value,
          max_uses: maxUses ? parseInt(maxUses) : null,
          valid_until: validUntil || null,
          applies_to: appliesTo,
          min_amount_usd: minAmount ? parseFloat(minAmount) : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); return }
      onCreate()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Create Coupon</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Coupon Code *</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="e.g. ZIMLEARN50"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-mono tracking-widest text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 50% off for early adopters"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Discount Type *</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed_usd')}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed_usd">Fixed ($USD)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Value * {discountType === 'percent' ? '(%)' : '($USD)'}
              </label>
              <input
                type="number"
                min="0.01"
                max={discountType === 'percent' ? 100 : undefined}
                step="0.01"
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '50' : '20.00'}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Max uses + Valid until */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="e.g. 100"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Valid Until (blank = no expiry)</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Min amount */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Minimum Order Amount ($USD, 0 = no minimum)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Applies to */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Applies To <span className="text-slate-400 font-normal">(leave all unchecked = applies to all plans)</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3">
              {ALL_PLAN_IDS.map(planId => (
                <label key={planId} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1">
                  <input
                    type="checkbox"
                    checked={appliesTo.includes(planId)}
                    onChange={() => togglePlan(planId)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700">{PLAN_LABELS[planId]}</span>
                </label>
              ))}
            </div>
            {appliesTo.length > 0 && (
              <p className="text-xs text-indigo-600">{appliesTo.length} plan(s) selected</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <XCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Create Coupon
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load coupons'); return }
      setCoupons(data.coupons ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  async function toggleActive(coupon: Coupon) {
    setTogglingId(coupon.id)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to update coupon'); return }
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      setSuccessMsg(`Coupon ${coupon.code} ${!coupon.is_active ? 'activated' : 'deactivated'}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setTogglingId(null)
    }
  }

  const activeCoupons   = coupons.filter(c => c.is_active)
  const inactiveCoupons = coupons.filter(c => !c.is_active)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-600 transition">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            <span className="font-bold text-gray-900">Coupon Management</span>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Toast messages */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 size={16} className="shrink-0" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <XCircle size={16} className="shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><X size={14} /></button>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Coupons',   value: coupons.length,                     color: 'text-slate-700',   bg: 'bg-slate-100' },
            { label: 'Active',          value: activeCoupons.length,               color: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'Inactive',        value: inactiveCoupons.length,             color: 'text-slate-500',   bg: 'bg-slate-100' },
            { label: 'Total Uses',      value: coupons.reduce((s, c) => s + c.uses_count, 0), color: 'text-indigo-700', bg: 'bg-indigo-100' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Tag size={16} className={color} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Coupons table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Tag size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No coupons yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first coupon to offer discounts to students</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
              <Plus size={15} /> Create Coupon
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">All Coupons ({coupons.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Discount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Uses</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Applies To</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valid Until</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map(coupon => {
                    const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date()
                    const isMaxed   = coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses
                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50 transition">
                        {/* Code + description */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 font-mono tracking-wide">{coupon.code}</div>
                          {coupon.description && (
                            <div className="text-xs text-slate-400 mt-0.5 max-w-[180px] truncate">{coupon.description}</div>
                          )}
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-4">
                          <DiscountBadge coupon={coupon} />
                          {coupon.min_amount_usd > 0 && (
                            <div className="text-xs text-slate-400 mt-1">min ${Number(coupon.min_amount_usd).toFixed(2)}</div>
                          )}
                        </td>

                        {/* Uses */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            {coupon.uses_count}
                            <span className="text-slate-400 font-normal">/</span>
                            {coupon.max_uses === null
                              ? <Infinity size={14} className="text-slate-400" />
                              : <span className="text-slate-400 font-normal">{coupon.max_uses}</span>
                            }
                          </div>
                          {isMaxed && (
                            <div className="text-xs text-amber-600 font-medium mt-0.5">Limit reached</div>
                          )}
                        </td>

                        {/* Applies to */}
                        <td className="px-4 py-4">
                          {coupon.applies_to && coupon.applies_to.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {coupon.applies_to.slice(0, 2).map(p => (
                                <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                                  {PLAN_LABELS[p] ?? p}
                                </span>
                              ))}
                              {coupon.applies_to.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{coupon.applies_to.length - 2} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">All plans</span>
                          )}
                        </td>

                        {/* Valid until */}
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1.5 text-xs ${isExpired ? 'text-red-500' : 'text-slate-600'}`}>
                            {coupon.valid_until ? (
                              <>
                                <Clock size={12} />
                                {formatDate(coupon.valid_until)}
                              </>
                            ) : (
                              <>
                                <Infinity size={12} className="text-slate-400" />
                                <span className="text-slate-400">No expiry</span>
                              </>
                            )}
                          </div>
                          {isExpired && <div className="text-[10px] text-red-500 font-semibold mt-0.5">EXPIRED</div>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            coupon.is_active && !isExpired && !isMaxed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {coupon.is_active && !isExpired && !isMaxed ? (
                              <><CheckCircle2 size={10} /> Active</>
                            ) : (
                              <><XCircle size={10} /> Inactive</>
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleActive(coupon)}
                            disabled={togglingId === coupon.id}
                            title={coupon.is_active ? 'Deactivate coupon' : 'Activate coupon'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              coupon.is_active
                                ? 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            {togglingId === coupon.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : coupon.is_active ? (
                              <ToggleRight size={13} />
                            ) : (
                              <ToggleLeft size={13} />
                            )}
                            {coupon.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCouponModal
          onClose={() => setShowCreate(false)}
          onCreate={fetchCoupons}
        />
      )}
    </div>
  )
}
