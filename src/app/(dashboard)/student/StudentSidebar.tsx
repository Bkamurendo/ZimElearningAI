'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, TrendingUp, CalendarCheck, LogOut,
  Flame, X, Calculator, Moon, Sun,
  Search, Bookmark, Trophy, Bell, MessageSquare, BookOpen, Zap, Settings, User, Library,
  ClipboardList, FileText, Layers, Bot, Sparkles, CalendarDays, FlaskConical, Crown,
  Accessibility, Gift, Users, AlertTriangle, ChevronDown, ChevronRight, Lock, Package,
  Target,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'
import { AccessibilityControls, A11yProvider } from '@/components/AccessibilityControls'

// ── Navigation ─────────────────────────────────────────────────────────────────

const CORE_ITEMS = [
  { href: '/student/dashboard',          label: 'Dashboard',         icon: LayoutDashboard, badge: null },
  { href: '/student/subjects',           label: 'My Subjects',       icon: BookOpen,        badge: null },
  { href: '/student/ai-teacher',         label: 'MaFundi AI',        icon: Bot,             badge: null },
  { href: '/student/progress',           label: 'My Progress',       icon: TrendingUp,      badge: null },
  { href: '/student/assignments',        label: 'Assignments',       icon: ClipboardList,   badge: null },
  { href: '/student/recovery-missions',  label: 'Recovery Missions', icon: AlertTriangle,   badge: 'missions' as const },
]

const STUDY_ITEMS = [
  { href: '/student/challenges',     label: 'Daily Challenge', icon: Zap,          badge: 'challenge' as const },
  { href: '/student/notes',          label: 'My Notes',        icon: FileText,     badge: null },
  { href: '/student/flashcards',     label: 'Flashcards',      icon: Layers,       badge: null },
  { href: '/student/exam-timetable', label: 'Exam Timetable',  icon: CalendarCheck,badge: null },
]

const MORE_ITEMS = [
  { href: '/student/notifications',    label: 'Notifications',   icon: Bell,        badge: 'notifications' as const },
  { href: '/student/messages',         label: 'Messages',        icon: MessageSquare,badge: 'messages' as const },
  { href: '/student/resources',        label: 'Resource Library',icon: Library,     badge: 'pro-only' as const },
  { href: '/student/study-planner',    label: 'Study Planner',   icon: CalendarDays,badge: 'pro-only' as const },
  { href: '/student/grade-predictor',  label: 'Grade Predictor', icon: Target,      badge: 'pro-only' as const },
  { href: '/student/ai-workspace',     label: 'AI Workspace',    icon: Sparkles,    badge: 'pro-only' as const },
  { href: '/student/leaderboard',      label: 'Leaderboard',     icon: Trophy,      badge: null },
  { href: '/student/tournaments',      label: 'Tournaments',     icon: Trophy,      badge: 'pro-only' as const },
  { href: '/student/squads',           label: 'Study Squads',    icon: Users,       badge: 'pro-only' as const },
  { href: '/student/solver',           label: 'Problem Solver',  icon: Calculator,  badge: null },
  { href: '/student/bookmarks',        label: 'Bookmarks',       icon: Bookmark,    badge: null },
  { href: '/student/projects',         label: 'My Projects',     icon: FlaskConical,badge: null },
  { href: '/student/sbp-packages',     label: 'Project Templates',icon: Package,    badge: null },
  { href: '/student/referral',         label: 'Refer & Earn',    icon: Gift,        badge: null },
  { href: '/student/search',           label: 'Search',          icon: Search,      badge: null },
  { href: '/student/settings/security',label: 'Security',        icon: Settings,    badge: null },
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  userName: string
  streak: number
  unreadNotifications?: number
  unreadMessages?: number
  plan?: 'free' | 'starter' | 'pro' | 'elite' | 'ultimate'
  aiUsed?: number
  trialEndsAt?: string | null
  subscriptionExpiresAt?: string | null
  hasChallenge?: boolean
  activeMissionsCount?: number
}

const PLAN_LIMITS: Record<string, number> = { free: 3, starter: 10, pro: 40, elite: 120, ultimate: 9999 }
const PLAN_LABELS: Record<string, string>  = { free: 'Free', starter: 'Starter', pro: 'Pro', elite: 'Elite', ultimate: 'Ultimate' }

// ── Component ──────────────────────────────────────────────────────────────────

export default function StudentSidebar({
  userName,
  streak,
  unreadNotifications = 0,
  unreadMessages = 0,
  plan = 'free',
  aiUsed = 0,
  trialEndsAt = null,
  subscriptionExpiresAt = null,
  hasChallenge = false,
  activeMissionsCount = 0,
}: Props) {
  const [open, setOpen]         = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)
  const pathname = usePathname()
  const { theme, toggle: toggleTheme } = useTheme()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-sidebar', handler)
    return () => window.removeEventListener('open-sidebar', handler)
  }, [])

  const badgeCounts: Record<string, number> = {
    notifications: unreadNotifications,
    messages: unreadMessages,
    challenge: hasChallenge ? 1 : 0,
    missions: activeMissionsCount,
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'
  const moreItemActive = MORE_ITEMS.some(item => isActive(item.href))
  const isPaid = ['starter', 'pro', 'elite', 'ultimate'].includes(plan)

  function NavLink({ href, label, icon: Icon, badge }: { href: string; label: string; icon: React.ElementType; badge: string | null }) {
    const active   = isActive(href)
    const count    = badge ? (badgeCounts[badge] ?? 0) : 0
    const isLocked = !isPaid && badge === 'pro-only'

    return (
      <Link
        href={isLocked ? '/student/upgrade' : href}
        onClick={() => setOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500 pl-[10px]'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-l-2 border-transparent pl-[10px]'
        }`}
      >
        <Icon size={16} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
        <span className="flex-1 truncate">{label}</span>

        {isLocked && <Lock size={12} className="text-amber-500" />}

        {count > 0 && !isLocked && (
          <span className={`h-[18px] text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm ${
            badge === 'challenge' ? 'bg-amber-500 px-2' : 'min-w-[18px] bg-red-500'
          }`}>
            {badge === 'challenge' ? 'NEW' : count > 99 ? '99+' : count}
          </span>
        )}
        {active && count === 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
        )}
      </Link>
    )
  }

  // ── Compact plan status (single row replacing 4 competing footer elements) ────
  function PlanStatus() {
    const now         = new Date()
    const subExp      = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null
    const isExpired   = subExp ? subExp <= now : false
    const trialActive = trialEndsAt && new Date(trialEndsAt) > now && !isPaid
    const daysLeft    = trialActive
      ? Math.ceil((new Date(trialEndsAt!).getTime() - now.getTime()) / 86_400_000)
      : 0
    const limit = PLAN_LIMITS[plan] ?? 5
    const pct   = Math.min(100, Math.round((aiUsed / limit) * 100))

    if (isExpired) {
      return (
        <Link href="/student/upgrade" onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all text-xs">
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
          <span className="flex-1 font-semibold text-red-300">Subscription expired</span>
          <span className="text-red-400 font-bold">Renew →</span>
        </Link>
      )
    }

    if (trialActive) {
      return (
        <Link href="/student/upgrade" onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all text-xs">
          <Zap size={13} className="text-emerald-400 flex-shrink-0" />
          <span className="flex-1 font-semibold text-emerald-300">Pro Trial — {daysLeft}d left</span>
          <span className="text-emerald-400 font-bold">Upgrade →</span>
        </Link>
      )
    }

    if (plan === 'pro' || plan === 'elite' || plan === 'ultimate') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 text-xs">
          <Crown size={13} className="text-amber-400 flex-shrink-0" />
          <span className="flex-1 font-semibold text-slate-300">{PLAN_LABELS[plan]} Plan</span>
          <span className="text-slate-500">Unlimited AI</span>
        </div>
      )
    }

    // Free / starter — show AI quota inline
    const barColor = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-400' : 'bg-emerald-500'
    return (
      <Link href="/student/upgrade" onClick={() => setOpen(false)}
        className="block px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-all text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Zap size={12} className="text-amber-500" />
            AI quota
          </div>
          <span className={pct >= 80 ? 'text-red-400 font-bold' : 'text-slate-400'}>{aiUsed}/{limit} used</span>
        </div>
        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-slate-500 text-center">Upgrade for unlimited access →</p>
      </Link>
    )
  }

  return (
    <A11yProvider>
      {/* Accessibility overlay */}
      {a11yOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setA11yOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 m-4 mt-16 lg:mt-4 p-5 z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Accessibility size={16} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">Accessibility</h2>
              </div>
              <button onClick={() => setA11yOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                aria-label="Close accessibility panel">
                <X size={15} />
              </button>
            </div>
            <AccessibilityControls />
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-sm leading-tight tracking-wide">ZimLearn</p>
              <p className="text-xs text-emerald-400 font-medium">Student Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition" aria-label="Close menu">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-4">

          {/* Core */}
          <div className="space-y-0.5">
            {CORE_ITEMS.map(item => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          {/* Study Tools */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">Study Tools</p>
            <div className="space-y-0.5">
              {STUDY_ITEMS.map(item => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>

          {/* More (collapsible) */}
          <div>
            <button
              onClick={() => setMoreOpen(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border-l-2 pl-[10px] ${
                moreItemActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-transparent'
              }`}
            >
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-widest text-slate-600">More</span>
              {moreOpen || moreItemActive
                ? <ChevronDown size={14} className="text-slate-500" />
                : <ChevronRight size={14} className="text-slate-500" />
              }
            </button>

            {(moreOpen || moreItemActive) && (
              <div className="mt-0.5 space-y-0.5">
                {MORE_ITEMS.map(item => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            )}
          </div>

          {/* Theme + Sign Out — always visible, labelled */}
          <div className="border-t border-slate-800 pt-3 mt-1 space-y-0.5">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
            >
              {theme === 'dark'
                ? <Sun size={16} className="text-amber-400 flex-shrink-0" />
                : <Moon size={16} className="flex-shrink-0" />
              }
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </nav>

        {/* Footer — 2 rows only */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-2 flex-shrink-0">

          {/* Row 1: compact plan/quota status */}
          <PlanStatus />

          {/* Row 2: user info + accessibility */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-500/40"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-slate-500">Student</p>
                {streak > 0 && (
                  <span className="text-xs text-orange-400 font-semibold">· {streak} 🔥</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setA11yOpen(v => !v)}
              className={`p-2 rounded-lg transition-all ${a11yOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
              title="Accessibility settings"
              aria-label="Toggle accessibility settings"
            >
              <Accessibility size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-700/60 z-20 flex items-center justify-between px-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-white text-sm tracking-wide">ZimLearn</span>
        </div>
        <div className="flex items-center gap-1.5">
          {streak > 0 && (
            <span className="text-xs text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">🔥 {streak}</span>
          )}
          {(unreadNotifications + unreadMessages) > 0 && (
            <Link href="/student/notifications" className="relative p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition">
              <Bell size={18} className="text-slate-300" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {Math.min(unreadNotifications + unreadMessages, 9)}
              </span>
            </Link>
          )}
          <Link href="/student/search" className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition">
            <Search size={18} className="text-slate-300" />
          </Link>
          <ThemeToggle className="text-slate-300" />
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-slate-300">
              <rect x="2" y="5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="9.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="13.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>
    </A11yProvider>
  )
}
