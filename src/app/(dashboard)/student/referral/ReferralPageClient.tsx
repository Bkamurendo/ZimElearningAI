'use client'

import { useState } from 'react'
import { Copy, Check, Gift, Users, Share2 } from 'lucide-react'
import Link from 'next/link'

interface ReferralPageClientProps {
  referralCode: string
  referralCount: number
  converted: number
  creditsEarned: number
}

export default function ReferralPageClient({
  referralCode,
  referralCount,
  converted,
  creditsEarned,
}: ReferralPageClientProps) {
  const [copied, setCopied] = useState(false)
  const referralLink = `https://zim-elearningai.co.zw/register?ref=${referralCode}`
  const whatsappText = `Hey! I've been using ZimLearn AI to study for ZIMSEC and it's amazing 🎓. Get AI tutoring, past papers, and more. Use my link for a free trial: ${referralLink}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-4 py-10">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Gift size={14} />
            Referral Programme
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Earn Free Months</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Share ZimLearn with friends. When they upgrade to a paid plan, you get <strong>1 month free</strong> — automatically.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Friends Referred', value: referralCount, color: 'text-blue-600' },
            { label: 'Upgraded to Paid', value: converted, color: 'text-emerald-600' },
            { label: 'Free Months Earned', value: creditsEarned, color: 'text-purple-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={16} className="text-indigo-500" />
            <h2 className="font-bold text-gray-900 text-sm">Your Referral Link</h2>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
            <span className="flex-1 text-sm text-gray-600 truncate font-mono">{referralLink}</span>
            <button
              onClick={copy}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>

          {/* Or your code */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or share your code</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-5 py-3">
            <span className="text-xs text-gray-500 font-medium">Your referral code</span>
            <span className="font-black text-indigo-700 text-xl tracking-widest font-mono">{referralCode}</span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] hover:bg-[#20bb5a] text-white font-bold rounded-2xl transition shadow-lg shadow-green-200 text-sm"
          >
            <span className="text-xl">💬</span>
            Share via WhatsApp
          </a>

          <button
            onClick={copy}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-2xl transition text-sm"
          >
            <Copy size={15} />
            Copy Link to Share
          </button>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your referral link to friends via WhatsApp, SMS, or social media.' },
              { step: '2', title: 'Friend signs up', desc: 'They register using your link. Their account is linked to yours.' },
              { step: '3', title: 'They upgrade', desc: 'When your friend upgrades to any paid plan, you automatically get 1 free month.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Free months are applied to your next renewal. No limit on referrals.
        </p>

        <div className="text-center">
          <Link href="/student/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
