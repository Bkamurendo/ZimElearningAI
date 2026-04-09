'use client'

import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface PathItem {
  subject: string
  topic: string
  reason: string
  priority: number
  actionType: string
  actionUrl: string
}

export default function AdaptivePath() {
  const [path, setPath] = useState<PathItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPath() {
      try {
        const res = await fetch('/api/student/adaptive-path')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setPath(data.path || [])
      } catch (err) {
        console.error('Failed to fetch adaptive path:', err)
        setError('MaFundi AI is taking a break. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPath()
  }, [])

  if (loading) {
    return (
      <Card glass className="overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
           <div className="flex items-center gap-2">
              <Brain className="text-purple-400 animate-pulse" size={18} />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Generating AI Learning Path</h3>
           </div>
           <Loader2 className="text-slate-500 animate-spin" size={16} />
        </div>
        <CardContent className="p-6 space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                   <div className="h-4 bg-slate-800 rounded-md w-1/4" />
                   <div className="h-3 bg-slate-800 rounded-md w-3/4" />
                </div>
             </div>
           ))}
        </CardContent>
      </Card>
    )
  }

  if (error || path.length === 0) {
    return (
      <Card glass className="p-6 text-center border-dashed border-slate-200">
        <AlertCircle className="mx-auto text-slate-300 mb-2" size={24} />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">
          {error || 'Start some lessons to unlock your AI Study Path!'}
        </p>
      </Card>
    )
  }

  return (
    <Card glass className="overflow-hidden border-none shadow-2xl group">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 flex items-center justify-between relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
         
         <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-purple-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/20">
               <Brain size={20} className="group-hover:rotate-12 transition-transform duration-500" />
            </div>
            <div>
               <h3 className="text-base font-black text-white uppercase tracking-tight italic">Adaptive Mastery Path</h3>
               <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest leading-none mt-0.5">Powered by MaFundi AI Intelligence</p>
            </div>
         </div>
         <Badge variant="premium" className="bg-purple-500/20 text-purple-300 border-purple-500/30">Claude G3 Enabled</Badge>
      </div>

      <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/50">
         {path.map((item, idx) => (
           <Link key={idx} href={item.actionUrl} className="block group/item hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300">
             <div className="px-6 py-5 flex items-start gap-5">
                {/* Priority Indicator */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-md transition-all group-hover/item:scale-110 ${
                     idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                   }`}>
                      {item.priority}
                   </div>
                   <div className="w-[2px] h-8 bg-gradient-to-b from-slate-200 to-transparent last:hidden" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subject}</span>
                      <Badge size="xs" variant="slate" className="bg-slate-100 text-slate-500 uppercase font-black tracking-tighter">
                         {item.actionType}
                      </Badge>
                   </div>
                   <h4 className="text-base font-black text-slate-800 dark:text-white truncate tracking-tight">{item.topic}</h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{item.reason}</p>
                </div>

                <div className="flex flex-col items-end justify-center h-full self-center">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover/item:text-indigo-500 group-hover/item:bg-indigo-50 transition-all duration-300">
                      <ChevronRight size={20} />
                   </div>
                </div>
             </div>
           </Link>
         ))}
      </CardContent>

      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Updated based on your last 24h activity</p>
         <Button variant="ghost" size="sm" className="text-xs font-black text-indigo-600 hover:text-indigo-700 p-0 h-auto gap-1.5 uppercase tracking-widest">
            Detailed Audit <ArrowRight size={12} />
         </Button>
      </div>
    </Card>
  )
}
