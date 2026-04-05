'use client'

import { useState, useEffect } from 'react'
import { X, Zap, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TrialStatusBannerProps {
  trialEndsAt: string | null
  plan: string
}

export default function TrialStatusBanner({ trialEndsAt, plan }: TrialStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Don't show for paid plans or if no trial
  if (!trialEndsAt || plan !== 'free') return null

  const now = new Date()
  const expiryDate = new Date(trialEndsAt)
  const msLeft = expiryDate.getTime() - now.getTime()
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
  const isExpired = msLeft <= 0

  // Decide urgency level
  const urgency: 'expired' | 'critical' | 'warning' | 'notice' =
    isExpired ? 'expired' :
    daysLeft <= 1 ? 'critical' :
    daysLeft <= 3 ? 'warning' : 'notice'

  // Don't show the low-urgency notice if dismissed this session
  if (dismissed && urgency === 'notice') return null

  // Critical and above are always shown (can't dismiss)
  const canDismiss = urgency === 'notice'

  const config = {
    expired: {
      bg: 'bg-red-600',
      border: 'border-red-700',
      icon: <AlertTriangle size={16} className="flex-shrink-0" />,
      text: 'Your free trial has ended.',
      detail: 'AI tutoring is now limited to 3 questions/day. Upgrade to restore full access.',
      cta: 'Upgrade Now',
      ctaStyle: 'bg-white text-red-700 hover:bg-red-50',
    },
    critical: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      icon: <AlertTriangle size={16} className="flex-shrink-0" />,
      text: `Trial ends ${daysLeft <= 0 ? 'today' : 'tomorrow'}!`,
      detail: 'This is your last chance to upgrade and keep full access.',
      cta: 'Upgrade Now',
      ctaStyle: 'bg-white text-red-600 hover:bg-red-50',
    },
    warning: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      icon: <Clock size={16} className="flex-shrink-0" />,
      text: `Trial ends in ${daysLeft} days.`,
      detail: 'Unlock unlimited AI tutoring, past papers, and grade predictions.',
      cta: 'View Plans',
      ctaStyle: 'bg-white text-amber-700 hover:bg-amber-50',
    },
    notice: {
      bg: 'bg-blue-600',
      border: 'border-blue-700',
      icon: <Zap size={16} className="flex-shrink-0" />,
      text: `${daysLeft} days left in your free trial.`,
      detail: 'Upgrade from just $2/month to keep full access after your trial.',
      cta: 'See Plans',
      ctaStyle: 'bg-white text-blue-700 hover:bg-blue-50',
    },
  }[urgency]

  return (
    <div
      className={`${config.bg} border-b ${config.border} text-white`}
      role="alert"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        {config.icon}
        <p className="text-sm font-medium flex-1 min-w-0">
          <span className="font-bold">{config.text}</span>{' '}
          <span className="opacity-90 hidden sm:inline">{config.detail}</span>
        </p>
        <Link
          href="/student/upgrade"
          className={`${config.ctaStyle} flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0`}
        >
          {config.cta}
          <ChevronRight size={12} />
        </Link>
        {canDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Extra expired feature-loss message */}
      {urgency === 'expired' && (
        <div className="bg-red-700/50 border-t border-red-700 px-4 py-2">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-4 text-xs text-red-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
              AI Tutor: 3 questions/day limit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
              Past Papers: locked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
              Grade Predictions: disabled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 flex-shrink-0" />
              AI Workspace: disabled
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
