'use client'

import { useState } from 'react'
import { GraduationCap, Shield, Bell, BarChart3, Star, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ParentUpgradeMonitoringPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/paynow/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'parent_monitoring_monthly' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate payment')
        return
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="font-black text-2xl text-gray-900 tracking-tight">ZimLearn</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Star size={12} fill="currentColor" /> Parent Premium
            </div>
            <h1 className="text-2xl font-bold mb-2">Upgrade to Premium Monitoring</h1>
            <p className="text-indigo-100 text-sm">Empower your child's ZIMSEC journey with data</p>
          </div>

          <div className="p-8">
            <div className="space-y-6 mb-8">
              {[
                { icon: Bell, title: 'Weekly Progress Reports', desc: 'Detailed PDF summary sent to your email and SMS every Sunday.' },
                { icon: BarChart3, title: 'Granular Activity Logs', desc: 'See exactly which topics your child is struggling with and their quiz answers.' },
                { icon: Shield, title: 'Priority Parent Support', desc: 'Get direct access to our support team for any educational queries.' },
              ].map((feat, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <feat.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{feat.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-700">Premium Monitoring</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900">$3</span>
                  <span className="text-xs text-gray-400 font-medium"> / mo</span>
                </div>
              </div>
              <div className="space-y-2">
                {['Unlimited child linking', 'Real-time activity feed', 'Cancel anytime'].map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 size={14} className="text-emerald-500" /> {p}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-800 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Upgrade Now for $3 USD <ArrowRight size={18} /></>}
            </button>

            <p className="text-center text-[10px] text-gray-400 mt-6">
              Secure payment via Paynow (EcoCash, Card, InnBucks)
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/parent/children" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            ← Back to My Children
          </Link>
        </div>
      </div>
    </div>
  )
}
