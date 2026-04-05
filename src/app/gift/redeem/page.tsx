'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Gift, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function RedeemInner() {
  const params = useSearchParams()
  const [code, setCode] = useState(params.get('code') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [grantedTier, setGrantedTier] = useState('')

  async function handleRedeem() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Redemption failed'); return }
      setGrantedTier(data.tier ?? 'pro')
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gift Activated! 🎉</h2>
        <p className="text-gray-500 mb-6">Your <strong className="text-indigo-600 capitalize">{grantedTier}</strong> plan is now active. Go start learning!</p>
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-green-600 transition shadow-lg"
        >
          Start Learning →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Gift size={30} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Redeem Your Gift</h1>
        <p className="text-gray-400 mt-1 text-sm">Enter your gift code to activate your ZimLearn plan</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Gift Code</label>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABCD1234EFGH"
          maxLength={12}
          className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-center font-mono text-2xl font-black tracking-widest text-indigo-700 focus:border-indigo-500 outline-none transition placeholder:text-gray-200 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <button
        onClick={handleRedeem}
        disabled={loading || code.length < 8}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50 text-white font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Activating…</> : 'Activate Gift →'}
      </button>

      <p className="text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
          Sign up first →
        </Link>
      </p>
    </div>
  )
}

export default function RedeemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <Suspense>
          <RedeemInner />
        </Suspense>
      </div>
    </div>
  )
}
