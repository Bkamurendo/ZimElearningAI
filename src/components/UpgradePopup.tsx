'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Sparkles, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type DisplayMode = 'none' | 'welcome' | 'trial_ending' | 'nudge'

export function UpgradePopup() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none')
  const [userName, setUserName] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, plan, trial_ends_at, created_at')
          .eq('id', session.user.id)
          .single()

        if (!profile) return

        // If they already upgraded to a paid plan, never show
        if (profile.plan && profile.plan !== 'free') return

        setUserName(profile.full_name?.split(' ')[0] || 'Student')

        const now = new Date()
        const createdAt = new Date(profile.created_at)
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

        // Case A: New User Welcome (within first 24h, shown exactly once ever)
        if (hoursSinceCreation < 24) {
          const seenWelcome = localStorage.getItem('seen_welcome_popup')
          if (!seenWelcome) {
            setDisplayMode('welcome')
            setIsVisible(true)
            return
          }
        }

        // Case B & C rely on checking standard frequency timers
        const lastSeenStr = localStorage.getItem('last_upgrade_popup')
        const lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0
        const hoursSinceLastSeen = (now.getTime() - lastSeen) / (1000 * 60 * 60)

        if (profile.trial_ends_at) {
          const trialEnds = new Date(profile.trial_ends_at)
          const daysToTrialEnd = (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

          // Case B: Trial Ending Soon (< 3 days). Show max once every 24h
          if (daysToTrialEnd > 0 && daysToTrialEnd <= 3) {
            if (hoursSinceLastSeen > 24) {
              setDisplayMode('trial_ending')
              setIsVisible(true)
              return
            }
          }

          // Case C: Standard free user (expired or far away). Show max once every 7 days (168 hours)
          if (daysToTrialEnd <= 0) {
            if (hoursSinceLastSeen > 168) {
              setDisplayMode('nudge')
              setIsVisible(true)
            }
          }
        } else {
          // No trial ends at set, treat as standard free user
          if (hoursSinceLastSeen > 168) {
            setDisplayMode('nudge')
            setIsVisible(true)
          }
        }

      } catch (err) {
        console.error('UpgradePopup error:', err)
      }
    }

    // Delay slightly so it doesn't interrupt immediate initial paint layout
    const timer = setTimeout(checkStatus, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    if (displayMode === 'welcome') {
      localStorage.setItem('seen_welcome_popup', 'true')
    } else {
      localStorage.setItem('last_upgrade_popup', Date.now().toString())
    }
  }

  if (displayMode === 'none' || !isVisible) return null

  // Configuration for different popup variants
  const content = {
    welcome: {
      tag: 'WELCOME',
      title: 'Accelerate your learning!',
      desc: 'You have restricted access. Upgrade your account today to unlock full AI tutoring, premium quizzes, past papers, and more.',
      buttonText: 'View Pro Plans',
    },
    trial_ending: {
      tag: 'TRIAL EXPIRING',
      title: 'Don\'t lose your progress!',
      desc: 'Your free trial is ending very soon. Upgrade to a premium plan now to continue accessing all your study materials uninterrupted.',
      buttonText: 'Upgrade Now',
    },
    nudge: {
      tag: 'PREMIUM',
      title: 'Ready to score an A?',
      desc: 'Free accounts are limited. Unlock comprehensive AI lesson plans, 24/7 AI tutor chat, and deep analytics by switching to a Pro plan.',
      buttonText: 'Unlock Premium',
    }
  }

  const contentItem = content[displayMode as keyof typeof content]
  if (!contentItem) return null

  const { tag, title, desc, buttonText } = contentItem

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        
        {/* Modal Card */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border border-white/20">
          
          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-slate-700 transition"
          >
            <X size={18} />
          </button>

          {/* Top Banner Area */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 text-center relative overflow-hidden">
            {/* Soft background shape */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4 backdrop-blur-md">
                <Sparkles size={14} /> {tag}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
                {title}
              </h2>
              <p className="text-emerald-50 font-medium text-sm sm:text-base px-2">
                Hi {userName}, {desc.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Bottom Content Area */}
          <div className="p-6 sm:p-8 bg-white">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 text-center">
              What you get with Pro:
            </h3>
            
            <div className="space-y-3 mb-8">
              {[
                'Unlimited AI Tutor questions',
                'ZIMSEC Past Papers & Marking Schemes',
                'Step-by-step math and science solutions',
                'Advanced personalized learning analytics'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 font-medium leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/pricing"
                onClick={() => setIsVisible(false)}
                className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl text-center transition-colors shadow-md hover:shadow-lg"
              >
                {buttonText}
              </Link>
              <button 
                onClick={handleDismiss}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-center transition-colors"
              >
                Maybe Later
              </button>
            </div>
            
            {displayMode === 'welcome' && (
              <p className="text-center text-xs text-slate-400 mt-5 font-medium">
                P.S. Use code <span className="text-emerald-600 font-bold">ZIMLEARN</span> at checkout for a surprise!
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
