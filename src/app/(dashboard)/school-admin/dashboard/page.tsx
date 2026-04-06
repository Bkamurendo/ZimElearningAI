import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, Users, GraduationCap, TrendingUp, BarChart3, 
  MessageSquare, Settings, Share2, Sparkles, Star, Award,
  ArrowUpRight, School, BookOpen, UserCheck, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { isRedirectError } from 'next/dist/client/components/redirect'

export const metadata = {
  title: 'Headmaster Dashboard – ZimLearn Elite',
  description: 'School-wide performance analytics and teacher efficiency tracking.',
}

export default async function SchoolAdminDashboard() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profile?.role?.toLowerCase() !== 'school_admin' && profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    const { data: school } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single()

    const isElite = school?.subscription_plan === 'pro' || school?.subscription_plan === 'elite'

    const STATS = [
      { label: 'Total Students', value: '482', icon: <Users size={20} />, trend: '+12% THIS MONTH' },
      { label: 'AVG. GRADE (SCHOOL)', value: '72%', icon: <GraduationCap size={20} />, trend: '+3% IMPROVEMENT' },
      { label: 'TEACHER ACTIVITY', value: '89%', icon: <UserCheck size={20} />, trend: 'HIGH ENGAGEMENT' },
      { label: 'AI SAVINGS (HOURS)', value: '140', icon: <Sparkles size={20} />, trend: 'WEEKLY AUTOMATED TASKS' },
    ]

    const TOP_SUBJECTS = [
      { name: 'MATHEMATICS', score: 84, color: 'bg-emerald-500' },
      { name: 'PHYSICS', score: 79, color: 'bg-indigo-500' },
      { name: 'BIOLOGY', score: 71, color: 'bg-blue-500' },
      { name: 'HISTORY', score: 68, color: 'bg-amber-500' },
    ]

    return (
      <div className="min-h-screen bg-slate-50/50 pb-20 font-bold uppercase">
        
        {/* Top Banner */}
        <div className="bg-slate-900 text-white pt-10 pb-20 px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
             <Building2 size={240} />
          </div>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div>
              <div className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg w-fit">
                <ShieldCheck size={12} fill="currentColor" /> INSTITUTIONAL ELITE
              </div>
              <h1 className="text-4xl font-black italic tracking-tight uppercase">{school?.name || 'ZIMLEARN ELITE SCHOOL'}</h1>
              <p className="text-slate-400 mt-2 text-sm font-medium uppercase tracking-tight">Institutional identity and performance control center.</p>
            </div>
            <div className="flex items-center gap-3">
               <Link href="/school-admin/communication" className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] shadow-xl transition flex items-center gap-2 uppercase tracking-widest">
                  <MessageSquare size={16} /> BULK SMS / PARENT NOTICE
               </Link>
               <Link href="/school-admin/settings">
                 <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-2xl shadow-xl transition border border-indigo-400">
                    <Settings size={20} />
                 </button>
               </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 -mt-12 space-y-8">
           
           {/* Stats Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map(s => (
                <div key={s.label} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 group hover:shadow-2xl transition-all duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                         {s.icon}
                      </div>
                      <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                   <h4 className="text-2xl font-black text-slate-900 mt-1 uppercase italic tracking-tighter">{s.value}</h4>
                   <p className="text-[9px] font-bold text-emerald-500 mt-2 uppercase italic">{s.trend}</p>
                </div>
              ))}
           </div>

           {!isElite ? (
             <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden ring-4 ring-indigo-500/20 text-center uppercase">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                   <Sparkles size={180} fill="currentColor" />
                </div>
                <h2 className="text-3xl font-black italic mb-4 tracking-tight">Institutional Performance Analytics</h2>
                <p className="text-indigo-100 max-w-lg mx-auto mb-8 text-sm font-medium uppercase leading-relaxed italic">
                   Upgrade to <span className="text-white font-bold underline underline-offset-4 decoration-indigo-400">School Elite</span> to monitor individual teacher efficiency and student throughput.
                </p>
                <div className="flex justify-center gap-4">
                   <Link href="/school-admin/settings" className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-2xl transition hover:scale-105 text-[10px] uppercase tracking-widest">
                      UPGRADE RANK <Star size={18} fill="currentColor" className="text-amber-400 inline ml-1" />
                   </Link>
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden uppercase">
                   <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                      <BarChart3 size={200} />
                   </div>
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-lg font-black italic tracking-tight uppercase">Performance Matrix</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Benchmark: 65%</p>
                      </div>
                   </div>
                   
                   <div className="space-y-6 flex-1 flex flex-col justify-center uppercase">
                      {TOP_SUBJECTS.map(sub => (
                         <div key={sub.name} className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black">
                               <span className="text-slate-600">{sub.name}</span>
                               <span className="text-slate-400">{sub.score}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden shadow-inner flex">
                               <div className={`h-full ${sub.color} shadow-lg`} style={{ width: `${sub.score}%` }} />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden uppercase">
                   <div className="flex items-center gap-2 mb-8">
                      <Award size={20} className="text-amber-500" />
                      <h3 className="text-lg font-black italic tracking-tight uppercase">Faculty Status</h3>
                   </div>
                   <p className="text-[10px] text-slate-400 mb-6 italic font-bold uppercase">AI through-put & content scoring index.</p>
                   
                   <div className="space-y-4 uppercase">
                      {[
                        { name: 'MR. CHIKUMBA', points: 480, level: 'PRO' },
                        { name: 'MRS. SIBANDA', points: 425, level: 'PRO' },
                        { name: 'DR. TSVANGIRAI', points: 120, level: 'BASIC' },
                      ].map((teacher, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm transition hover:bg-slate-100/50">
                           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm uppercase italic">
                              {teacher.name.charAt(0)}
                           </div>
                           <div className="flex-1 leading-tight">
                              <p className="text-[11px] font-black text-slate-800">{teacher.name}</p>
                              <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{teacher.level} SCHOLAR</p>
                           </div>
                           <div className="text-[10px] font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-50 shadow-sm">
                              {teacher.points}
                           </div>
                        </div>
                      ))}
                   </div>

                   <Link href="/school-admin/teachers" className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2 italic uppercase tracking-widest">
                     FACULTY IDENTITY REPORT <ArrowUpRight size={14} />
                   </Link>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 uppercase">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100/20 relative overflow-hidden group uppercase font-bold">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <BookOpen size={120} fill="currentColor" className="text-indigo-600" />
                 </div>
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Curriculum Sync</h3>
                 <p className="font-bold text-indigo-900 leading-relaxed mb-6 italic uppercase">SYNC STATUS: <span className="text-2xl font-black text-indigo-600 uppercase tracking-tighter">88% ZIMSEC</span> 2026 CALENDAR ALIGNMENT.</p>
                 <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner border border-indigo-100">
                    <div className="h-full bg-indigo-500" style={{ width: '88%' }} />
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden group sm:col-span-2 lg:col-span-1 uppercase font-bold">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <Share2 size={120} fill="currentColor" className="text-slate-900" />
                 </div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Identity Server</h3>
                 <div className="flex items-center gap-3 uppercase font-black">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                    <p className="text-lg font-black text-slate-900 leading-none uppercase tracking-tight">SYSTEM UPTIME: 99.9%</p>
                 </div>
                 <p className="text-[9px] text-slate-500 mt-4 uppercase font-black tracking-widest italic leading-none">AUTO-SCALE: NOMINAL · NODES: 4 · ENCRYPTED</p>
              </div>
           </div>
        </div>
      </div>
    )
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[SchoolAdminDashboard] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50 uppercase font-bold">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <School size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Institutional Sync Failed</h2>
        <p className="text-slate-500 max-w-xs uppercase font-bold italic">We encountered an error while loading the institutional command center. Please verify identity.</p>
        <Link href="/login">
          <Button variant="outline">Re-authenticate</Button>
        </Link>
      </div>
    )
  }
}
