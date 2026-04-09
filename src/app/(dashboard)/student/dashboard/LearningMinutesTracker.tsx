'use client'

import React from 'react'
import { Timer, TrendingUp, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface Props {
  minutesToday: number
  targetMinutes?: number
}

export default function LearningMinutesTracker({ 
  minutesToday, 
  targetMinutes = 60 
}: Props) {
  const percentage = Math.min(Math.round((minutesToday / targetMinutes) * 100), 100)
  
  // Calculate stroke dasharray for the ring
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <Card hover className="relative overflow-hidden group border-t-4 border-t-indigo-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Timer size={14} className="text-indigo-500" /> Focus Time Today
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {minutesToday}
                </span>
                <span className="text-sm font-black text-slate-400 uppercase">min</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  Goal: {targetMinutes}m
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                  {percentage}% Done
                </span>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              {/* Background Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-indigo-500 fill-none transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-xs font-black text-indigo-600">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Action Button Integration Hint (Optional) */}
        {percentage >= 100 && (
          <div className="mt-4 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/10 flex items-center justify-center gap-2">
            <span className="text-sm font-black text-emerald-600 uppercase tracking-tighter shadow-emerald-500">🏆 Daily Goal Smashed!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
