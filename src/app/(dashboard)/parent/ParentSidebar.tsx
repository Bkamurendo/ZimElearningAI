'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, LogOut, Menu, X, ChevronRight, Users, MessageSquare,
} from 'lucide-react'

const NAV = [
  { href: '/parent/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/parent/children',   label: 'My Children',  icon: Users },
  { href: '/parent/messages',   label: 'Messages',     icon: MessageSquare },
]

interface Props {
  userName: string
}

export default function ParentSidebar({ userName }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-40 flex flex-col shadow-xl lg:shadow-sm transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">ZimLearn</p>
              <p className="text-xs text-purple-600 font-medium">Parent Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Navigation</p>
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Icon size={17} className={active ? 'text-purple-600' : 'text-gray-400'} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight size={13} className="text-purple-400 flex-shrink-0" />}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-700 text-xs font-bold">{userName[0]?.toUpperCase() ?? 'P'}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 truncate">{userName}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-100 z-20 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-gray-900 text-sm">ZimLearn</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition">
          <Menu size={20} className="text-gray-600" />
        </button>
      </header>
    </>
  )
}
