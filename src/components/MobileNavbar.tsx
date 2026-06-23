'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, MessageSquare, CloudOff, User } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MobileNavbar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Desk', icon: Home, href: '/student/dashboard' },
    { label: 'Books', icon: BookOpen, href: '/student/subjects' },
    { label: 'Teacher', icon: MessageSquare, href: '/student/ai-workspace', primary: true },
    { label: 'Saved', icon: CloudOff, href: '/student/offline' },
    { label: 'Profile', icon: User, href: '/student/profile' },
  ]

  // Only show on student dashboard paths
  if (!pathname.startsWith('/student')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-2 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white transform transition-transform active:scale-90">
                  <Icon size={28} className="text-white" />
                </div>
                <p className={`text-[10px] font-black text-center mt-1 uppercase tracking-tighter ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {item.label}
                </p>
              </Link>
            )
          }

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-1">
              <div className="relative">
                <Icon size={22} className={`transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
                  />
                )}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                {item.label}
              </p>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
