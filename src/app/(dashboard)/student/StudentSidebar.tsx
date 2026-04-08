'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, TrendingUp, Target, CalendarDays, LogOut,
  Flame, X, Calculator,
  Search, Bookmark, Trophy, Bell, MessageSquare, BookOpen, Zap, Settings, User, Library,
  ClipboardList, FileText, Layers, Bot, Sparkles, CalendarCheck, FlaskConical, Crown,
  Accessibility, Gift, Users, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccessibilityControls, A11yProvider } from '@/components/AccessibilityControls'

// ── Navigation grouped by section ─────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { href: '/student/dashboard',     label: 'Dashboard',       icon: LayoutDashboard, badge: null },
      { href: '/student/challenges',    label: 'Daily Challenge', icon: Zap,             badge: 'challenge' as const },
      { href: '/student/notifications', label: 'Notifications',   icon: Bell,            badge: 'notifications' as const },
      { href: '/student/messages',      label: 'Messages',        icon: MessageSquare,   badge: 'messages' as const },
    ],
  },
  {
    label: 'MaFundi AI',
    items: [
      { href: '/student/ai-teacher',   label: 'AI Teacher',   icon: Bot,      badge: null },
      { href: '/student/ai-workspace', label: 'AI Workspace', icon: Sparkles, badge: null },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/student/subjects',     label: 'My Subjects',      icon: BookOpen,     badge: null },
      { href: '/student/resources',    label: 'Resource Library', icon: Library,      badge: null },
      { href: '/student/assignments',  label: 'Assignments',      icon: ClipboardList,badge: null },
      { href: '/student/notes',        label: 'My Notes',         icon: FileText,     badge: null },
      { href: '/student/flashcards',   label: 'Flashcards',       icon: Layers,       badge: null },
    ],
  },
  {
    label: 'Track & Plan',
    items: [
      { href: '/student/progress',        label: 'My Progress',     icon: TrendingUp,   badge: null },
      { href: '/student/exam-timetable',  label: 'Exam Timetable',  icon: CalendarCheck,badge: null },
      { href: '/student/study-planner',   label: 'Study Planner',   icon: CalendarDays, badge: null },
      { href: '/student/grade-predictor', label: 'Grade Predictor', icon: Target,       badge: null },
    ],
  },
  {
    label: 'Compete',
    items: [
      { href: '/student/leaderboard',  label: 'Leaderboard',     icon: Trophy, badge: null },
      { href: '/student/tournaments',  label: 'Tournaments 🏆',  icon: Trophy, badge: null },
      { href: '/student/squads',       label: 'Study Squads 👥', icon: Users,  badge: null },
    ],
  },
]

const MORE_ITEMS = [
  { href: '/student/solver',             label: 'Problem Solver',  icon: Calculator,  badge: null },
  { href: '/student/bookmarks',          label: 'Bookmarks',       icon: Bookmark,    badge: null },
  { href: '/student/search',             label: 'Search',          icon: Search,      badge: null },
  { href: '/student/projects',           label: 'Projects (SBP)',  icon: FlaskConical,badge: null },
  { href: '/student/projects/examples',  label: 'SBP Examples',   icon: BookOpen,    badge: null },
  { href: '/student/projects/templates', label: 'SBP Templates',  icon: Crown,       badge: null },
  { href: '/student/settings/security',  label: 'Security',       icon: Settings,    badge: null },
  { href: '/student/referral',           label: 'Refer & Earn 🎁',icon: Gift,        badge: null },
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  userName: string
  streak: number
  unreadNotifications?: number
  unreadMessages?: number
  plan?: 'free' | 'starter' | 'pro' | 'elite'
  aiUsed?: number
  trialEndsAt?: string | null
  subscriptionExpiresAt?: string | null
  hasChallenge?: boolean
}

const PLAN_LIMITS: Record<string, number> = { free: 25, starter: 100, pro: 9999, elite: 9999 }
const PLAN_LABELS: Record<string, string>  = { free: 'Free', starter: 'Starter', pro: 'Pro', elite: 'Elite' }
const PLAN_COLORS: Record<string, string>  = {
  free:    'bg-slate-600 text-slate-200',
  starter: 'bg-blue-600 text-blue-100',
  pro:     'bg-indigo-600 text-indigo-100',
  elite:   'bg-amber-500 text-amber-100',
}

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
}: Props) {
  const [open, setOpen]         = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Listen for "open-sidebar" custom event (dispatched by MobileBottomNav "More" tab)
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-sidebar', handler)
    return () => window.removeEventListener('open-sidebar', handler)
  }, [])

  const badgeCounts: Record<string, number> = {
    notifications: unreadNotifications,
    messages: unreadMessages,
    challenge: hasChallenge ? 1 : 0,
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'

  // Check if any "More" item is currently active so we auto-expand the section
  const moreItemActive = MORE_ITEMS.some(item => isActive(item.href))

  function NavLink({ href, label, icon: Icon, badge }: { href: string; label: string; icon: React.ElementType; badge: string | null }) {
    const active = isActive(href)
    const count  = badge ? (badgeCounts[badge] ?? 0) : 0
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500 pl-[10px]'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-l-2 border-transparent pl-[10px]'
        }`}
      >
        <Icon size={16} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && (
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

  return (
    <A11yProvider>
      {/* ── Accessibility overlay ─────────────────────────────────── */}
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
              <button
                onClick={() => setA11yOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                aria-label="Close accessibility panel"
              >
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

      {/* ── Sidebar ──────────────────────────────────────────────── */}
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
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}

          {/* ── More (collapsible) ───────────────────────── */}
          <div>
            <button
              onClick={() => setMoreOpen(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border-l-2 pl-[10px] ${
                moreItemActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-transparent'
              }`}
            >
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-widest">More</span>
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
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2 flex-shrink-0">

          {/* Trial banner */}
          {trialEndsAt && new Date(trialEndsAt) > new Date() && (plan === 'free' || plan === 'starter') && (() => {
            const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return (
              <Link href="/student/upgrade" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
                <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-300 leading-tight">Pro Trial Active</div>
                  <div className="text-xs text-emerald-500 leading-tight">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining · Upgrade to keep access</div>
                </div>
              </Link>
            )
          })()}

          {/* AI quota bar */}
          {((plan || 'free') === 'free' || plan === 'starter') && !(trialEndsAt && new Date(trialEndsAt) > new Date()) && (() => {
            const limit = PLAN_LIMITS[plan || 'free'] ?? 25
            const currentUsage = aiUsed || 0
            const pct = Math.min(100, Math.round((currentUsage / limit) * 100))
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
            return (
              <div className="px-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">AI Requests Today</span>
                  <span className={`text-xs font-bold ${pct >= 90 ? 'text-red-400' : 'text-slate-400'}`}>{currentUsage}/{limit}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                {pct >= 80 && (
                  <p className="text-xs text-amber-400">Running low — <Link href="/student/upgrade" className="underline hover:text-amber-300">upgrade now</Link></p>
                )}
              </div>
            )
          })()}

          {/* Plan status / upgrade */}
          {(() => {
            const now = new Date()
            const subExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null
            const isExpired = subExpiresAt ? subExpiresAt <= now : false

            if (isExpired) {
              return (
                <Link href="/student/upgrade" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all group">
                  <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={14} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-red-300 leading-tight">Elite Expired</div>
                    <div className="text-xs text-red-500 leading-tight underline group-hover:text-red-400">Renew Now to unlock AI</div>
                  </div>
                </Link>
              )
            }

            if (plan === 'pro' || plan === 'elite') {
              return (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60">
                  <Crown size={14} className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 leading-tight">{PLAN_LABELS[plan]} Plan</div>
                    <div className="text-xs text-slate-500 leading-tight">Unlimited AI access</div>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{PLAN_LABELS[plan].toUpperCase()}</span>
                </div>
              )
            }

            return (
              <Link href="/student/upgrade" onClick={() => setOpen(false)}
                className="relative overflow-hidden flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap size={14} className="text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white leading-tight">Upgrade to Pro</div>
                  <div className="text-xs text-purple-200 leading-tight">Unlimited AI · from $5/mo</div>
                </div>
              </Link>
            )
          })()}

          {/* Streak pill */}
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Flame size={14} className="text-orange-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-300">{streak} day streak 🔥</span>
            </div>
          )}

          {/* User info + theme + accessibility */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-500/40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
              <p className="text-xs text-slate-500">Student</p>
            </div>
            <ThemeToggle />
            <button
              onClick={() => setA11yOpen(v => !v)}
              className={`p-2 rounded-xl transition-all duration-200 ${a11yOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
              title="Accessibility settings"
              aria-label="Toggle accessibility settings"
            >
              <Accessibility size={16} />
            </button>
          </div>

          {/* Sign out */}
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-150">
              <LogOut size={13} />
              Sign out
            </button>
          </form>
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
          <button
            onClick={() => setA11yOpen(v => !v)}
            className={`p-1.5 rounded-lg transition ${a11yOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-300'}`}
            aria-label="Accessibility settings"
          >
            <Accessibility size={18} />
          </button>
          <Link href="/student/settings" className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition" aria-label="Profile & Settings">
            <User size={18} className="text-slate-300" />
          </Link>
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
