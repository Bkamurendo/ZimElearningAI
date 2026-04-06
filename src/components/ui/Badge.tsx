'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate' | 'premium'
  size?: 'xs' | 'sm' | 'md'
  icon?: React.ReactNode
  className?: string
  pulse?: boolean
}

export function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  icon,
  className = '',
  pulse = false
}: BadgeProps) {
  
  const variants = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    premium: 'bg-gradient-to-r from-amber-200 to-yellow-100 text-amber-900 border-amber-300 font-bold'
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[9px] rounded-md gap-0.5',
    sm: 'px-2.5 py-1 text-[10px] rounded-full gap-1',
    md: 'px-3 py-1.5 text-xs rounded-full gap-1.5'
  }

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center font-bold tracking-tight border shadow-sm
        ${variants[variant]}
        ${sizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </motion.span>
  )
}
