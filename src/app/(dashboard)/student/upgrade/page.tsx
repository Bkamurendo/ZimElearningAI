'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap, CheckCircle2, XCircle, Loader2, ChevronLeft,
  Smartphone, Shield, Lock, Star, Check, X, Crown, ArrowRight, Tag,
} from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/paynow'

// ─── Logo helper ─────────────────────────────────────────────────────────────

function Logo({ src, alt, className = 'h-8 w-auto object-contain' }: {
  src: string; alt: string; className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  )
}

// ─── Tier definitions ─────────────────────────────────────────────────────────

type Tier = 'starter' | 'pro' | 'elite' | 'ultimate'

const TIERS: {
  id: Tier
  name: string
  tagline: string
  color: string
  headerBg: string
  badge?: string
  badgeBg?: string
  icon: React.ReactNode
  features: { text: string; included: boolean }[]
  planOptions: PlanId[]
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Boost your studies',
    color: 'text-blue-600',
    headerBg: 'bg-blue-600',
    icon: <Zap size={20} className="text-blue-500" />,
    features: [
      { text: '10 AI requests / day', included: true },
      { text: 'Download study materials', included: true },
      { text: 'Up to 15 subjects', included: true },
      { text: 'Study planner & grade predictor', included: true },
      { text: 'Notes & revision generation', included: true },
      { text: 'Unlimited AI requests', included: false },
      { text: 'Mock exam generator', included: false },
      { text: 'Advanced AI model (smarter answers)', included: false },
      { text: 'Parent progress dashboard', included: false },
    ],
    planOptions: ['starter_monthly', 'starter_yearly'],
  },
  {
    id: 'pro',
    name: 'Pro Scholar',
    tagline: 'Ace your ZIMSEC exams',
    color: 'text-indigo-600',
    headerBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    badge: '⭐ Most Popular',
    badgeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    icon: <Star size={20} className="text-indigo-500" fill="currentColor" />,
    features: [
      { text: '40 AI requests / day', included: true },
      { text: 'Download study materials', included: true },
      { text: 'All subjects (no limit)', included: true },
      { text: 'Notes & revision generation', included: true },
      { text: 'Full mock exam generator', included: true },
      { text: 'AI flashcard creator', included: true },
      { text: 'Faster AI responses', included: true },
      { text: 'Advanced AI model (smarter answers)', included: false },
      { text: 'Parent progress dashboard', included: false },
    ],
    planOptions: ['pro_monthly', 'pro_yearly'],
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'The ultimate edge',
    color: 'text-amber-600',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    badge: '👑 Best Value',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: <Crown size={20} className="text-amber-500" />,
    features: [
      { text: '120 AI requests / day', included: true },
      { text: 'Download study materials', included: true },
      { text: 'All subjects (no limit)', included: true },
      { text: 'Full mock exam generator', included: true },
      { text: 'AI flashcard creator', included: true },
      { text: 'Advanced AI model (smarter answers)', included: true },
      { text: 'Priority AI queue (fastest responses)', included: true },
      { text: 'Parent progress dashboard', included: true },
      { text: 'Early access to new features', included: true },
    ],
    planOptions: ['elite_monthly', 'elite_yearly'],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    tagline: 'Unstoppable learning',
    color: 'text-rose-600',
    headerBg: 'bg-gradient-to-r from-rose-500 to-red-600',
    badge: '🚀 Limitless',
    badgeBg: 'bg-gradient-to-r from-rose-500 to-red-600',
    icon: <Zap size={20} className="text-rose-500" fill="currentColor" />,
    features: [
      { text: 'Unlimited AI requests', included: true },
      { text: 'Download study materials', included: true },
      { text: 'All subjects (no limit)', included: true },
      { text: 'Full mock exam generator', included: true },
      { text: 'AI flashcard creator', included: true },
      { text: 'Advanced AI model (smarter answers)', included: true },
      { text: 'Priority AI queue (fastest)', included: true },
      { text: 'Parent progress dashboard', included: true },
      { text: '1-on-1 human tutor support', included: true },
    ],
    planOptions: ['ultimate_monthly', 'ultimate_yearly'],
  },
]

// ─── Plan option metadata ─────────────────────────────────────────────────────

const PLAN_META: Record<PlanId, { perMonth: string; period: string; badge?: string }> = {
  starter_monthly:      { perMonth: '$2.00', period: 'per month' },
  starter_yearly:       { perMonth: '$1.25', period: 'per month, billed $15 yearly', badge: 'Save 37.5%' },
  pro_monthly:          { perMonth: '$5.00', period: 'per month' },
  pro_yearly:           { perMonth: '$3.33', period: 'per month, billed $40 yearly', badge: 'Save 33%' },
  elite_monthly:        { perMonth: '$12.00', period: 'per month' },
  elite_yearly:         { perMonth: '$7.50', period: 'per month, billed $90 yearly', badge: 'Save 37.5%' },
  ultimate_monthly:     { perMonth: '$25.00', period: 'per month' },
  ultimate_yearly:      { perMonth: '$16.67', period: 'per month, billed $200 yearly', badge: 'Save 33%' },
  bootcamp_2week:       { perMonth: '$3.00', period: '2-week access (ZIMSEC exam prep)', badge: 'One-time' },
  bootcamp_4week:       { perMonth: '$5.00', period: '4-week access (ZIMSEC exam prep)', badge: 'Best Bootcamp' },
  school_basic_monthly: { perMonth: '$50.00', period: 'per month (up to 50 students)' },
  school_pro_monthly:   { perMonth: '$120.00', period: 'per month (unlimited students)' },
  school_pro_yearly:    { perMonth: '$83.33', period: 'per month, billed $1,000 yearly', badge: 'Save 31%' },
  parent_monitoring_monthly: { perMonth: '$3.00', period: 'per month' },
  ai_grade_report:      { perMonth: '$2.00', period: 'one-time purchase' },
  subject_pack:         { perMonth: '$1.50', period: 'lifetime access' },
  teacher_pro:          { perMonth: '$5.00', period: 'per month' },
  school_elite_basic:   { perMonth: '$100.00', period: 'per month' },
  school_elite_unlimited: { perMonth: '$83.33', period: 'per month, billed $1,000 yearly' },
  corporate_gold:       { perMonth: '$41.67', period: 'per month, billed $500 yearly' },
}


type PaymentMethod = 'ecocash' | 'onemoney' | 'innbucks' | 'web'
type Gateway = 'local' | 'international'

const LOCAL_METHODS: {
  id: PaymentMethod
  label: string
  sublabel: string
  logoSrc: string
  borderSelected: string
  bgSelected: string
}[] = [
  { id: 'ecocash',  label: 'EcoCash',         sublabel: 'EcoNet · USSD push',         logoSrc: '/logos/ecocash.png',    borderSelected: 'border-green-500',  bgSelected: 'bg-green-50' },
  { id: 'onemoney', label: 'OneMoney',         sublabel: 'NetOne · USSD push',          logoSrc: '/logos/onemoney.png',   borderSelected: 'border-blue-500',   bgSelected: 'bg-blue-50' },
  { id: 'innbucks', label: 'InnBucks',         sublabel: 'InnBucks wallet',             logoSrc: '/logos/innbucks.jpg',   borderSelected: 'border-orange-500', bgSelected: 'bg-orange-50' },
  { id: 'web',      label: 'ZimSwitch / Bank', sublabel: 'Card · Internet Banking',     logoSrc: '/logos/zimswitch.svg',  borderSelected: 'border-indigo-600', bgSelected: 'bg-indigo-50' },
]

const CARD_METHODS = [
  { src: '/logos/visa.svg',       alt: 'Visa' },
  { src: '/logos/mastercard.svg', alt: 'Mastercard' },
  { src: '/logos/googlepay.svg',  alt: 'Google Pay' },
  { src: '/logos/applepay.svg',   alt: 'Apple Pay' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const searchParams = useSearchParams()

  const [selectedTier,   setSelectedTier]   = useState<Tier>('pro')
  const [selectedPlan,   setSelectedPlan]   = useState<PlanId>('pro_quarterly')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ecocash')
  const [gateway,        setGateway]        = useState<Gateway>('local')
  const [phone,          setPhone]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const [couponCode,    setCouponCode]    = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError,   setCouponError]   = useState('')
  const [couponResult,  setCouponResult]  = useState<{
    valid: boolean
    discountedAmount: number
    savings: number
    description: string
    couponId: string
  } | null>(null)

  const [paymentId,     setPaymentId]     = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'paid' | 'failed'>('idle')
  const [pollCount,     setPollCount]     = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // When tier changes, default to first plan option for that tier and clear coupon
  function selectTier(tier: Tier) {
    setSelectedTier(tier)
    const tierDef = TIERS.find(t => t.id === tier)
    if (tierDef) setSelectedPlan(tierDef.planOptions[0])
    setCouponResult(null)
    setCouponError('')
  }

  async function applyCoupon() {
    if (!couponCode.trim()) { setCouponError('Please enter a coupon code'); return }
    setCouponLoading(true)
    setCouponError('')
    setCouponResult(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), planId: selectedPlan, amountUsd: PLANS[selectedPlan].amountUsd }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error ?? 'Invalid coupon code')
      } else {
        setCouponResult(data)
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  useEffect(() => {
    const status = searchParams.get('status')
    const flw    = searchParams.get('flw')
    const planId = searchParams.get('plan') as PlanId
    const _itemId = searchParams.get('subject')

    if (planId && PLANS[planId]) {
      setSelectedPlan(planId)
      // If it's a one-time item, we might want to hide the tier selector or just show a custom UI
    }

    if (status === 'return') setPaymentStatus('waiting')
    else if (flw === 'paid') setPaymentStatus('paid')
    else if (flw === 'failed' || flw === 'cancelled' || flw === 'error') {
      setPaymentStatus('failed')
      setError(flw === 'cancelled' ? 'Payment was cancelled. You can try again below.' : 'Payment failed or could not be verified. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    if (paymentStatus !== 'waiting' || !paymentId) return
    const poll = async () => {
      setPollCount(c => c + 1)
      try {
        const res  = await fetch(`/api/payments/poll?paymentId=${paymentId}`)
        const data = await res.json()
        if (data.status === 'paid') { setPaymentStatus('paid'); if (pollRef.current) clearInterval(pollRef.current) }
        else if (data.status === 'failed' || data.status === 'cancelled') { setPaymentStatus('failed'); if (pollRef.current) clearInterval(pollRef.current) }
      } catch { /* keep polling */ }
    }
    poll()
    pollRef.current = setInterval(poll, 5000)
    const timeout = setTimeout(() => { if (pollRef.current) clearInterval(pollRef.current); setPaymentStatus('failed') }, 10 * 60 * 1000)
    return () => { if (pollRef.current) clearInterval(pollRef.current); clearTimeout(timeout) }
  }, [paymentStatus, paymentId])

  async function handleFlutterwavePay() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/payments/flutterwave/initiate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, couponCode: couponResult ? couponCode.trim() : undefined }),
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
      const body: Record<string, unknown> = {
        planId: selectedPlan,
        method: selectedMethod,
        couponCode: couponResult ? couponCode.trim() : undefined,
      }
      if (selectedMethod !== 'web') {
        if (!phone.trim()) { setError('Please enter your mobile money phone number'); setLoading(false); return }
        body.phone = phone.trim()
      }
      const res = await fetch('/api/payments/initiate', {
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

  const plan            = PLANS[selectedPlan]
  const tier            = TIERS.find(t => t.id === selectedTier)!
  const selectedLocal   = LOCAL_METHODS.find(m => m.id === selectedMethod)
  const effectiveAmount = couponResult ? couponResult.discountedAmount : plan.amountUsd

  // ── Paid ────────────────────────────────────────────────────────────────────
  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center border border-green-100">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <CheckCircle2 className="text-white" size={44} />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            <Star size={12} fill="currentColor" /> {tier.name.toUpperCase()} ACTIVATED
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Welcome to {tier.name}! 🎉</h1>
          <p className="text-slate-500 mb-2">Payment confirmed. Your upgraded access is now active.</p>
          <p className="text-sm text-slate-400 mb-8">Your dashboard will reflect the upgrade immediately.</p>
          <button onClick={() => { 
              if (selectedPlan === 'ai_grade_report') {
                const subjectId = searchParams.get('subject')
                window.location.href = `/student/grade-report/${subjectId}`
              } else if (selectedPlan === 'subject_pack') {
                window.location.href = `/student/subjects`
              } else {
                window.location.href = '/student/dashboard'
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-2xl transition shadow-md shadow-green-200">
            {selectedPlan === 'ai_grade_report' ? 'View My Report →' : 'Continue to Dashboard →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting ─────────────────────────────────────────────────────────────────
  if (paymentStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-indigo-100">
          {selectedLocal && <div className="flex justify-center mb-5"><Logo src={selectedLocal.logoSrc} alt={selectedLocal.label} className="h-10 w-auto object-contain" /></div>}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200 animate-pulse">
            <Smartphone className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Phone</h1>
          <p className="text-slate-500 mb-6">
            A <strong>{selectedLocal?.label ?? 'mobile money'}</strong> request was sent to{' '}
            <strong className="text-slate-700">{phone || 'your number'}</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-left space-y-3">
            {[['📳','Your phone will vibrate with a payment prompt'],['🔢','Enter your mobile money PIN when asked'],['✅','This page updates automatically when confirmed']].map(([icon,text]) => (
              <div key={text} className="flex items-center gap-3"><span className="text-xl">{icon}</span><span className="text-sm text-slate-600">{text}</span></div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
            <Loader2 className="animate-spin" size={16} />
            <span>Waiting for confirmation{pollCount > 0 ? ` · ${pollCount * 5}s` : ''}…</span>
          </div>
          <button onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0) }}
            className="text-slate-400 hover:text-slate-600 text-sm underline underline-offset-2 transition">Cancel and try again</button>
        </div>
      </div>
    )
  }

  // ── Failed ──────────────────────────────────────────────────────────────────
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-red-100">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
            <XCircle className="text-white" size={44} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-slate-500 mb-8">{error || 'The payment was cancelled or timed out. Your account has not been charged.'}</p>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8">
            <p className="text-sm text-slate-600 font-medium">Having trouble paying?</p>
            <a 
              href="https://wa.me/263785170918" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 text-emerald-600 font-bold hover:underline"
            >
              WhatsApp us at +263785170918 and we&apos;ll help
            </a>
          </div>

          <button onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0); setError('') }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition mb-3 shadow-md">Try Again</button>
          <Link href="/student/dashboard" className="block text-slate-400 hover:text-slate-600 text-sm underline underline-offset-2">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  // ── Main page ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
          <Link href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition mb-6">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Zap size={12} fill="currentColor" /> ZIMLEARN PREMIUM PLANS
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Unlock Your Full<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                ZIMSEC Potential
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-xl mx-auto mb-5">
              Choose the plan that fits your study goals. All plans include full AI tutoring access.
            </p>
            {/* Annual savings callout */}
            <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 text-sm">
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <p className="text-emerald-300 font-bold text-sm">Save up to 42% with an annual plan</p>
                <p className="text-slate-400 text-xs">Pro yearly = $2.92/mo · Elite yearly = $5/mo · Choose billing period below</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">

        {/* ── One-time Item Summary (if applicable) ─────────────────────────── */}
        {(selectedPlan === 'ai_grade_report' || selectedPlan === 'subject_pack') && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-400 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {selectedPlan === 'ai_grade_report' ? '📄' : '📚'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">One-Time Addition</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  You are purchasing <strong>{PLANS[selectedPlan].label}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlan('pro_monthly')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Cancel ✕
              </button>
            </div>
            <div className="mt-4 bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700 flex items-center gap-2">
              <Star size={14} fill="currentColor" /> No monthly commitment. This is a one-time purchase.
            </div>
          </div>
        )}

        {/* ── Tier comparison cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map(t => {
            const isSelected = selectedTier === t.id
            const firstPlanId = t.planOptions[0]
            const firstPlan = PLANS[firstPlanId]
            const firstMeta = PLAN_META[firstPlanId]

            return (
              <button
                key={t.id}
                onClick={() => selectTier(t.id)}
                className={`relative rounded-2xl border-2 text-left transition-all duration-150 overflow-hidden ${
                  isSelected ? 'border-white/60 shadow-2xl scale-[1.02]' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Badge */}
                {t.badge && (
                  <div className={`absolute -top-px left-0 right-0 text-center py-1 text-[10px] font-bold text-white ${t.badgeBg}`}>
                    {t.badge}
                  </div>
                )}

                {/* Header */}
                <div className={`${t.headerBg} px-4 pt-${t.badge ? '6' : '4'} pb-4 text-white`}>
                  <div className={`flex items-center gap-2 mb-1 ${t.badge ? 'mt-3' : ''}`}>
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">{t.icon}</div>
                    <span className="font-bold text-sm">{t.name}</span>
                  </div>
                  <p className="text-white/70 text-xs">{t.tagline}</p>
                  <div className="mt-3">
                    <span className="text-2xl font-black">{firstMeta.perMonth}</span>
                    <span className="text-white/60 text-xs ml-1">/mo</span>
                  </div>
                  <p className="text-white/50 text-[10px] mt-0.5">from ${firstPlan.amountUsd.toFixed(2)} USD</p>
                </div>

                {/* Features */}
                <div className="bg-white/5 backdrop-blur-sm px-4 py-3 space-y-2">
                  {t.features.slice(0, 6).map(f => (
                    <div key={f.text} className="flex items-start gap-2">
                      {f.included
                        ? <Check size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={3} />
                        : <X size={13} className="text-slate-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      }
                      <span className={`text-xs leading-tight ${f.included ? 'text-slate-200' : 'text-slate-500'}`}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Select indicator */}
                {isSelected && (
                  <div className="bg-white/10 px-4 py-2 flex items-center justify-center gap-1.5">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check size={10} className="text-indigo-700" strokeWidth={3} />
                    </div>
                    <span className="text-xs text-white font-semibold">Selected</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Plan duration selector for selected tier ─────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Choose Billing Period — <span className={tier.color}>{tier.name}</span></h2>
            <p className="text-xs text-slate-400 mt-0.5">Longer plans save more. Cancel anytime.</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tier.planOptions.map(planId => {
              const p          = PLANS[planId]
              const meta       = PLAN_META[planId]
              const isSelected = selectedPlan === planId
              return (
                <button key={planId} onClick={() => { setSelectedPlan(planId); setCouponResult(null); setCouponError('') }}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                    isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}>
                  {meta.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      {meta.badge}
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
                    {meta.perMonth}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">{meta.period}</div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-sm font-bold text-indigo-600">${p.amountUsd.toFixed(2)} USD total</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Coupon / discount code ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Tag size={16} className="text-indigo-500" />
            <h2 className="font-bold text-slate-800">Have a Coupon Code?</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError('') }}
                onKeyDown={e => { if (e.key === 'Enter') applyCoupon() }}
                placeholder="e.g. ZIMLEARN50"
                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-mono tracking-widest focus:ring-0 focus:border-indigo-500 outline-none transition uppercase placeholder:normal-case placeholder:tracking-normal"
              />
              <button
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                {couponLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                Apply
              </button>
            </div>

            {couponError && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                <XCircle size={15} className="shrink-0" />
                {couponError}
              </div>
            )}

            {couponResult && couponResult.valid && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-800">Coupon applied!</p>
                  <p className="text-emerald-700 text-xs mt-0.5">{couponResult.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-700 font-bold text-sm">-${couponResult.savings.toFixed(2)}</p>
                  <p className="text-emerald-600 text-xs">saved</p>
                </div>
                <button
                  onClick={() => { setCouponResult(null); setCouponCode(''); setCouponError('') }}
                  className="ml-1 text-slate-400 hover:text-slate-600 transition"
                  title="Remove coupon"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Full feature list for selected tier ──────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">Everything in {tier.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tier.features.filter(f => f.included).map(({ text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-emerald-400" strokeWidth={3} />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment method ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Payment Method</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose how you want to pay</p>
          </div>

          {/* Gateway tabs */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button onClick={() => setGateway('local')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${gateway === 'local' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                🇿🇼 Zimbabwe
              </button>
              <button onClick={() => setGateway('international')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${gateway === 'international' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                🌍 International
              </button>
            </div>
          </div>

          {/* Zimbabwe methods */}
          {gateway === 'local' && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 font-medium">Select your mobile money provider</p>
              <div className="grid grid-cols-2 gap-3">
                {LOCAL_METHODS.map(m => {
                  const isSel = selectedMethod === m.id
                  return (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 min-h-[100px] ${isSel ? `${m.borderSelected} ${m.bgSelected} shadow-md` : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                      {isSel && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      <Logo src={m.logoSrc} alt={m.label} className="h-8 w-auto max-w-[100px] object-contain" />
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-700">{m.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.sublabel}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">Secured by</span>
                <Logo src="/logos/paynow.svg" alt="Paynow" className="h-5 w-auto object-contain opacity-70" />
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {selectedMethod !== 'web' && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    {selectedMethod === 'ecocash' ? 'EcoCash' : selectedMethod === 'onemoney' ? 'OneMoney' : 'InnBucks'} Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm pointer-events-none">🇿🇼 +263</span>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="77 123 4567"
                      className="w-full border-2 border-slate-200 rounded-xl pl-20 pr-4 py-3 text-slate-800 text-sm focus:ring-0 focus:border-indigo-500 outline-none transition" />
                  </div>
                  <p className="text-xs text-slate-400">You&apos;ll receive a USSD prompt on this number to approve the payment</p>
                </div>
              )}

              {selectedMethod === 'web' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                  <Logo src="/logos/zimswitch.svg" alt="ZimSwitch" className="h-7 w-auto object-contain flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">ZimSwitch / Internet Banking</p>
                    <p className="text-xs text-slate-500 mt-0.5">You&apos;ll be redirected to Paynow&apos;s secure checkout. Supports all major Zimbabwean bank cards.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* International methods */}
          {gateway === 'international' && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 font-medium">Pay with card or digital wallet</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CARD_METHODS.map(({ src, alt }) => (
                  <div key={alt} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition min-h-[80px]">
                    <Logo src={src} alt={alt} className="h-7 w-auto object-contain" />
                    <span className="text-[10px] font-medium text-slate-500">{alt}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">Powered by</span>
                <Logo src="/logos/flutterwave.svg" alt="Flutterwave" className="h-5 w-auto object-contain opacity-80" />
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <Shield size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">256-bit SSL Encrypted Checkout</p>
                  <p className="text-xs text-slate-400 mt-0.5">You&apos;ll be redirected to Flutterwave&apos;s secure hosted page. No card data is stored on ZimLearn.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Order summary + pay button ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900">{tier.name} — {plan.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{plan.description}</div>
              </div>
              <div className="text-right">
                {couponResult && couponResult.valid && (
                  <div className="text-sm text-slate-400 line-through">${plan.amountUsd.toFixed(2)}</div>
                )}
                <div className={`text-2xl font-black ${couponResult && couponResult.valid ? 'text-emerald-600' : 'text-slate-900'}`}>
                  ${effectiveAmount.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">USD</div>
              </div>
            </div>
            {couponResult && couponResult.valid && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium flex items-center gap-1"><Tag size={11} /> {couponCode}</span>
                <span className="text-emerald-700 font-bold">-${couponResult.savings.toFixed(2)} saved</span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            {error && (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                  <XCircle size={16} className="mt-0.5 shrink-0" />{error}
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-600 font-medium">Having trouble? <a href="https://wa.me/263785170918" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">WhatsApp us at +263785170918</a></p>
                </div>
              </div>
            )}

            {gateway === 'international' ? (
              <button onClick={handleFlutterwavePay} disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-orange-100 flex items-center justify-center gap-3">
                {loading
                  ? <><Loader2 size={20} className="animate-spin" /> Redirecting to checkout…</>
                  : <><Logo src="/logos/flutterwave.svg" alt="Flutterwave" className="h-5 w-auto object-contain brightness-0 invert" /> Pay ${effectiveAmount.toFixed(2)} USD</>
                }
              </button>
            ) : selectedMethod === 'web' ? (
              <button onClick={handlePay} disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-3">
                {loading ? <><Loader2 size={20} className="animate-spin" /> Redirecting…</> : <>Pay ${effectiveAmount.toFixed(2)} via Paynow</>}
              </button>
            ) : (
              <button onClick={handlePay} disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-3">
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Sending request…</>
                ) : (
                  <><Logo src={selectedLocal?.logoSrc ?? '/logos/ecocash.png'} alt={selectedLocal?.label ?? 'Pay'} className="h-6 w-auto object-contain brightness-0 invert" /> Send ${effectiveAmount.toFixed(2)} Payment Request</>
                )}
              </button>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><Lock size={11} className="text-green-500" /> Secure payment</div>
              <div className="w-px h-3 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><Shield size={11} className="text-green-500" /> No card data stored</div>
              <div className="w-px h-3 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><CheckCircle2 size={11} className="text-green-500" /> Cancel anytime</div>
            </div>
          </div>
        </div>

        {/* ── Exam Bootcamp passes ─────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📅</span>
            <h3 className="font-bold text-white text-base">Exam Bootcamp Passes</h3>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">ZIMSEC Season</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Short-term Pro access for the weeks before exams. No subscription commitment.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['bootcamp_2week', 'bootcamp_4week'] as PlanId[]).map(planId => {
              const p = PLANS[planId]
              const meta = PLAN_META[planId]
              return (
                <button key={planId}
                  onClick={() => { setSelectedTier('pro'); setSelectedPlan(planId) }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === planId ? 'border-rose-400 bg-rose-500/10' : 'border-white/10 hover:border-white/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm">{p.label}</p>
                    {meta.badge && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">{meta.badge}</span>}
                  </div>
                  <p className="text-xl font-extrabold text-rose-300">${p.amountUsd.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{meta.period}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── School licensing CTA ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-white text-sm mb-0.5">Are you a headmaster or teacher?</p>
            <p className="text-xs text-slate-300">Get ZimLearn for your entire school from $50/month — less than $0.40 per student. Includes teacher tools, admin dashboard, and parent visibility.</p>
          </div>
          <Link href="/schools"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition whitespace-nowrap">
            School Licensing <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  )
}
