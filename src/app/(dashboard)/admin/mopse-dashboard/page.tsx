import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { 
  BarChart3, Users, Building2, Globe, 
  ShieldCheck, Download, Filter, Search 
} from 'lucide-react'
import { MinistryHeatmap } from './MinistryHeatmap'

export default async function MoPSEDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ROLE CHECK: Only Admin or Ministry role can access this
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'ministry') {
    redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Premium Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase">National Command Center</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">MoPSE Institutional Governance · 2026 Audit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
               <ShieldCheck size={16} className="text-teal-400" />
               <span className="text-xs font-bold text-slate-300">Verified Ministry Access</span>
             </div>
             <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition">
               <Filter size={20} />
             </button>
             <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition shadow-lg shadow-teal-600/20">
               <Download size={18} />
               Report
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'National Enrollment', val: '1.24M', sub: '+12% vs 2025', icon: Users, color: 'indigo' },
            { label: 'Readiness Index', val: '54.2%', sub: 'Target: 70%', icon: BarChart3, color: 'teal' },
            { label: 'Active Institutions', val: '2,481', sub: 'Primary & Secondary', icon: Building2, color: 'blue' },
            { label: 'AI Mentorship Rate', val: '89%', sub: 'Avg 4.2h / Week', icon: Globe, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
              <div className={`w-14 h-14 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                   <span className="text-[10px] font-bold text-emerald-500">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Map Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search schools, districts, or provinces..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {['All Regions', 'Critical Areas', 'Primary Schools', 'A-Level Centers'].map(tab => (
              <button key={tab} className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm">
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* The Heatmap */}
        <MinistryHeatmap />

        {/* Bottom Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Top 10 Performing Districts */}
           <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">District Performance Ranking</h3>
                <button className="text-teal-600 font-bold text-xs uppercase tracking-widest hover:underline">View All 60 Districts</button>
              </div>
              <div className="space-y-4">
                 {[
                   { name: 'Goromonzi', readiness: 88, students: 4200, rank: 'High' },
                   { name: 'Murehwa', readiness: 84, students: 3800, rank: 'High' },
                   { name: 'Kwekwe', readiness: 79, students: 5100, rank: 'High' },
                   { name: 'Mutare City', readiness: 72, students: 8200, rank: 'Med' },
                   { name: 'Bindura', readiness: 68, students: 3400, rank: 'Med' },
                 ].map((d, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-black text-slate-400">0{i+1}</span>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{d.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{d.students} active students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                           <p className="text-sm font-black text-slate-900">{d.readiness}%</p>
                           <div className="w-24 bg-gray-200 h-1 rounded-full mt-1">
                             <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${d.readiness}%` }} />
                           </div>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           d.rank === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                         }`}>
                           {d.rank}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Alerts & Interventions */}
           <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-900/20 text-white flex flex-col">
              <h3 className="text-lg font-black uppercase tracking-widest mb-2 text-teal-400">Active Interventions</h3>
              <p className="text-slate-400 text-xs mb-8">AI-triggered remediation missions at scale</p>
              
              <div className="space-y-6 flex-1">
                 {[
                   { area: 'Matabeleland North', type: 'Reading Gap', active: 1400, priority: 'Critical' },
                   { area: 'Mash Central', type: 'Math Remediation', active: 2200, priority: 'High' },
                   { area: 'Masvingo Rural', type: 'Offline Pack Deployment', active: 850, priority: 'Medium' },
                 ].map((alert, i) => (
                   <div key={i} className="border-l-2 border-teal-500 pl-4 py-1">
                      <p className="text-xs font-black text-teal-400 uppercase tracking-tighter">{alert.area}</p>
                      <p className="text-sm font-bold mt-0.5">{alert.type}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{alert.active} students currently in Recovery Missions</p>
                   </div>
                 ))}
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Forecast</p>
                 <p className="text-sm font-medium leading-relaxed">
                   Current remediation speed predicts a <span className="text-teal-400 font-black">+4.2%</span> national ZIMSEC pass rate increase for the 2026 cycle.
                 </p>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
