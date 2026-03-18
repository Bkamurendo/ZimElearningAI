'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Brain, BarChart3, User } from 'lucide-react'

const STUDENT_TABS = [
  { href: '/student/dashboard',  label: 'Home',     icon: Home },
  { href: '/student/subjects',   label: 'Subjects',  icon: BookOpen },
  { href: '/student/ai-tutor',   label: 'AI Tutor',  icon: Brain },
  { href: '/student/progress',   label: 'Progress',  icon: BarChart3 },
  { href: '/student/settings',   label: 'Profile',   icon: User },
]

const TEACHER_TABS = [
  { href: '/teacher/dashboard',   label: 'Home',      icon: Home },
  { href: '/teacher/courses',     label: 'Courses',   icon: BookOpen },
  { href: '/teacher/assignments', label: 'Tasks',     icon: Brain },
  { href: '/teacher/analytics',   label: 'Analytics', icon: BarChart3 },
  { href: '/teacher/settings',    label: 'Profile',   icon: User },
]

export function MobileBottomNav({ role = 'student' }: { role?: 'student' | 'teacher' }) {
  const pathname = usePathname()
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS

  const activeColor = role === 'teacher' ? 'text-blue-400' : 'text-emerald-400'
  const activeBg    = role === 'teacher' ? 'bg-blue-500/15' : 'bg-emerald-500/15'
  const activeDot   = role === 'teacher' ? 'bg-blue-400' : 'bg-emerald-400'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-700/60 safe-area-pb shadow-2xl">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
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
              <span className={`text-[10px] font-semibold leading-none tracking-wide ${
                isActive ? '' : 'text-slate-500'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
