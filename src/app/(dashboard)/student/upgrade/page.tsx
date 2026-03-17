'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap, CheckCircle2, XCircle, Loader2, ChevronLeft,
  Smartphone, Globe, Star, Clock, Infinity,
} from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/paynow'

// ── Feature comparison ────────────────────────────────────────────────────────

const FREE_FEATURES = [
  '10 AI requests per day',
  'AI Tutor (limited)',
  'Past papers access',
  'Basic study notes',
]

const PRO_FEATURES = [
  'Unlimited AI requests',
  'AI Tutor — full sessions',
  'Model answers for every paper',
  'Snap notes, glossary, practice questions',
  'Teaching guide generation',
  'Priority AI (faster responses)',
  'All future features included',
]

// ── Plan cards data ────────────────────────────────────────────────────────────

const PLAN_OPTIONS: { id: PlanId; badge?: string }[] = [
  { id: 'pro_monthly' },
  { id: 'pro_quarterly', badge: 'Save 20%' },
  { id: 'pro_yearly', badge: 'Save 42%' },
]

type PaymentMethod = 'ecocash' | 'onemoney' | 'innbucks' | 'web'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; description: string }[] = [
  { id: 'ecocash',  label: 'EcoCash',   icon: '🟢', description: 'USSD push to your EcoCash number' },
  { id: 'onemoney', label: 'OneMoney',  icon: '🔵', description: 'USSD push to your NetOne number' },
  { id: 'innbucks', label: 'InnBucks',  icon: '🟠', description: 'Pay with InnBucks wallet' },
  { id: 'web',      label: 'ZimSwitch / Bank', icon: '🏦', description: 'ZimSwitch card or internet banking (Paynow)' },
]

// Payment gateway tabs
type Gateway = 'local' | 'international'

// ── Component ─────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro_monthly')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('ecocash')
  const [gateway, setGateway] = useState<Gateway>('local')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // After payment
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'paid' | 'failed'>('idle')
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Handle redirect back from Paynow (?status=return) or Flutterwave (?flw=paid|failed|cancelled)
  useEffect(() => {
    const status = searchParams.get('status')
    const flw = searchParams.get('flw')

    if (status === 'return') {
      setPaymentStatus('waiting')
    } else if (flw === 'paid') {
      setPaymentStatus('paid')
    } else if (flw === 'failed' || flw === 'cancelled' || flw === 'error') {
      setPaymentStatus('failed')
      setError(
        flw === 'cancelled'
          ? 'Payment was cancelled. You can try again below.'
          : 'Payment failed or could not be verified. Please try again.'
      )
    }
  }, [searchParams])

  // Poll every 5s when waiting for mobile money confirmation
  useEffect(() => {
    if (paymentStatus !== 'waiting' || !paymentId) return

    const poll = async () => {
      setPollCount(c => c + 1)
      try {
        const res = await fetch(`/api/payments/poll?paymentId=${paymentId}`)
        const data = await res.json()
        if (data.status === 'paid') {
          setPaymentStatus('paid')
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setPaymentStatus('failed')
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch { /* network blip — keep polling */ }
    }

    poll() // immediate first poll
    pollRef.current = setInterval(poll, 5000)

    // Stop after 10 minutes
    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      setPaymentStatus('failed')
    }, 10 * 60 * 1000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      clearTimeout(timeout)
    }
  }, [paymentStatus, paymentId])

  // ── Flutterwave (international card / Google Pay / Apple Pay) ─────────────
  async function handleFlutterwavePay() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/flutterwave/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      })

      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {
        setError(`Server error (${res.status}) — please try again`)
        return
      }

      if (!res.ok) {
        setError(String(data.error ?? `Error ${res.status} — please try again`))
        return
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink as string
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Paynow (local mobile money / ZimSwitch) ───────────────────────────────
  async function handlePay() {
    setError('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        planId: selectedPlan,
        method: selectedMethod,
      }

      if (selectedMethod !== 'web') {
        if (!phone.trim()) {
          setError('Please enter your mobile money phone number')
          setLoading(false)
          return
        }
        body.phone = phone.trim()
      }

      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // Parse response — may fail if server returns non-JSON (e.g. 500 HTML)
      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        setError(`Server error (${res.status}) — please try again`)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(String(data.error ?? `Error ${res.status} — please try again`))
        setLoading(false)
        return
      }

      if (selectedMethod === 'web' && data.redirectUrl) {
        // Redirect to Paynow hosted checkout
        window.location.href = data.redirectUrl as string
        return
      }

      // Mobile money — show waiting screen
      setPaymentId(data.paymentId as string)
      setPaymentStatus('waiting')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Network error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Paid ──────────────────────────────────────────────────────────────────

  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&rsquo;re now Pro! 🎉</h1>
          <p className="text-slate-500 mb-8">
            Payment confirmed. Unlimited AI access is now unlocked on your account.
          </p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting for mobile money ──────────────────────────────────────────────

  if (paymentStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Smartphone className="text-indigo-500" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Phone</h1>
          <p className="text-slate-500 mb-4">
            A payment request has been sent to <strong>{phone || 'your phone'}</strong>.
            Approve the prompt on your phone to complete payment.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 text-left space-y-1">
            <div className="flex items-center gap-2"><span>📱</span><span>Open your EcoCash / mobile money app</span></div>
            <div className="flex items-center gap-2"><span>🔢</span><span>Enter your PIN when prompted</span></div>
            <div className="flex items-center gap-2"><span>✅</span><span>This page will update automatically</span></div>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
            <Loader2 className="animate-spin" size={16} />
            <span>Waiting for confirmation{pollCount > 0 ? ` (${pollCount})` : ''}…</span>
          </div>

          <button
            onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0) }}
            className="text-slate-400 hover:text-slate-600 text-sm underline transition"
          >
            Cancel and try again
          </button>
        </div>
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-slate-500 mb-8">
            The payment was cancelled or timed out. Your account has not been charged.
          </p>
          <button
            onClick={() => { setPaymentStatus('idle'); setPaymentId(null); setPollCount(0); setError('') }}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition mb-3"
          >
            Try Again
          </button>
          <Link href="/student/dashboard" className="block text-slate-400 hover:text-slate-600 text-sm underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Main upgrade page ─────────────────────────────────────────────────────

  const plan = PLANS[selectedPlan]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm transition mb-4"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold">Upgrade to Pro</h1>
          </div>
          <p className="text-indigo-200 text-sm">
            Unlock unlimited AI-powered study tools for your ZIMSEC exams
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Free vs Pro comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-slate-500" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Free Plan</div>
                <div className="text-xs text-slate-400">Current plan</div>
              </div>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={15} className="text-slate-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-yellow-300" />
              </div>
              <div>
                <div className="font-semibold">Pro Plan</div>
                <div className="text-xs text-indigo-200">Everything, unlimited</div>
              </div>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-indigo-100">
                  <CheckCircle2 size={15} className="text-green-300 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Plan selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Infinity size={18} className="text-indigo-500" />
            Choose Your Plan
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {PLAN_OPTIONS.map(({ id, badge }) => {
              const p = PLANS[id]
              const isSelected = selectedPlan === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedPlan(id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {badge && (
                    <span className="absolute -top-2.5 left-3 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                  <div className="font-semibold text-slate-800 text-sm">{p.label}</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">
                    ${p.amountUsd.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {id === 'pro_monthly' ? '/month' : id === 'pro_quarterly' ? '/3 months' : '/year'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Payment method — gateway tabs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Smartphone size={18} className="text-indigo-500" />
            Payment Method
          </h2>

          {/* Gateway tabs */}
          <div className="flex gap-2 mb-5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setGateway('local')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                gateway === 'local'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🇿🇼 Zimbabwe (EcoCash)
            </button>
            <button
              onClick={() => setGateway('international')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                gateway === 'international'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🌍 International (Card)
            </button>
          </div>

          {/* Local — Paynow methods */}
          {gateway === 'local' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {PAYMENT_METHODS.map(m => {
                  const isSelected = selectedMethod === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{m.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{m.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{m.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Phone number input — mobile money only */}
              {selectedMethod !== 'web' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {selectedMethod === 'ecocash' ? 'EcoCash' :
                     selectedMethod === 'onemoney' ? 'NetOne/OneMoney' : 'InnBucks'} Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className="w-full sm:w-72 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    A payment request will be sent to this number via USSD
                  </p>
                </div>
              )}
            </>
          )}

          {/* International — Flutterwave */}
          {gateway === 'international' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">💳</span>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Visa / Mastercard</div>
                  <div className="text-xs text-slate-500 mt-0.5">Also supports Google Pay &amp; Apple Pay on compatible devices</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <span>💳</span> Visa / Mastercard
                </span>
                <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <span>🍎</span> Apple Pay
                </span>
                <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <span>🔵</span> Google Pay
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Powered by Flutterwave — you&apos;ll be redirected to a secure checkout page.
              </p>
            </div>
          )}
        </div>

        {/* Pay button + error */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          {/* Order summary */}
          <div className="flex items-center justify-between text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
            <span>{plan.label}</span>
            <span className="font-bold text-lg text-slate-900">${plan.amountUsd.toFixed(2)} USD</span>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {gateway === 'international' ? (
            <button
              onClick={handleFlutterwavePay}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Redirecting…</>
              ) : (
                <><Globe size={20} /> Pay ${plan.amountUsd.toFixed(2)} — Card / Google Pay / Apple Pay</>
              )}
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Processing…</>
              ) : selectedMethod === 'web' ? (
                <><Globe size={20} /> Pay ${plan.amountUsd.toFixed(2)} via Paynow</>
              ) : (
                <><Smartphone size={20} /> Send ${plan.amountUsd.toFixed(2)} Payment Request</>
              )}
            </button>
          )}

          <p className="text-xs text-slate-400 text-center mt-3">
            {gateway === 'international'
              ? 'Secured by Flutterwave. No card data stored on this platform.'
              : 'Payments processed securely by Paynow Zimbabwe. No card data stored.'}
          </p>
        </div>

      </div>
    </div>
  )
}
