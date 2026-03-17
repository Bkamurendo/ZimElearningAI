'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, TrendingUp, Target, CalendarDays, LogOut,
  Flame, Menu, X, GraduationCap, Calculator,
  Search, Bookmark, Trophy, Bell, MessageSquare, BookOpen, Zap, Settings,
} from 'lucide-react'

const NAV = [
  { href: '/student/dashboard',         label: 'Dashboard',       icon: LayoutDashboard, badge: null },
  { href: '/student/subjects',          label: 'My Subjects',     icon: BookOpen,        badge: null },
  { href: '/student/search',            label: 'Search',          icon: Search,          badge: null },
  { href: '/student/progress',          label: 'My Progress',     icon: TrendingUp,      badge: null },
  { href: '/student/bookmarks',         label: 'Bookmarks',       icon: Bookmark,        badge: null },
  { href: '/student/leaderboard',       label: 'Leaderboard',     icon: Trophy,          badge: null },
  { href: '/student/notifications',     label: 'Notifications',   icon: Bell,            badge: 'notifications' as const },
  { href: '/student/messages',          label: 'Messages',        icon: MessageSquare,   badge: 'messages' as const },
  { href: '/student/grade-predictor',   label: 'Grade Predictor', icon: Target,          badge: null },
  { href: '/student/study-planner',     label: 'Study Planner',   icon: CalendarDays,    badge: null },
  { href: '/student/solver',            label: 'Problem Solver',  icon: Calculator,      badge: null },
  { href: '/student/settings/security', label: 'Security',        icon: Settings,        badge: null },
]

interface Props {
  userName: string
  streak: number
  unreadNotifications?: number
  unreadMessages?: number
}

export default function StudentSidebar({ userName, streak, unreadNotifications = 0, unreadMessages = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const badgeCounts: Record<string, number> = {
    notifications: unreadNotifications,
    messages: unreadMessages,
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight tracking-wide">ZimLearn</p>
              <p className="text-[11px] text-emerald-400 font-medium">Student Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition" aria-label="Close menu">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Navigation</p>
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href)
              const count = badge ? (badgeCounts[badge] ?? 0) : 0
              return (
                <Link
                  key={href}
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
                    <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                  {active && count === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {/* Upgrade banner */}
          <Link
            href="/student/upgrade"
            onClick={() => setOpen(false)}
            className="relative overflow-hidden flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white leading-tight">Upgrade to Pro</div>
              <div className="text-[10px] text-purple-200 leading-tight">Unlimited AI · from $2/mo</div>
            </div>
          </Link>

          {/* Streak pill */}
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Flame size={14} className="text-orange-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-300">{streak} day streak 🔥</span>
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-500/40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500">Student</p>
            </div>
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

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-800 z-20 flex items-center justify-between px-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/30">
            <GraduationCap size={13} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">ZimLearn</span>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="text-xs text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">🔥 {streak}</span>
          )}
          {(unreadNotifications + unreadMessages) > 0 && (
            <Link href="/student/notifications" className="relative p-1.5 rounded-lg hover:bg-slate-800 transition">
              <Bell size={18} className="text-slate-300" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {Math.min(unreadNotifications + unreadMessages, 9)}
              </span>
            </Link>
          )}
          <Link href="/student/search" className="p-1.5 rounded-lg hover:bg-slate-800 transition">
            <Search size={18} className="text-slate-300" />
          </Link>
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-slate-800 transition" aria-label="Open menu">
            <Menu size={20} className="text-slate-300" />
          </button>
        </div>
      </header>
    </>
  )
}
