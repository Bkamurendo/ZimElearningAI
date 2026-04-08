'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bot, BarChart3, Trophy, MoreHorizontal, BookOpen, Brain, User } from 'lucide-react'

// ── Student tabs: 5 focused destinations ──────────────────────────────────────
// "More" dispatches a custom event that StudentSidebar listens for to open itself

const STUDENT_TABS = [
  { href: '/student/dashboard',   label: 'Home',     icon: Home,          type: 'link'   as const },
  { href: '/student/ai-teacher',  label: 'MaFundi',  icon: Bot,           type: 'link'   as const },
  { href: '/student/progress',    label: 'Progress', icon: BarChart3,     type: 'link'   as const },
  { href: '/student/leaderboard', label: 'Compete',  icon: Trophy,        type: 'link'   as const },
  { href: '',                     label: 'More',     icon: MoreHorizontal,type: 'action' as const },
]

const TEACHER_TABS = [
  { href: '/teacher/dashboard',   label: 'Home',      icon: Home,     type: 'link' as const },
  { href: '/teacher/courses',     label: 'Courses',   icon: BookOpen, type: 'link' as const },
  { href: '/teacher/assignments', label: 'Tasks',     icon: Brain,    type: 'link' as const },
  { href: '/teacher/analytics',   label: 'Analytics', icon: BarChart3,type: 'link' as const },
  { href: '/teacher/settings',    label: 'Profile',   icon: User,     type: 'link' as const },
]

export function MobileBottomNav({ role = 'student' }: { role?: 'student' | 'teacher' }) {
  const pathname = usePathname()
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS

  const activeColor = role === 'teacher' ? 'text-blue-400' : 'text-emerald-400'
  const activeBg    = role === 'teacher' ? 'bg-blue-500/15' : 'bg-emerald-500/15'
  const activeDot   = role === 'teacher' ? 'bg-blue-400' : 'bg-emerald-400'

  function openSidebar() {
    window.dispatchEvent(new CustomEvent('open-sidebar'))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-700/60 safe-area-pb shadow-2xl">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon, type }) => {
          const isActive = type === 'link' && href && (pathname === href || pathname.startsWith(href + '/'))

          if (type === 'action') {
            return (
              <button
                key={label}
                onClick={openSidebar}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[56px] transition-all text-slate-400 active:text-slate-200 active:bg-slate-800/50"
              >
                <Icon size={22} strokeWidth={1.8} />
                <span className="text-xs font-semibold leading-none tracking-wide text-slate-500">
                  {label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[56px] transition-all relative ${
                isActive
                  ? `${activeColor} ${activeBg}`
                  : 'text-slate-400 active:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 ${activeDot} rounded-full`} />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-xs font-semibold leading-none tracking-wide ${isActive ? '' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
