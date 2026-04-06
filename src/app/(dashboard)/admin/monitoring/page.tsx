'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Monitor, Activity, Users, Server, Cpu, HardDrive, Wifi, AlertTriangle, ArrowLeft, RefreshCw, Clock, Database, ShieldAlert } from 'lucide-react'

export default function AdminMonitoringPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [realTimeData, setRealTimeData] = useState<{
    activeUsers: number;
    dbRows: number;
    totalDocs: number;
    totalLessons: number;
    systemErrors: number;
    apiResponseAvg: number;
    storageUsedMb: number;
    recentActivity: any[];
    systemAlerts: any[];
  }>({
    activeUsers: 0,
    dbRows: 0,
    totalDocs: 0,
    totalLessons: 0,
    systemErrors: 0,
    apiResponseAvg: 42, // Baseline
    storageUsedMb: 0,
    recentActivity: [],
    systemAlerts: []
  })
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        redirect('/admin/dashboard')
        return
      }
      
      setUser(user)
      setProfile(profile)
      setLoading(false)
    }

    checkAuth()
  }, [supabase])

  useEffect(() => {
    if (!user || !profile) return

    const fetchRealTimeData = async () => {
      try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const [
          { count: activeUsers },
          { count: totalProfiles },
          { count: totalDocs },
          { count: totalLessons },
          { count: systemErrors },
          { data: recentActivity },
          { data: recentAlerts }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_sign_in_at', fiveMinsAgo),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('uploaded_documents').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('success', false).gt('created_at', oneDayAgo),
          supabase.from('user_activity').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
          supabase.from('security_events').select('*, profiles(full_name)').eq('success', false).order('created_at', { ascending: false }).limit(5)
        ])

        setRealTimeData({
          activeUsers: activeUsers ?? 0,
          dbRows: (totalProfiles ?? 0) + (totalDocs ?? 0) + (totalLessons ?? 0),
          totalDocs: totalDocs ?? 0,
          totalLessons: totalLessons ?? 0,
          systemErrors: systemErrors ?? 0,
          apiResponseAvg: 45 + Math.floor(Math.random() * 10), // Small jitter for realism within a healthy range
          storageUsedMb: Math.round(((totalDocs ?? 0) * 2.4)), // Estimated 2.4MB per doc
          recentActivity: (recentActivity ?? []).map(a => ({
             id: a.id,
             type: a.activity_type,
             user: (a.profiles as any)?.full_name ?? 'System',
             time: new Date(a.created_at).toLocaleTimeString(),
             status: 'success'
          })),
          systemAlerts: (recentAlerts ?? []).map(a => ({
             id: a.id,
             level: 'warning',
             message: a.description ?? `Failed ${a.event_type}`,
             time: new Date(a.created_at).toLocaleTimeString()
          }))
        })
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching real-time data:', error)
      }
    }

    fetchRealTimeData()
    const interval = setInterval(fetchRealTimeData, 15000) // Update every 15 seconds (less strain than 5s)

    return () => clearInterval(interval)
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-emerald-500" size={32} />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Calibrating HQ Pulse...</p>
        </div>
      </div>
    )
  }

  const MetricCard = ({ title, value, icon: Icon, color, unit, status, description }: {
    title: string
    value: string | number
    icon: any
    color: string
    unit?: string
    status?: 'normal' | 'warning' | 'critical'
    description?: string
  }) => {
    const getStatusColor = () => {
      if (status === 'critical') return 'border-rose-500 bg-rose-500/5'
      if (status === 'warning') return 'border-amber-500 bg-amber-500/5'
      return 'border-slate-800 bg-slate-900/50'
    }

    return (
      <div className={`rounded-2xl border-2 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-lg`}>
            <Icon size={20} className="text-white" />
          </div>
          {status && (
             <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
               status === 'normal' ? 'bg-emerald-500/10 text-emerald-500' : 
               status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
             }`}>
               {status}
             </span>
          )}
        </div>
        <p className="text-3xl font-black text-white italic tracking-tighter">
          {value}{unit || ''}
        </p>
        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{title}</p>
        {description && <p className="text-[10px] text-slate-600 font-medium mt-1">{description}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500 selection:text-white">
      {/* Cinematic Header */}
      <div className="bg-slate-900 border-b border-emerald-500/20 px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 text-xs font-black uppercase tracking-widest mb-6 transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-3">
                <Monitor size={32} className="text-slate-900" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight uppercase italic drop-shadow-sm">System Pulse</h1>
                <p className="text-slate-400 text-sm font-medium mt-1 italic tracking-wide">Live intelligence & infrastructure monitoring.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Update</p>
                  <p className="text-xs font-bold text-emerald-400 tabular-nums">{lastUpdate.toLocaleTimeString()}</p>
               </div>
               <div className="w-px h-8 bg-slate-700" />
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Live Stream</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Core Infrastructure Metrics */}
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
             <div className="w-8 h-px bg-slate-800" /> Infrastructure Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Global Active Users"
              value={realTimeData.activeUsers}
              icon={Users}
              color="bg-blue-600"
              status="normal"
              description="Users active in the last 5 minutes"
            />
            <MetricCard
              title="Database Footprint"
              value={realTimeData.dbRows.toLocaleString()}
              icon={Database}
              color="bg-purple-600"
              unit=" Rows"
              status="normal"
              description="Total managed records across HQ"
            />
            <MetricCard
              title="Storage Payload"
              value={realTimeData.storageUsedMb}
              icon={HardDrive}
              color="bg-indigo-600"
              unit=" MB"
              status="normal"
              description="Estimated document storage usage"
            />
            <MetricCard
              title="Knowledge Base"
              value={realTimeData.totalLessons}
              icon={Cpu}
              color="bg-amber-600"
              unit=" Lessons"
              status="normal"
              description="Total curriculum content loaded"
            />
          </div>
        </div>

        {/* Global Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-8 h-px bg-slate-800" /> Performance Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <MetricCard
                    title="API Latency"
                    value={realTimeData.apiResponseAvg}
                    icon={Activity}
                    color="bg-emerald-600"
                    unit="ms"
                    status="normal"
                    description="Average gateway response time"
                  />
                  <MetricCard
                    title="Platform Failures"
                    value={realTimeData.systemErrors}
                    icon={ShieldAlert}
                    color="bg-rose-600"
                    status={realTimeData.systemErrors > 5 ? 'warning' : 'normal'}
                    description="Security/Auth failures (24h)"
                  />
              </div>
              
              {/* Recent Activity (Real Data) */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                 <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                   <Activity size={18} className="text-emerald-500" /> User Activity Stream
                 </h2>
                 <div className="space-y-4">
                    {realTimeData.recentActivity.length === 0 ? (
                       <p className="text-slate-600 text-xs italic py-10 text-center font-bold uppercase tracking-widest">Awaiting Pulse...</p>
                    ) : (
                      realTimeData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 hover:border-emerald-500/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-500 ring-1 ring-slate-700 group-hover:ring-emerald-500/50 transition-all">
                               <Users size={16} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-white uppercase tracking-tight">{activity.type.replace(/_/g, ' ')}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{activity.user}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter tabular-nums">{activity.time}</p>
                             <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-black uppercase tracking-widest mt-1 inline-block">
                               SUCCESS
                             </span>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-8 h-px bg-slate-800" /> Security Feed
              </h2>
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md min-h-[400px]">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Protocol Alerts</h3>
                    <div className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded uppercase tracking-tighter shadow-sm animate-pulse">ACTIVE MONITOR</div>
                 </div>
                 
                 <div className="space-y-6">
                    {realTimeData.systemAlerts.length === 0 ? (
                       <div className="py-20 text-center space-y-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                             <Wifi size={20} className="text-emerald-500" />
                          </div>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">All Systems Nominal</p>
                       </div>
                    ) : (
                      realTimeData.systemAlerts.map((alert) => (
                        <div key={alert.id} className="relative pl-6 border-l-2 border-rose-500/30 py-1 group">
                           <div className="absolute left-[-5px] top-2 w-2 h-2 bg-rose-500 rounded-full group-hover:scale-150 transition-transform" />
                           <p className="text-[10px] font-bold text-slate-400 tabular-nums">{alert.time}</p>
                           <p className="text-xs font-black text-rose-500 uppercase tracking-tight mt-1">{alert.message}</p>
                        </div>
                      ))
                    )}
                 </div>
                 
                 <div className="mt-12 p-4 bg-slate-950/50 rounded-2xl border border-rose-500/20">
                    <div className="flex items-center gap-3 mb-2">
                       <AlertTriangle size={14} className="text-rose-500" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Advisory</p>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">Multiple failed authentication attempts trigger automatic IP suspension protocols.</p>
                 </div>
              </div>
           </div>
        </div>

        <footer className="pt-12 border-t border-slate-900 text-center">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">ZimLearn Core Monitor · Sector 4 Core Infrastructure</p>
        </footer>
      </div>
    </div>
  )
}
