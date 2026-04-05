'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Gift, Heart, Globe, CheckCircle2, Loader2, ArrowRight, Star, Crown, Zap } from 'lucide-react'

const GIFT_OPTIONS = [
  {
    id: 'starter_monthly',
    tier: 'starter',
    label: 'Starter — 1 Month',
    price: 2,
    days: 30,
    color: 'border-blue-300',
    selectedColor: 'border-blue-500 bg-blue-50',
    headerBg: 'from-blue-500 to-blue-700',
    icon: <Zap size={18} className="text-blue-500" />,
    perks: ['100 AI questions/day', 'Study planner', 'Past papers'],
    popular: false,
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    label: 'Pro Scholar — 1 Month',
    price: 5,
    days: 30,
    color: 'border-indigo-300',
    selectedColor: 'border-indigo-600 bg-indigo-50',
    headerBg: 'from-indigo-600 to-purple-600',
    icon: <Star size={18} className="text-indigo-500" fill="currentColor" />,
    perks: ['Unlimited AI tutoring', 'All ZIMSEC past papers', 'Mock exam generator'],
    popular: true,
  },
  {
    id: 'pro_quarterly',
    tier: 'pro',
    label: 'Pro Scholar — 3 Months',
    price: 12,
    days: 90,
    color: 'border-indigo-300',
    selectedColor: 'border-indigo-600 bg-indigo-50',
    headerBg: 'from-indigo-600 to-purple-600',
    icon: <Star size={18} className="text-indigo-500" fill="currentColor" />,
    perks: ['Everything in Pro', '3-month commitment', 'Save 20% vs monthly'],
    popular: false,
    badge: 'Save 20%',
  },
  {
    id: 'pro_yearly',
    tier: 'pro',
    label: 'Pro Scholar — 1 Year',
    price: 35,
    days: 365,
    color: 'border-indigo-300',
    selectedColor: 'border-indigo-600 bg-indigo-50',
    headerBg: 'from-indigo-600 to-purple-600',
    icon: <Star size={18} className="text-indigo-500" fill="currentColor" />,
    perks: ['Full year of learning', 'Best value for money', 'Save 42% vs monthly'],
    popular: false,
    badge: 'Best Value',
  },
  {
    id: 'elite_yearly',
    tier: 'elite',
    label: 'Elite — 1 Year',
    price: 60,
    days: 365,
    color: 'border-amber-300',
    selectedColor: 'border-amber-500 bg-amber-50',
    headerBg: 'from-amber-500 to-orange-500',
    icon: <Crown size={18} className="text-amber-500" />,
    perks: ['Advanced AI model', 'Parent dashboard', 'Priority support'],
    popular: false,
    badge: 'Ultimate Gift',
  },
]

type Step = 'select' | 'details' | 'pay' | 'success'

export default function GiftPage() {
  const [step, setStep] = useState<Step>('select')
  const [selectedGift, setSelectedGift] = useState(GIFT_OPTIONS[1])
  const [form, setForm] = useState({
    purchaserName: '',
    purchaserEmail: '',
    recipientEmail: '',
    giftMessage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [giftCode, setGiftCode] = useState('')

  async function handlePay() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/gift/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedGift.id,
          purchaserName: form.purchaserName,
          purchaserEmail: form.purchaserEmail,
          recipientEmail: form.recipientEmail || null,
          giftMessage: form.giftMessage || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Payment failed'); return }
      if (data.paymentLink) {
        window.location.href = data.paymentLink
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <Gift size={44} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gift Sent! 🎉</h1>
          <p className="text-gray-500 mb-6">Your gift has been delivered. The student will receive an email with instructions to activate their ZimLearn {selectedGift.tier} plan.</p>
          {giftCode && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Gift Code (share this if needed)</p>
              <p className="font-mono text-2xl font-black text-indigo-600 tracking-widest">{giftCode}</p>
            </div>
          )}
          <Link href="/" className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-green-600 transition">
            Back to ZimLearn
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">ZimLearn</span>
          </Link>
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <Globe size={14} className="text-emerald-500" />
            Gift from anywhere in the world
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Heart size={13} fill="currentColor" /> Gift a ZimLearn Subscription
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 leading-tight">
            Invest in a student's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">ZIMSEC success</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-base">
            Gift a Zimbabwean student access to AI tutoring, ZIMSEC past papers, and personalised study plans — 
            from anywhere in the world, in minutes. Pay with Visa, Mastercard, Google Pay.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['select', 'details', 'pay'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-indigo-600 text-white' :
                ['select','details','pay'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {['select','details','pay'].indexOf(step) > i ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step === s ? 'text-indigo-600' : 'text-gray-400'}`}>
                {s === 'select' ? 'Choose Gift' : s === 'details' ? 'Your Details' : 'Pay Securely'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select gift */}
        {step === 'select' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Choose a gift</h2>
            {GIFT_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedGift(option)}
                className={`relative w-full text-left p-5 border-2 rounded-2xl transition-all ${
                  selectedGift.id === option.id ? option.selectedColor : option.color + ' bg-white hover:bg-gray-50'
                }`}
              >
                {option.popular && (
                  <span className="absolute -top-3 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    ⭐ Most Popular Gift
                  </span>
                )}
                {option.badge && !option.popular && (
                  <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    {option.badge}
                  </span>
                )}
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-gray-900">{option.label}</span>
                      <span className="font-black text-gray-900 text-xl">${option.price}<span className="text-sm font-normal text-gray-400"> USD</span></span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {option.perks.map(p => (
                        <span key={p} className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-500" /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ml-2 ${
                    selectedGift.id === option.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {selectedGift.id === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => setStep('details')}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-2"
            >
              Continue — Gift ${selectedGift.price} USD <ArrowRight size={16} />
            </button>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-400 pt-2">
              <span className="flex items-center gap-1.5">🔒 SSL encrypted</span>
              <span className="flex items-center gap-1.5">💳 Visa · Mastercard · Google Pay</span>
              <span className="flex items-center gap-1.5">🌍 Pay from any country</span>
            </div>
          </div>
        )}

        {/* Step 2: Gifter & recipient details */}
        {step === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Your details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Your Name *</label>
                <input
                  required value={form.purchaserName}
                  onChange={e => setForm(f => ({ ...f, purchaserName: e.target.value }))}
                  placeholder="e.g. Tafadzwa Moyo"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Your Email *</label>
                <input
                  required type="email" value={form.purchaserEmail}
                  onChange={e => setForm(f => ({ ...f, purchaserEmail: e.target.value }))}
                  placeholder="you@gmail.com"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Student's Email <span className="text-gray-400 normal-case font-normal">(optional — we'll email them the gift code)</span>
              </label>
              <input
                type="email" value={form.recipientEmail}
                onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))}
                placeholder="student@example.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">If you leave this blank, we'll send the code to your email instead — you can forward it yourself.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Personal Message <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={form.giftMessage}
                onChange={e => setForm(f => ({ ...f, giftMessage: e.target.value }))}
                rows={3}
                placeholder="e.g. Study hard, I believe in you! — Uncle Tendai 🇿🇼"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-bold text-indigo-900">{selectedGift.label}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{selectedGift.days} days of {selectedGift.tier} access</p>
              </div>
              <p className="text-2xl font-black text-indigo-700">${selectedGift.price}</p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep('select')} className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold rounded-2xl transition text-sm">
                ← Back
              </button>
              <button
                onClick={handlePay}
                disabled={loading || !form.purchaserName || !form.purchaserEmail}
                className="flex-2 flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <>Pay ${selectedGift.price} USD <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} ZimLearn · Built for Zimbabwe's students</p>
        <p className="mt-1">Payments secured by Flutterwave · SSL encrypted</p>
      </footer>
    </div>
  )
}
