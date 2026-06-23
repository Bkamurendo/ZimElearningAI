export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Compass, GraduationCap, Stethoscope,
  Cpu, Gavel, Sparkles, Star, ArrowRight,
  TrendingUp, BookCheck, Building2
} from 'lucide-react'

export const metadata = {
  title: 'AI Career Path Planner – ZimLearn Parent',
  description: 'AI-driven career and university recommendations based on your child\'s performance.',
}

export default async function ParentCareerPlannerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

  // Mock data for recommendation paths
  const PATHS = [
    {
      title: 'Medical & Health Sciences',
      target: 'University of Zimbabwe (UZ)',
      icon: <Stethoscope size={24} />,
      color: 'bg-rose-50 text-rose-600',
      reason: 'Strong performance in Biology and Chemistry (Top 5%).',
      aLevels: ['Biology', 'Chemistry', 'Math/Physics'],
      potential: 'Pharmacist, Surgeon, Medical Researcher'
    },
    {
      title: 'Software Engineering & AI',
      target: 'NUST / Harare Institute of Tech',
      icon: <Cpu size={24} />,
      color: 'bg-blue-50 text-blue-600',
      reason: 'Exceptional logic scores in Recent Math Quizzes.',
      aLevels: ['Math', 'Further Math', 'Physics/Computer Science'],
      potential: 'Full-stack Developer, Data Scientist'
    },
    {
      title: 'Commercial Law & Finance',
      target: 'Midlands State University (MSU)',
      icon: <Gavel size={24} />,
      color: 'bg-amber-50 text-amber-600',
      reason: 'High aptitude in Sociology and English Literature.',
      aLevels: ['English Literature', 'History', 'Economics'],
      potential: 'Corporate Lawyer, Investment Analyst'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-white border-b border-slate-100 pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
             <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
               <Sparkles size={12} fill="currentColor" /> AI-Powered Guidance
             </div>
             <h1 className="text-4xl font-black text-slate-900 italic tracking-tight mb-4">Career & University Planner</h1>
             <p className="text-slate-500 max-w-lg text-lg leading-relaxed font-medium">
               We analyze your child's ZIMSEC mock grades and study patterns to predict the best-fit career paths and university courses.
             </p>
          </div>
          <div className="w-full md:w-[380px]">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <Compass size={120} fill="currentColor" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Student Profile</p>
                <h3 className="text-2xl font-bold mb-6">Tinashe Mupfure</h3>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase">Current Level</span>
                      <span className="bg-indigo-500 px-2 py-0.5 rounded text-[10px]">O-LEVEL (Form 4)</span>
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 uppercase">Top Subject</span>
                      <span className="text-emerald-400">Mathematics (94%)</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8">
         {isPro ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PATHS.map((path, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 hover:border-indigo-200 transition-all group flex flex-col">
                   <div className={`w-14 h-14 ${path.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-current/10`}>
                      {path.icon}
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-1 italic tracking-tight">{path.title}</h3>
                   <p className="text-xs font-bold text-indigo-500 flex items-center gap-1 mb-4">
                      <Building2 size={12} /> {path.target}
                   </p>
                   
                   <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-50 italic text-[13px] text-slate-500 leading-relaxed">
                      "{path.reason}"
                   </div>

                   <div className="space-y-4 mb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recommended A-Levels</p>
                        <div className="flex flex-wrap gap-1.5">
                           {path.aLevels.map(sub => (
                             <span key={sub} className="text-[9px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700">{sub}</span>
                           ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Future Career Roles</p>
                        <p className="text-xs font-bold text-slate-600">{path.potential}</p>
                      </div>
                   </div>

                   <button className="mt-auto w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
                     Full Path Analysis <ArrowRight size={14} />
                   </button>
                </div>
              ))}
           </div>
         ) : (
           /* Locked State */
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-2 border-indigo-50 text-center max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Star size={200} fill="currentColor" className="text-indigo-600" />
              </div>
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-indigo-50/30">
                 <GraduationCap size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 italic mb-4">Unlock Your Child's Future</h2>
              <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                Our Career Planner requires a <span className="text-indigo-600 font-bold">Parent Pro</span> subscription. 
                Get direct insights into university requirements and ZIMSEC alignment for your child's unique performance.
              </p>
              <Link href="/parent/upgrade-monitoring" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition hover:scale-105 active:scale-95">
                 Upgrade to Parent Pro <Star size={18} fill="currentColor" className="text-amber-300" />
              </Link>
              <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-black">Starting at only $3/month</p>
           </div>
         )}
      </div>

      {/* Trust Section */}
      <div className="max-w-5xl mx-auto px-6 mt-16 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Data Sources & Trust</p>
         <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
               <TrendingUp size={20} /> ZIMSEC Grading Standard
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
               <BookCheck size={20} /> University Admittance Logic
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
               <Building2 size={20} /> National Skills Audit 2026
            </div>
         </div>
      </div>
    </div>
  )
}
