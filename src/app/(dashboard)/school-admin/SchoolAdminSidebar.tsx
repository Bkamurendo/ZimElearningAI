'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import Image from 'next/image'
import {
  LayoutDashboard, Users, BookOpen, Upload, BarChart3,
  Settings, LogOut, Menu, X, Building2, FileText,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV = [
  { href: '/school-admin/dashboard', label: 'Dashboard',               icon: LayoutDashboard },
  { href: '/school-admin/students',  label: 'Students',                icon: Users           },
  { href: '/school-admin/teachers',  label: 'Teachers',                icon: BookOpen        },
  { href: '/school-admin/import',    label: 'Import Students/Teachers', icon: Upload          },
  { href: '/school-admin/analytics', label: 'Analytics',               icon: BarChart3       },
  { href: '/school-admin/report',    label: 'Download Report',          icon: FileText        },
  { href: '/school-admin/settings',  label: 'Settings',                icon: Settings        },
]

const PLAN_LABELS: Record<string, string> = { basic: 'Basic', pro: 'Pro' }
const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-slate-600 text-slate-200',
  pro:   'bg-emerald-600 text-emerald-100',
}

interface Props {
  schoolName: string
  adminName: string
  plan: 'basic' | 'pro'
}

export default function SchoolAdminSidebar({ schoolName, adminName, plan }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const initials = adminName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SA'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={36} height={36} className="rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-sm leading-tight tracking-wide">ZimLearn</p>
              <p className="text-[11px] text-emerald-400 font-medium">School Admin</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
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
                  <Icon
                    size={16}
                    className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}
                  />
                  <span className="flex-1 truncate">{label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {/* School info */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/60">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={14} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate leading-tight">{schoolName}</p>
              <p className="text-[10px] text-slate-500 leading-tight">School Account</p>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${PLAN_COLORS[plan]}`}
            >
              {PLAN_LABELS[plan].toUpperCase()}
            </span>
          </div>

          {/* Admin user info */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-500/40 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{adminName}</p>
              <p className="text-[10px] text-slate-500">School Admin</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Sign out */}
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-150"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-700/60 z-20 flex items-center justify-between px-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-white text-sm tracking-wide">ZimLearn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/school-admin/settings"
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition"
            aria-label="Settings"
          >
            <Settings size={18} className="text-slate-300" />
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-slate-300" />
          </button>
        </div>
      </header>
    </>
  )
}
