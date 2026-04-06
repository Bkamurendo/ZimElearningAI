'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  circle?: boolean
}

export function Skeleton({ className = '', circle = false }: SkeletonProps) {
  return (
    <div 
      className={`
        bg-slate-200 dark:bg-slate-700/50 
        animate-pulse overflow-hidden relative
        ${circle ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  )
}

export function SkeletonCircle({ size = 12, className = '' }: { size?: number; className?: string }) {
  return <Skeleton circle className={`w-${size} h-${size} ${className}`} />
}
