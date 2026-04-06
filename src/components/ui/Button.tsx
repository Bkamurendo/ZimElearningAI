'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'premium'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-emerald-500',
    secondary: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border-transparent',
    outline: 'bg-transparent border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 border-rose-400 shadow-sm',
    premium: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-300 shadow-md hover:shadow-lg hover:scale-[1.02]'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-bold rounded-xl gap-2',
    lg: 'px-8 py-3.5 text-base font-bold rounded-2xl gap-2.5',
    icon: 'p-2 rounded-xl'
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        inline-flex items-center justify-center border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      {size !== 'icon' && children}
      
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  )
}
