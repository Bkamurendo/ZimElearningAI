export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Star, Zap, Trophy, ArrowRight, Sparkles, GraduationCap, Printer, Clock } from 'lucide-react'
import ClaimCertificateButton from './ClaimCertificateButton'

export const metadata = {
  title: 'Teacher CPD – ZimLearn AI',
  description: 'Track your Continuing Professional Development points and earn certifications.',
}

export default async function TeacherCPDPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('plan, full_name').eq('id', user.id).single()

  // Get CPD points
  const { data: pointsData } = await supabase
    .from('teacher_cpd_points')
    .select('points, activity_type, created_at, description')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
  
  const totalPoints = (pointsData ?? []).reduce((acc, curr) => acc + curr.points, 0)
  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite'

  // Get earned certificates
  const { data: earnedCerts } = await supabase
    .from('teacher_certificates')
    .select('*')
    .eq('teacher_id', user.id)

  const certMap = Object.fromEntries((earnedCerts ?? []).map(c => [c.certificate_type, c]))

  const CERT_CONFIG = [
    { id: 'foundation', name: 'AI Educator Foundation', threshold: 50, icon: <Zap size={24} />, description: 'Mastered the basics of AI-assisted lesson planning.' },
    { id: 'specialist', name: 'STEM Integration Specialist', threshold: 150, icon: <GraduationCap size={24} />, description: 'Expert in using AI for ZIMSEC Science & Math.' },
    { id: 'master', name: 'Master Digital Educator', threshold: 500, icon: <Trophy size={24} />, description: 'The highest honor for ZimLearn teachers.' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-slate-900 border-b border-slate-800 pt-10 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <Award size={240} fill="currentColor" className="text-indigo-400" />
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
          <div className="flex-1">
             <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-indigo-500/30 w-fit">
                <Star size={12} fill="currentColor" /> Professional Excellence
             </div>
             <h1 className="text-4xl font-black italic tracking-tight text-white">Teacher CPD Portal</h1>
             <p className="text-slate-400 mt-2 text-lg font-medium max-w-xl">
               Your professional trajectory is powered by AI. Earn credits for high-value pedagogic activities and receive national-standard certifications.
             </p>
          </div>
          <div className="w-full md:w-80">
             <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-indigo-500 h-full">
                <div className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-500">
                   <Trophy size={140} fill="currentColor" />
                </div>
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Current Status</p>
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2 italic">
                  {isPro ? 'Pro Educator' : 'Aspiring Scholar'} <Star size={20} fill="currentColor" className="text-amber-300 shadow-sm" />
                </h3>
                {!isPro && (
                  <Link href="/teacher/upgrade" className="bg-white text-indigo-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-indigo-50 transition w-full shadow-xl flex items-center justify-center gap-2">
                    Upgrade to Claim <ArrowRight size={14} />
                  </Link>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 -mt-10 space-y-12">
        
        {/* Progress Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-10 ring-1 ring-black/5">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 flex items-center justify-center text-4xl font-black text-slate-900 group-hover:scale-110 transition-transform bg-white shadow-inner">
                  {totalPoints}
                </div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white rotate-12">
                  <Star size={24} fill="currentColor" />
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-black text-slate-900 italic mb-2 tracking-tight">Accredited CPD Credits</h2>
                <p className="text-slate-400 text-sm mb-6 font-bold uppercase tracking-widest leading-none">
                   Next Goal: {totalPoints >= 500 ? 'Master Digital Educator Reached' : `${Math.max(50, totalPoints <= 50 ? 50 : totalPoints <= 150 ? 150 : 500) - totalPoints} points to reward`}
                </p>
                <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100 p-1 flex">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full shadow-lg" 
                    style={{ width: `${Math.min((totalPoints / 500) * 100, 100)}%` }} 
                  />
                </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <Clock size={100} />
              </div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Recent Activity</h3>
              <div className="space-y-4">
                 {(pointsData ?? []).slice(0, 3).map((act, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div>
                        <p className="text-xs font-black text-slate-700 truncate max-w-[140px] uppercase tracking-tight italic">{act.activity_type.replace('_', ' ')}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(act.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">+{act.points}</span>
                   </div>
                 ))}
                 {(pointsData ?? []).length === 0 && <p className="text-xs text-slate-400 italic">No activity registered yet.</p>}
              </div>
           </div>
        </div>

        {/* Certificates Matrix */}
        <section>
          <div className="flex items-center justify-between mb-8">
             <div>
                <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase flex items-center gap-3">
                   <Award size={24} className="text-amber-500" /> Accreditation Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-bold tracking-widest italic leading-none">Certificates are legally verifiable credentials provided by ZimLearn.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CERT_CONFIG.map(cert => {
              const unlocked = totalPoints >= cert.threshold
              const existingCert = certMap[cert.id]

              return (
                <div key={cert.id} className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative overflow-hidden flex flex-col group ${unlocked ? 'border-indigo-100 shadow-2xl scale-100' : 'border-slate-50 opacity-60 grayscale'}`}>
                   <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-xl transition-transform group-hover:scale-110 ${unlocked ? 'bg-slate-900 text-white rotate-6' : 'bg-slate-100 text-slate-300'}`}>
                    {cert.icon}
                   </div>
                   <h3 className="text-lg font-black text-slate-900 mb-2 italic tracking-tight">{cert.name}</h3>
                   <p className="text-[13px] text-slate-500 mb-10 leading-relaxed font-medium italic opacity-80">{cert.description}</p>
                   
                   <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{cert.threshold} XP GOAL</span>
                     
                     {unlocked ? (
                       existingCert ? (
                         <Link href={`/teacher/certificates/${existingCert.id}/print`} className="text-indigo-600 hover:text-black flex items-center gap-2 text-xs font-black transition-colors group-hover:translate-x-1">
                           <Printer size={16} /> PRINT CREDENTIAL
                         </Link>
                       ) : (
                         <ClaimCertificateButton 
                           certId={cert.id} 
                           certName={cert.name} 
                           isPro={isPro} 
                         />
                       )
                     ) : (
                       <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] italic">LOCKED</span>
                     )}
                   </div>
                   
                   {unlocked && !existingCert && (
                      <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-xl animate-pulse">
                         Ready to Claim
                      </div>
                   )}
                </div>
              )
            })}
          </div>
        </section>

        {/* High Value Activities */}
        <section className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-[0_40px_80px_rgba(0,0,0,0.2)] border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 text-indigo-500 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Sparkles size={180} fill="currentColor" />
          </div>
          <div className="max-w-2xl relative">
            <h2 className="text-3xl font-black italic mb-4 tracking-tight">Earn XP for High-Value Pedagogy</h2>
            <p className="text-indigo-200 mb-12 text-lg font-medium leading-relaxed italic">The following professional activities are credited on ZimLearn. Automated grading and bulk resource creation earn the highest rewards.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: 'AI Auto-Grading', xp: 10, detail: 'Vision-powered feedback' },
                { label: 'Resource Creation', xp: 15, detail: 'Adding to Question Bank' },
                { label: 'Quiz Distribution', xp: 5, detail: 'Live classroom tests' },
                { label: 'Syllabus Alignment', xp: 20, detail: 'ZIMSEC calendar sync' },
              ].map(act => (
                <div key={act.label} className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm group/act hover:bg-indigo-600 hover:border-indigo-400 transition-all">
                  <p className="text-[10px] font-black text-indigo-400 group-hover/act:text-indigo-200 uppercase tracking-widest mb-1 italic">+{act.xp} Credits</p>
                  <p className="text-base font-black italic tracking-tight">{act.label}</p>
                  <p className="text-[10px] text-slate-400 group-hover/act:text-indigo-100 font-bold uppercase mt-2">{act.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
