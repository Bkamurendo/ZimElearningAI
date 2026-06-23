export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  TrendingUp, TrendingDown,
  BrainCircuit, Sparkles, Star, Download,
  FileWarning, Microscope
} from 'lucide-react'

export const metadata = {
  title: 'Learning Gap Analysis – ZimLearn Parent',
  description: 'Deep-dive into your child\'s syllabus mastery and learning gaps.',
}

export default async function LearningGapAnalysisPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

  const GAPS = [
    {
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      mastery: 22,
      status: 'critical',
      insight: 'Consistently failing to apply the quadratic formula. Needs remedial practice on square roots.',
      resources: ['Quadratic formula video', '10 Practice Problems']
    },
    {
      subject: 'Biology',
      topic: 'Cell Structure',
      mastery: 45,
      status: 'warning',
      insight: 'Understand cells but confuses plant vs animal organelle functions.',
      resources: ['Organelle comparison chart']
    },
    {
      subject: 'English Language',
      topic: 'Direct & Indirect Speech',
      mastery: 88,
      status: 'mastered',
      insight: 'Full proficiency. Moving to advanced narrative techniques.',
      resources: []
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 pt-10 pb-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
             <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <BrainCircuit size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">AI Diagnostic Engine</span>
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Syllabus Mastery & Gaps</h1>
             <p className="text-slate-400 mt-2 text-sm font-medium">Real-time diagnosis of every ZIMSEC topic your child has touched.</p>
          </div>
          {isPro && (
             <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-black text-white text-xs font-bold rounded-2xl transition shadow-xl shadow-indigo-100 group">
                <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Download PDF Report
             </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
         {!isPro ? (
           /* Locked State */
           <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border-2 border-indigo-50 text-center relative overflow-hidden ring-1 ring-black/5">
              <div className="absolute -top-10 -right-10 p-20 opacity-5">
                 <FileWarning size={240} className="text-indigo-600" />
              </div>
              <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-indigo-50/50">
                 <Microscope size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 italic tracking-tight mb-3">Identify Learning Gaps Early</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed text-sm font-medium italic">
                Don't wait for final results. Get a deep-dive syllabus analysis and remedial video links for your child.
              </p>
              <Link href="/parent/upgrade-monitoring" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-black transition hover:scale-105 active:scale-95 shadow-2xl">
                 Upgrade to Parent Pro <Star size={18} fill="currentColor" className="text-amber-400" />
              </Link>
           </div>
         ) : (
           <div className="space-y-6">
              {/* Gap Cards */}
              <div className="grid grid-cols-1 gap-4">
                 {GAPS.map((gap, i) => (
                   <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-indigo-100 transition-colors">
                      <div className="flex-1 w-full">
                         <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">{gap.subject}</h3>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${
                               gap.status === 'critical' ? 'bg-red-50 text-red-600' : 
                               gap.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                               {gap.status}
                            </span>
                         </div>
                         <h4 className="text-lg font-black text-slate-900 italic tracking-tight">{gap.topic}</h4>
                         <p className="text-xs text-slate-400 mt-1 italic font-medium leading-relaxed">{gap.insight}</p>
                         
                         {gap.resources.length > 0 && (
                           <div className="mt-4 flex flex-wrap gap-2">
                             <span className="text-[10px] text-indigo-400 font-black uppercase mt-1">REMEDIALS:</span>
                             {gap.resources.map(res => (
                               <Link href="#" key={res} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition group flex items-center gap-1 shadow-sm">
                                  <Sparkles size={10} fill="currentColor" /> {res}
                               </Link>
                             ))}
                           </div>
                         )}
                      </div>

                      <div className="w-full md:w-32 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-50 ring-1 ring-black/5">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mastery</p>
                         <div className="relative flex items-center justify-center">
                            <span className={`text-2xl font-black italic ${
                               gap.status === 'critical' ? 'text-red-600' : 
                               gap.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                               {gap.mastery}%
                            </span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden shadow-inner">
                            <div 
                              className={`h-full ${
                                gap.status === 'critical' ? 'bg-red-500' : 
                                gap.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${gap.mastery}%` }}
                            />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                 <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform duration-500">
                       <TrendingDown size={140} />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Immediate Risk</h3>
                    <p className="text-4xl font-black text-red-500 italic">02 <span className="text-lg text-slate-300">Topics</span></p>
                    <p className="text-xs text-slate-400 mt-2 italic font-medium leading-relaxed">Topics requiring under 40% mastery to pass mock thresholds.</p>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-500">
                       <TrendingUp size={140} />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Elite Mastery</h3>
                    <p className="text-4xl font-black text-emerald-400 italic">14 <span className="text-lg text-white/20">Topics</span></p>
                    <p className="text-xs text-slate-400 mt-2 italic font-medium leading-relaxed">Topics where the student scores above 85% consistently.</p>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  )
}
