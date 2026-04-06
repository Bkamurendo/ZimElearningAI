'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all duration-200 rounded-xl
              ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-700 rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TabContent({ id, activeTab, children }: { id: string; activeTab: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {id === activeTab && (
        <motion.div
          key={id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
