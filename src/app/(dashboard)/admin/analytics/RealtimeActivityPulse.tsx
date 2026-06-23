'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'

export default function RealtimeActivityPulse() {
  const [pulse, setPulse] = useState(false)
  const [lastActivity, setLastActivity] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to real-time changes in the user_activity table
    const channel = supabase
      .channel('realtime_analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
        },
        (payload) => {
          console.log('[REALTIME] New activity:', payload.new)
          setPulse(true)
          setLastActivity(payload.new)
          
          // Reset pulse effect after 3 seconds
          setTimeout(() => setPulse(false), 3000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-4 bg-[#0F172A] border ${pulse ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10'} p-5 rounded-2xl shadow-2xl transition-all duration-500 transform ${pulse ? 'scale-105' : 'scale-100 opacity-60 hover:opacity-100'}`}>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${pulse ? 'bg-emerald-400' : 'bg-slate-700'} transition-colors duration-300`} />
        {pulse && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        )}
      </div>
      
      <div className="flex flex-col min-w-[140px]">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">
            <Zap size={10} className={pulse ? 'text-amber-400' : ''} /> 
            Live Stream
          </p>
          {pulse && <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black animate-bounce">NEW</span>}
        </div>
        
        <p className="text-xs font-black text-white mt-0.5 uppercase tracking-tight">
          {pulse ? 'Activity Detected' : 'Monitoring Pulse'}
        </p>
        
        {lastActivity && (
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate max-w-[180px] italic">
            {lastActivity.activity_type.replace(/_/g, ' ')}
          </p>
        )}
      </div>
    </div>
  )
}
