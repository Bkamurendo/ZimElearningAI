'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Brain, BarChart3, User } from 'lucide-react'

const STUDENT_TABS = [
  { href: '/student/dashboard', label: 'Home', icon: Home },
  { href: '/student/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/student/ai-tutor', label: 'AI Tutor', icon: Brain },
  { href: '/student/progress', label: 'Progress', icon: BarChart3 },
  { href: '/student/settings', label: 'Profile', icon: User },
]

const TEACHER_TABS = [
  { href: '/teacher/dashboard', label: 'Home', icon: Home },
  { href: '/teacher/courses', label: 'Courses', icon: BookOpen },
  { href: '/teacher/assignments', label: 'Tasks', icon: Brain },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/teacher/settings', label: 'Profile', icon: User },
]

export function MobileBottomNav({ role = 'student' }: { role?: 'student' | 'teacher' }) {
  const pathname = usePathname()
  const tabs = role === 'teacher' ? TEACHER_TABS : STUDENT_TABS
  const activeColor = role === 'teacher' ? 'text-blue-400' : 'text-emerald-400'
  const activeBg = role === 'teacher' ? 'bg-blue-500/10' : 'bg-emerald-500/10'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 ${
                isActive ? `${activeColor} ${activeBg}` : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
