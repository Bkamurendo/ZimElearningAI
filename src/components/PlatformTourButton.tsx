'use client'

import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { AnimatedLessonPlayer } from '@/components/AnimatedLessonPlayer'
import { PLATFORM_TOUR } from '@/lib/platformTour'

interface Props {
  /** Visual style of the trigger button */
  variant?: 'primary' | 'ghost' | 'banner'
  label?: string
  className?: string
}

export function PlatformTourButton({
  variant = 'ghost',
  label = 'See how it works',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)

  const buttonClass = {
    primary:
      'flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150',
    ghost:
      'flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors',
    banner:
      'flex items-center gap-2.5 w-full px-4 py-3.5 rounded-2xl font-semibold text-sm text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-150',
  }[variant]

  const buttonStyle = {
    primary: { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
    ghost:   {},
    banner:  { background: 'linear-gradient(135deg,#7c3aed,#2563eb)' },
  }[variant]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClass} ${className}`}
        style={buttonStyle}
      >
        <PlayCircle size={variant === 'ghost' ? 15 : 18} className={variant === 'ghost' ? 'text-violet-500' : 'text-white'} />
        {label}
      </button>

      {open && (
        <AnimatedLessonPlayer
          lesson={PLATFORM_TOUR}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
