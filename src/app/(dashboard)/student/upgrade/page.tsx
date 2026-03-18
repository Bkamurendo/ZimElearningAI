'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap, CheckCircle2, XCircle, Loader2, ChevronLeft,
  Smartphone, Shield, Lock, Star, Check,
} from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/paynow'

// ─── SVG Payment Provider Logos ──────────────────────────────────────────────

function EcoCashLogo() {
  return (
    <svg viewBox="0 0 72 28" className="h-7 w-auto" aria-label="EcoCash">
      <rect width="72" height="28" rx="5" fill="#00A651" />
      <text x="36" y="19" textAnchor="middle" fill="white" fontSize="10.5"
        fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="0.5">EcoCash</text>
    </svg>
  )
}

function OneMoneyLogo() {
  return (
    <svg viewBox="0 0 76 28" className="h-7 w-auto" aria-label="OneMoney">
      <rect width="76" height="28" rx="5" fill="#0050A0" />
      <circle cx="14" cy="14" r="8" fill="#FFD700" opacity="0.9" />
      <text x="8" y="18" textAnchor="middle" fill="#0050A0" fontSize="8"
        fontWeight="900" fontFamily="Arial">1</text>
      <text x="46" y="19" textAnchor="middle" fill="white" fontSize="10"
        fontWeight="700" fontFamily="Arial">OneMoney</text>
    </svg>
  )
}

function InnBucksLogo() {
  return (
    <svg viewBox="0 0 74 28" className="h-7 w-auto" aria-label="InnBucks">
      <defs>
        <linearGradient id="ib" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FF9500" />
        </linearGradient>
      </defs>
      <rect width="74" height="28" rx="5" fill="url(#ib)" />
      <text x="37" y="19" textAnchor="middle" fill="white" fontSize="10"
        fontWeight="800" fontFamily="Arial, sans-serif">InnBucks</text>
    </svg>
  )
}

function ZimSwitchLogo() {
  return (
    <svg viewBox="0 0 82 28" className="h-7 w-auto" aria-label="ZimSwitch">
      <rect width="82" height="28" rx="5" fill="#003087" />
      <rect x="4" y="4" width="20" height="20" rx="3" fill="#FFD700" />
      <text x="7" y="18" fill="#003087" fontSize="9" fontWeight="900" fontFamily="Arial">ZS</text>
      <text x="52" y="19" textAnchor="middle" fill="white" fontSize="9.5"
        fontWeight="700" fontFamily="Arial">ZimSwitch</text>
    </svg>
  )
}

function VisaLogo() {
  return (
    <svg viewBox="0 0 60 28" className="h-7 w-auto" aria-label="Visa">
      <rect width="60" height="28" rx="5" fill="#1A1F71" />
      <text x="30" y="20" textAnchor="middle" fill="white" fontSize="16"
        fontWeight="800" fontFamily="Arial" fontStyle="italic" letterSpacing="1">VISA</text>
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 52 28" className="h-7 w-auto" aria-label="Mastercard">
      <rect width="52" height="28" rx="5" fill="#252525" />
      <circle cx="20" cy="14" r="9" fill="#EB001B" />
      <circle cx="32" cy="14" r="9" fill="#F79E1B" />
      <path d="M26 7.2a9 9 0 0 1 0 13.6A9 9 0 0 1 26 7.2z" fill="#FF5F00" />
    </svg>
  )
}

function GooglePayLogo() {
  return (
    <svg viewBox="0 0 68 28" className="h-7 w-auto" aria-label="Google Pay">
      <rect width="68" height="28" rx="5" fill="white" stroke="#E8E8E8" strokeWidth="1.2" />
      <text x="34" y="20" textAnchor="middle" fontSize="12" fontFamily="Arial" fontWeight="500">
        <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC04">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e </tspan><tspan fill="#5F6368">Pay</tspan>
      </text>
    </svg>
  )
}

function ApplePayLogo() {
  return (
    <svg viewBox="0 0 62 28" className="h-7 w-auto" aria-label="Apple Pay">
      <rect width="62" height="28" rx="5" fill="#000" />
      <text x="31" y="20" textAnchor="middle" fill="white" fontSize="12"
        fontFamily="-apple-system, Helvetica, Arial" fontWeight="500"> Pay</text>
    </svg>
  )
}

function FlutterwaveLogo() {
  return (
    <svg viewBox="0 0 92 28" className="h-7 w-auto" aria-label="Flutterwave">
      <defs>
        <linearGradient id="flw" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
      <rect width="92" height="28" rx="5" fill="url(#flw)" />
      <text x="46" y="19" textAnchor="middle" fill="white" fontSize="9.5"
        fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="0.3">Flutterwave</text>
    </svg>
  )
}

function PaynowLogo() {
  return (
    <svg viewBox="0 0 70 28" className="h-7 w-auto" aria-label="Paynow">
      <rect width="70" height="28" rx="5" fill="#1B4F91" />
      <text x="35" y="19" textAnchor="middle" fill="white" fontSize="10.5"
        fontWeight="700" fontFamily="Arial, sans-serif">Paynow</text>
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRO_FEATURES = [
  { icon: '🤖', text: 'Unlimited AI requests every day' },
  { icon: '💬', text: 'Full AI Tutor sessions — no limits' },
  { icon: '📝', text: 'Model answers for all past papers' },
  { icon: '📚', text: 'Snap notes, glossary & practice sets' },
  { icon: '⚡', text: 'Priority AI — faster responses' },
  { icon: '🎯', text: 'Advanced grade predictor & analytics' },
  { icon: '✨', text: 'Every new Pro feature, automatically' },
]

const PLAN_META: Record<PlanId, { perMonth: string; period: string; popular?: boolean }> = {
  pro_monthly:   { perMonth: '$5.00',  period: 'per month' },
  pro_quarterly: { perMonth: '$4.00',  period: 'per month, billed quarterly', popular: true },
  pro_yearly:    { perMonth: '$2.92',  period: 'per month, billed annually' },
}

const PLAN_ORDER: { id: PlanId; badge?: string }[] = [
  { id: 'pro_monthly' },
  { id: 'pro_quarterly', badge: 'Save 20%' },
  { id: 'pro_yearly',    badge: 'Best Value' },
]

type PaymentMethod = 'ecocash' | 'onemoney' | 'innbucks' | 'web'
type Gateway = 'local' | 'international'

const LOCAL_METHODS: {
  id: PaymentMethod; label: string; sublabel: string;
  color: string; borderColor: string; bgColor: string; Logo: () => JSX.Element
}[] = [
  {
    id: 'ecocash',
    label: 'EcoCash',
    sublabel: 'EcoNet · USSD push',
    color: '#00A651', borderColor: 'border-green-400', bgColor: 'bg-green-50',
    Logo: EcoCashLogo,
  },
  {
    id: 'onemoney',
    label: 'OneMoney',
    sublabel: 'NetOne · USSD push',
    color: '#0050A0', borderColor: 'border-blue-400', bgColor: 'bg-blue-50',
    Logo: OneMoneyLogo,
  },
  {
    id: 'innbucks',
    label: 'InnBucks',
    sublabel: 'InnBucks wallet',
    color: '#FF6B00', borderColor: 'border-orange-400', bgColor: 'bg-orange-50',
    Logo: InnBucksLogo,
  },
  {
    id: 'web',
    label: 'ZimSwitch / Bank',
    sublabel: 'Card · Internet Banking',
    color: '#003087', borderColor: 'border-blue-700', bgColor: 'bg-indigo-50',
    Logo: ZimSwitchLogo,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const searchParams = useSearchParams()

  const [selectedPlan,   setSelectedPlan]   = useState<PlanId>('pro_quarterly')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ecocash')
  const [gateway,        setGateway]        = useState<Gateway>('local')
  const [phone,          setPhone]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const [paymentId,     setPaymentId]     = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'paid' | 'failed'>('idle')
  const [pollCount,     setPollCount]     = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const status = searchParams.get('status')
    const flw    = searchParams.get('flw')
    if (status === 'return') {
      setPaymentStatus('waiting')
    } else if (flw === 'paid') {
      setPaymentStatus('paid')
    } else if (flw === 'failed' || flw === 'cancelled' || flw === 'error') {
      setPaymentStatus('failed')
      setError(flw === 'cancelled'
        ? 'Payment was cancelled. You can try again below.'
        : 'Payment failed or could not be verified. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    if (paymentStatus !== 'waiting' || !paymentId) return
    const poll = async () => {
      setPollCount(c => c + 1)
      try {
        const res  = await fetch(`/api/payments/poll?paymentId=${paymentId}`)
        const data = await res.json()
        if (data.status === 'paid') {
          setPaymentStatus('paid')
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setPaymentStatus('failed')
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch { /* keep polling */ }
    }
    poll()
    pollRef.current = setInterval(poll, 5000)
    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      setPaymentStatus('failed')
    }, 10 * 60 * 1000)
    return () => { if (pollRef.current) clearInterval(pollRef.current); clearTimeout(timeout) }
  }, [paymentStatus, paymentId])

  async function handleFlutterwavePay() {
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/payments/flutterwave/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { setError(`Server error (${res.status})`); return }
      if (!res.ok) { setError(String(data.error ?? `Error ${res.status}`)); return }
      if (data.paymentLink) window.location.href = data.paymentLink as string
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally { setLoading(false) }
  }

  async function handlePay() {
    setError(''); setLoading(true)
    try {
      const body: Record<string, unknown> = { planId: selectedPlan, method: selectedMethod }
      if (selectedMethod !== 'web') {
        if (!phone.trim()) { setError('Please enter your mobile money phone number'); setLoading(false); return }
        body.phone = phone.trim()
      }
      const res  = await fetch('/api/payments/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { setError(`Server error (${res.status})`); setLoading(false); return }
      if (!res.ok) { setError(String(data.error ?? `Error ${res.status}`)); setLoading(false); return }
      if (selectedMethod === 'web' && data.redirectUrl) { window.location.href = data.redirectUrl as string; return }
      setPaymentId(data.paymentId as string)
      setPaymentStatus('waiting')
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally { setLoading(false) }
  }

  const plan = PLANS[selectedPlan]

  // ── Paid screen ────────────────────────────────────────────────────────────
  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center border border-green-100">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <CheckCircle2 className="text-white" size={44} />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            <Star size={12} fill="currentColor" /> PRO ACTIVATED
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Welcome to Pro! 🎉</h1>
          <p className="text-slate-500 mb-2">Payment confirmed. Unlimited AI access is now active on your account.</p>
          <p className="text-sm text-slate-400 mb-8">Your dashboard will reflect the upgrade immediately.</p>
          <button
            onClick={() => { window.location.href = '/student/dashboard' }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-2xl transition shadow-md shadow-green-200"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting screen ─────────────────────────────────────────────────────────
  if (paymentStatus === 'waiting') {
    const methodInfo = LOCAL_METHODS.find(m => m.id === selectedMethod)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-indigo-100">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 animate-pulse">
            <Smartphone className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Phone</h1>
          <p className="text-slate-500 mb-6">
            A <strong>{methodInfo?.label ?? 'mobile money'}</strong> payment request has been sent to{' '}
            <strong className="text-slate-700">{phone || 'your number'}</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-left space-y-3">
            {[
              ['📳', 'Your phone will vibrate with a payment prompt'],
              ['🔢', 'Enter your mobile money PIN when asked'],
              ['✅', 'This page updates automatically when confirmed'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-slate-600">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
            <Loader2 className="animate-spin" size={16} />
            <span>Waiting for confirmation{pollCount > 0 ? ` · ${pollCount * 5}s` : ''}…</span>
          </div>

          <button
            onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0) }}
            className="text-slate-400 hover:text-slate-600 text-sm underline underline-offset-2 transition"
          >
            Cancel and try again
          </button>
        </div>
      </div>
    )
  }

  // ── Failed screen ──────────────────────────────────────────────────────────
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-red-100">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
            <XCircle className="text-white" size={44} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-slate-500 mb-8">
            {error || 'The payment was cancelled or timed out. Your account has not been charged.'}
          </p>
          <button
            onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0); setError('') }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition mb-3 shadow-md"
          >
            Try Again
          </button>
          <Link href="/student/dashboard" className="block text-slate-400 hover:text-slate-600 text-sm underline underline-offset-2">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Main upgrade page ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">
          <Link href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition mb-6">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Zap size={12} fill="currentColor" /> ZIMLEARN PRO
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Unlock Unlimited AI<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                for Your ZIMSEC Exams
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto">
              Join students across Zimbabwe acing their exams with unlimited AI tutoring, past papers &amp; more.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-5">

        {/* ── Pro features grid ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">Everything in Pro</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                  {icon}
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan selector ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Choose Your Plan</h2>
            <p className="text-xs text-slate-400 mt-0.5">All plans include every Pro feature. Cancel anytime.</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLAN_ORDER.map(({ id, badge }) => {
              const p       = PLANS[id]
              const meta    = PLAN_META[id]
              const isSelected = selectedPlan === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedPlan(id)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? meta.popular
                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                        : 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  {/* Popular badge */}
                  {meta.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      ⭐ Most Popular
                    </span>
                  )}
                  {badge && !meta.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      {badge}
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">{p.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="text-2xl font-black text-slate-900">
                    {meta.perMonth}
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">{meta.period}</div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-sm font-bold text-indigo-600">
                      ${p.amountUsd.toFixed(2)} USD total
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Payment method ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Payment Method</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose how you want to pay</p>
          </div>

          {/* Gateway tabs */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                onClick={() => setGateway('local')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  gateway === 'local'
                    ? 'bg-white text-slate-800 shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="text-base">🇿🇼</span>
                Zimbabwe
              </button>
              <button
                onClick={() => setGateway('international')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  gateway === 'international'
                    ? 'bg-white text-slate-800 shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="text-base">🌍</span>
                International
              </button>
            </div>
          </div>

          {/* Local — Zimbabwe payment methods */}
          {gateway === 'local' && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 font-medium">Select your mobile money provider</p>
              <div className="grid grid-cols-2 gap-3">
                {LOCAL_METHODS.map(m => {
                  const isSelected = selectedMethod === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-150 ${
                        isSelected
                          ? `${m.borderColor} ${m.bgColor} shadow-md`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      <m.Logo />
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-700">{m.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.sublabel}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Also powered by Paynow */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-medium">Secured by</span>
                <PaynowLogo />
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Phone input */}
              {selectedMethod !== 'web' && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    {selectedMethod === 'ecocash' ? 'EcoCash' :
                     selectedMethod === 'onemoney' ? 'OneMoney' : 'InnBucks'} Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <span className="text-slate-400 text-sm">🇿🇼 +263</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="77 123 4567"
                      className="w-full border-2 border-slate-200 rounded-xl pl-20 pr-4 py-3 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    You&apos;ll receive a USSD prompt on this number to approve the payment
                  </p>
                </div>
              )}

              {selectedMethod === 'web' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                      <ZimSwitchLogo />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">ZimSwitch / Internet Banking</p>
                      <p className="text-xs text-slate-500 mt-0.5">You&apos;ll be redirected to Paynow&apos;s secure checkout page. Supports all major Zimbabwean bank cards.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* International — Flutterwave */}
          {gateway === 'international' && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 font-medium">Pay with card or digital wallet</p>

              {/* Supported cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Logo: VisaLogo,      label: 'Visa' },
                  { Logo: MastercardLogo, label: 'Mastercard' },
                  { Logo: GooglePayLogo,  label: 'Google Pay' },
                  { Logo: ApplePayLogo,   label: 'Apple Pay' },
                ].map(({ Logo, label }) => (
                  <div key={label}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <Logo />
                    <span className="text-[10px] font-medium text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Powered by Flutterwave */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-medium">Powered by</span>
                <FlutterwaveLogo />
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <Shield size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">256-bit SSL Encrypted Checkout</p>
                  <p className="text-xs text-slate-400 mt-0.5">You&apos;ll be redirected to Flutterwave&apos;s secure hosted payment page. No card data is stored on ZimLearn.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Order summary + pay button ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900">{plan.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{plan.description}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">${plan.amountUsd.toFixed(2)}</div>
                <div className="text-xs text-slate-400">USD</div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {error && (
              <div className="flex items-start gap-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {gateway === 'international' ? (
              <button
                onClick={handleFlutterwavePay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Redirecting to checkout…</>
                ) : (
                  <><FlutterwaveLogo /> Pay ${plan.amountUsd.toFixed(2)} USD</>
                )}
              </button>
            ) : selectedMethod === 'web' ? (
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Redirecting…</>
                ) : (
                  <>Pay ${plan.amountUsd.toFixed(2)} via Paynow</>
                )}
              </button>
            ) : (
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Sending request…</>
                ) : selectedMethod === 'ecocash' ? (
                  <><EcoCashLogo /> Send ${plan.amountUsd.toFixed(2)} Request</>
                ) : selectedMethod === 'onemoney' ? (
                  <><OneMoneyLogo /> Send ${plan.amountUsd.toFixed(2)} Request</>
                ) : (
                  <><InnBucksLogo /> Send ${plan.amountUsd.toFixed(2)} Request</>
                )}
              </button>
            )}

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock size={11} className="text-green-500" />
                Secure payment
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield size={11} className="text-green-500" />
                No card data stored
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 size={11} className="text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
