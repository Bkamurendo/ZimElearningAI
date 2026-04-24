'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, BookOpen, ClipboardList, LogOut, Menu, X,
  Library, MessageSquare, Sparkles, Users, BookMarked,
  HelpCircle, FlaskConical, CalendarCheck, BarChart3,
  Award, Star, Package,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV = [
  { href: '/teacher/dashboard',      label: 'Dashboard',        icon: LayoutDashboard, badge: null },
  { href: '/teacher/courses',        label: 'My Courses',       icon: BookOpen,        badge: null },
  { href: '/teacher/assignments',    label: 'Assignments',      icon: ClipboardList,   badge: null },
  { href: '/teacher/tests',          label: 'Tests',            icon: FlaskConical,    badge: null },
  { href: '/teacher/projects',       label: 'Projects (SBP)',   icon: BookMarked,      badge: null },
  { href: '/teacher/students',       label: 'My Students',      icon: Users,           badge: null },
  { href: '/teacher/gradebook',      label: 'Grade Book',       icon: BookMarked,      badge: null },
  { href: '/teacher/question-bank',  label: 'Question Bank',    icon: HelpCircle,      badge: null },
  { href: '/teacher/resources',      label: 'Resources',        icon: Library,         badge: null },
  { href: '/teacher/analytics',      label: 'Analytics',        icon: BarChart3,       badge: null },
  { href: '/teacher/messages',       label: 'Messages',         icon: MessageSquare,   badge: 'messages' as const },
]

const TOOLS = [
  { href: '/teacher/sbp-packages',   label: 'SBP Packages',           icon: Package },
  { href: '/teacher/lesson-planner', label: 'Lesson Planner',         icon: CalendarCheck },
  { href: '/teacher/resources',      label: 'AI Materials Generator',  icon: Sparkles },
  { href: '/teacher/cpd',            label: 'CPD Certificates',       icon: Award },
]

const PREMIUM = [
  { href: '/teacher/upgrade',        label: 'Upgrade to Pro',         icon: Star },
]

interface Props {
  userName: string
  unreadMessages?: number
}

export default function TeacherSidebar({ userName, unreadMessages = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const badgeCounts: Record<string, number> = { messages: unreadMessages }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T'

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
            <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-sm leading-tight tracking-wide">ZimLearn</p>
              <p className="text-[11px] text-blue-400 font-medium">Teacher Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition" aria-label="Close menu">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-5">
          {/* Main nav */}
          <div>
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
                        ? 'bg-blue-500/15 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-l-2 border-transparent pl-[10px]'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="flex-1 truncate">{label}</span>
                    {count > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                    {active && count === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* AI Tools section */}
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">Professional Tools</p>
            <div className="space-y-0.5">
              {TOOLS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={`tool-${href}-${label}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-blue-500/15 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border-l-2 border-transparent pl-[10px]'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Premium section */}
          <div>
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest px-3 mb-3 flex items-center gap-1.5">
              <Star size={10} fill="currentColor" /> Premium Features
            </p>
            <div className="space-y-0.5">
              {PREMIUM.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={`premium-${href}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                      active
                        ? 'bg-amber-500/15 text-amber-500 border-l-2 border-amber-500 pl-[10px]'
                        : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border-l-2 border-transparent pl-[10px]'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-amber-500' : 'text-slate-500 group-hover:text-amber-400'} />
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-blue-500/40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500">Teacher</p>
            </div>
            <ThemeToggle />
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
          <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-white text-sm tracking-wide">ZimLearn</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadMessages > 0 && (
            <Link href="/teacher/messages" className="relative p-1.5 rounded-lg hover:bg-slate-800 transition">
              <MessageSquare size={18} className="text-slate-300" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {Math.min(unreadMessages, 9)}
              </span>
            </Link>
          )}
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-slate-800 transition" aria-label="Open menu">
            <Menu size={20} className="text-slate-300" />
          </button>
        </div>
      </header>
    </>
  )
}
