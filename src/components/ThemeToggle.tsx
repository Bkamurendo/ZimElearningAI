'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl transition-all duration-200 hover:bg-slate-800/50 ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark'
        ? <Sun size={18} className="text-amber-400" />
        : <Moon size={18} className="text-slate-400" />
      }
    </button>
  )
}
