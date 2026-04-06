'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  animate?: boolean
  delay?: number
}

export function Card({ 
  children, 
  className = '', 
  hover = true, 
  glass = false,
  animate = true,
  delay = 0 
}: CardProps) {
  const baseStyles = 'rounded-2xl border transition-all duration-300'
  const shadowStyles = hover ? 'card-shadow card-shadow-hover' : 'card-shadow'
  const glassStyles = glass ? 'glass-card' : 'bg-white border-slate-100 dark:border-slate-800'
  
  const content = (
    <div className={`${baseStyles} ${shadowStyles} ${glassStyles} ${className}`}>
      {children}
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-50 dark:border-slate-800/50 ${className}`}>{children}</div>
}
