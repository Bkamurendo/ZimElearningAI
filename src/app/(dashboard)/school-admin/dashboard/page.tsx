import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, Users, GraduationCap, TrendingUp, BarChart3, 
  MessageSquare, Settings, Share2, Sparkles, Star, Award,
  ArrowUpRight, School, BookOpen, UserCheck, ShieldCheck
} from 'lucide-react'

export const metadata = {
  title: 'Headmaster Dashboard – ZimLearn Elite',
  description: 'School-wide performance analytics and teacher efficiency tracking.',
}

export default async function SchoolAdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, school_id').eq('id', user.id).single()

  if (profile?.role !== 'school_admin' && profile?.role !== 'admin') redirect('/login')

  const { data: school } = await supabase
    .from('schools').select('*').eq('id', profile.school_id).single()

  const isElite = school?.subscription_plan === 'pro'

  const STATS = [
    { label: 'Total Students', value: '482', icon: <Users size={20} />, trend: '+12% this month' },
    { label: 'Avg. Grade (School)', value: '72%', icon: <GraduationCap size={20} />, trend: '+3% improvement' },
    { label: 'Teacher Activity', value: '89%', icon: <UserCheck size={20} />, trend: 'High Engagement' },
    { label: 'AI Savings (Hours)', value: '140', icon: <Sparkles size={20} />, trend: 'Weekly automated tasks' },
  ]

  const TOP_SUBJECTS = [
    { name: 'Mathematics', score: 84, color: 'bg-emerald-500' },
    { name: 'Physics', score: 79, color: 'bg-indigo-500' },
    { name: 'Biology', score: 71, color: 'bg-blue-500' },
    { name: 'History', score: 68, color: 'bg-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white pt-10 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <Building2 size={240} />
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
          <div>
            <div className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg w-fit">
              <ShieldCheck size={12} fill="currentColor" /> Institutional Elite
            </div>
            <h1 className="text-4xl font-black italic tracking-tight">{school?.name || 'ZimLearn Elite School'}</h1>
            <p className="text-slate-400 mt-2 text-lg font-medium">Performance monitoring and administrator control center.</p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/school-admin/communication" className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition flex items-center gap-2">
                <MessageSquare size={16} /> Bulk SMS / Parent Notice
             </Link>
             <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-2xl shadow-xl transition border border-indigo-400">
                <Settings size={20} />
             </button>
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
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 mt-1">{s.value}</h4>
                 <p className="text-[10px] font-bold text-emerald-500 mt-2 italic">{s.trend}</p>
              </div>
            ))}
         </div>

         {!isElite ? (
           <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden ring-4 ring-indigo-500/20 text-center">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                 <Sparkles size={180} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black italic mb-4 tracking-tight">Unlock School-Wide Performance Analytics</h2>
              <p className="text-indigo-100 max-w-lg mx-auto mb-8 text-lg font-medium leading-relaxed">
                 Upgrade to <span className="text-white font-bold underline underline-offset-4 decoration-indigo-400">School Elite</span> to monitor individual teacher effectiveness, student growth metrics, and custom branding for your institution.
              </p>
              <div className="flex justify-center gap-4">
                 <Link href="/school-admin/upgrade" className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-2xl transition hover:scale-105 hover:shadow-indigo-400/50">
                    See Elite Pricing <Star size={18} fill="currentColor" className="text-amber-400 inline ml-1" />
                 </Link>
              </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Performance Chart Placeholder */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <BarChart3 size={200} />
                 </div>
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h3 className="text-lg font-black italic tracking-tight uppercase">Subject Performance Matrix</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global average benchmark: 65%</p>
                    </div>
                    <select className="bg-slate-50 border-none rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-indigo-500 transition shadow-inner">
                       <option>This Term</option>
                       <option>Last Term</option>
                       <option>Yearly Average</option>
                    </select>
                 </div>
                 
                 <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {TOP_SUBJECTS.map(sub => (
                       <div key={sub.name} className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-black">
                             <span className="text-slate-600">{sub.name}</span>
                             <span className="text-slate-400">{sub.score}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                             <div className={`h-full ${sub.color} shadow-lg`} style={{ width: `${sub.score}%` }} />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Right: Teacher Analytics */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-8">
                    <Award size={20} className="text-amber-500" />
                    <h3 className="text-lg font-black italic tracking-tight uppercase">Teacher Activity</h3>
                 </div>
                 <p className="text-xs text-slate-400 mb-6 italic font-medium leading-relaxed">AI usage & Content creation scores based on CPD points.</p>
                 
                 <div className="space-y-4">
                    {[
                      { name: 'Mr. Chikumba (Math)', points: 480, level: 'Pro' },
                      { name: 'Mrs. Sibanda (Bio)', points: 425, level: 'Pro' },
                      { name: 'Dr. Tsvangirai (Phys)', points: 120, level: 'Starter' },
                    ].map((teacher, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition hover:bg-slate-100">
                         <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm capitalize">
                            {teacher.name.charAt(0)}
                         </div>
                         <div className="flex-1 leading-tight">
                            <p className="text-xs font-black text-slate-800">{teacher.name}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{teacher.level} Scholar</p>
                         </div>
                         <div className="text-xs font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-50 shadow-sm">
                            {teacher.points}
                         </div>
                      </div>
                    ))}
                 </div>

                 <button className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2 italic">
                   Full Teacher Insights Report <ArrowUpRight size={14} />
                 </button>
              </div>
           </div>
         )}

         {/* Bottom Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <BookOpen size={120} fill="currentColor" className="text-indigo-600" />
               </div>
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Syllabus Progress</h3>
               <p className="font-bold text-indigo-900 leading-relaxed mb-6 italic">The school is <span className="text-2xl font-black text-indigo-600">88%</span> synchronized with the ZIMSEC 2026 Curriculum calendar.</p>
               <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-indigo-500" style={{ width: '88%' }} />
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <Share2 size={120} fill="currentColor" className="text-slate-900" />
               </div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">System Uptime</h3>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                  <p className="text-2xl font-black text-slate-900 leading-none">99.9% Online</p>
               </div>
               <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Auto-Scale: ACTIVE · Nodes: 4</p>
            </div>
         </div>
      </div>
    </div>
  )
}
