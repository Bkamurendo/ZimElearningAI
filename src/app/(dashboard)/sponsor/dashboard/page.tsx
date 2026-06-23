import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { 
  Heart, Users, Award, TrendingUp, 
  BarChart3, Plus, ExternalLink, ShieldCheck 
} from 'lucide-react'

export default async function SponsorDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ROLE CHECK: Only Sponsor role can access this
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'sponsor' && profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  // Fetch Sponsor Stats
  // (In a real app, we would join with scholarship_pools and sponsored_students)
  const stats = {
    totalSponsorships: 450,
    activeStudents: 412,
    avgReadiness: 68,
    impactScore: 'High',
    topSubject: 'Mathematics'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Heart size={26} className="text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Sponsor Impact Portal</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{profile.full_name} · Corporate CSR</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition shadow-lg shadow-indigo-100">
               <Plus size={18} />
               Grant Slots
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
               <Users size={20} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students Funded</p>
             <p className="text-2xl font-black text-slate-900">{stats.totalSponsorships}</p>
             <p className="text-[10px] text-emerald-500 font-bold mt-1">92% Retention Rate</p>
           </div>
           
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
               <TrendingUp size={20} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Academic ROI</p>
             <p className="text-2xl font-black text-slate-900">+{stats.avgReadiness}%</p>
             <p className="text-[10px] text-slate-400 font-bold mt-1">Readiness Increase</p>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
               <Award size={20} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact Score</p>
             <p className="text-2xl font-black text-slate-900">{stats.impactScore}</p>
             <p className="text-[10px] text-slate-400 font-bold mt-1">National Percentile: Top 5%</p>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
               <BarChart3 size={20} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Top Subject</p>
             <p className="text-2xl font-black text-slate-900">{stats.topSubject}</p>
             <p className="text-[10px] text-slate-400 font-bold mt-1">Science & Technology</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Active Scholarship Pools */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Active Sponsorship Pools</h3>
                <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest">View All History</button>
              </div>

              {[
                { name: 'Econet 2026 Stem Scholarship', slots: '500', used: 412, end: 'Dec 2026', color: 'indigo' },
                { name: 'CBZ Rural Outreach Fund', slots: '250', used: 110, end: 'Aug 2026', color: 'blue' },
              ].map((pool, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 overflow-hidden relative">
                   <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">{pool.name}</h4>
                        <p className="text-xs text-slate-400 font-medium italic">Supporting high-potential STEM students across Zimbabwe</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">
                        Active
                      </span>
                   </div>

                   <div className="mt-8 grid grid-cols-3 gap-8 relative z-10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                        <p className="text-xl font-black text-slate-900">{pool.used} / {pool.slots}</p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                           <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(pool.used/parseInt(pool.slots))*100}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry</p>
                        <p className="text-xl font-black text-slate-900">{pool.end}</p>
                      </div>
                      <div className="flex items-end justify-end">
                         <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition flex items-center gap-2">
                            Manage Pool <ExternalLink size={12} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           {/* ROI Insights */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                   <Award size={20} className="text-yellow-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Strategic ROI</h3>
              </div>

              <div className="space-y-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Social Impact</p>
                   <p className="text-sm font-medium leading-relaxed">
                     Your sponsorship has generated <span className="text-teal-400 font-black">18,400+ hours</span> of quality ZIMSEC learning for disadvantaged students.
                   </p>
                 </div>

                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Academic Breakthroughs</p>
                   <p className="text-sm font-medium leading-relaxed">
                     <span className="text-indigo-400 font-black">64 students</span> in your pool have jumped from 'D' to 'B' grades in the last 60 days.
                   </p>
                 </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <ShieldCheck size={20} className="text-teal-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CSR Verification</p>
                      <p className="text-[10px] font-medium text-slate-300">Audited by ZimLearn Transparency Engine</p>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-xl">
                   Download CSR Report
                 </button>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
