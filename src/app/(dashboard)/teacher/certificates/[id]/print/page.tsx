import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { 
  Award, ShieldCheck, GraduationCap, Calendar, 
  MapPin, Printer, Download, Share2, Sparkles, Star
} from 'lucide-react'
import Image from 'next/image'

export const metadata = {
  title: 'ZimLearn | Certificate of Excellence',
  description: 'ZimLearn Professional Teacher CPD Certificate.',
}

export default async function CertificatePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cert } = await supabase
    .from('teacher_certificates')
    .select('*, teacher:profiles(full_name)')
    .eq('id', params.id)
    .single()

  if (!cert) notFound()

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-20 print:p-0 print:bg-white">
      
      {/* Controls Overlay (Hidden on Print) */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white z-50 print:hidden transition hover:scale-105">
         <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition">
            <Printer size={14} /> Print Certificate
         </button>
         <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition">
            <Download size={14} /> Download PDF
         </button>
      </div>

      {/* The Certificate Canvas */}
      <div className="relative w-full max-w-[1000px] aspect-[1.414/1] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-[20px] border-double border-slate-900 p-12 overflow-hidden flex flex-col group print:shadow-none print:border-slate-300 print:w-full print:max-w-none">
         
         {/* Artistic Background Overlays */}
         <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <GraduationCap size={400} fill="currentColor" className="text-slate-900" />
         </div>
         <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <ShieldCheck size={300} fill="currentColor" className="text-indigo-600" />
         </div>

         {/* Corner Flourishes */}
         <div className="absolute top-5 left-5 w-24 h-24 border-t-4 border-l-4 border-slate-900 opacity-20" />
         <div className="absolute top-5 right-5 w-24 h-24 border-t-4 border-r-4 border-slate-900 opacity-20" />
         <div className="absolute bottom-5 left-5 w-24 h-24 border-b-4 border-l-4 border-slate-900 opacity-20" />
         <div className="absolute bottom-5 right-5 w-24 h-24 border-b-4 border-r-4 border-slate-900 opacity-20" />

         {/* Content */}
         <div className="relative flex flex-col items-center text-center flex-1">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
               <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                  <Image src="/zimlearn-logo.svg" alt="ZimLearn" width={32} height={32} />
               </div>
               <div className="text-left leading-none">
                  <h2 className="text-2xl font-black italic tracking-tight text-slate-900 underline underline-offset-4 decoration-indigo-200">ZIMLEARN EXECUTIVE</h2>
                  <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 mt-1 uppercase">Academic Accreditation Body</p>
               </div>
            </div>

            <div className="mb-12">
               <h1 className="text-6xl font-black italic text-slate-900 tracking-tighter mb-2">Certificate of Excellence</h1>
               <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Star size={16} fill="currentColor" />
                  <span className="text-[10px] uppercase font-black tracking-widest leading-none">Awarded for Professional Mastery in AI-Driven Education</span>
                  <Star size={16} fill="currentColor" />
               </div>
            </div>

            <p className="text-xl font-medium text-slate-400 italic mb-4">The ZimLearn Academic Council hereby certifies that</p>
            <h3 className="text-5xl font-black text-slate-900 mb-8 italic tracking-tight underline underline-offset-8 decoration-slate-100">{cert.teacher?.full_name || 'Valued Educator'}</h3>
            
            <p className="max-w-2xl text-lg text-slate-600 leading-relaxed font-medium mb-12">
               Has successfully demonstrated advanced proficiency in leveraging Artificial Intelligence for ZIMSEC curriculum adaptation, 
               scoring in the <span className="text-slate-900 font-bold">Top 5%</span> of registered educators nationwide. 
               This certification recognizes dedication to Zimbabwe's educational digital transformation.
            </p>

            {/* Verification Detail Box */}
            <div className="grid grid-cols-3 gap-12 w-full mt-auto">
               <div className="text-center">
                  <div className="h-[1px] bg-slate-200 mb-4 mx-auto w-40" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Issued On</p>
                  <p className="text-sm font-bold text-slate-900 italic">{new Date(cert.issue_date).toLocaleDateString('en-GB')}</p>
               </div>
               
               <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-slate-900 p-2 shadow-2xl relative group-hover:rotate-12 transition-transform duration-500">
                     <div className="w-full h-full rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner">
                        <Award size={48} className="text-slate-900" />
                     </div>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">Authorized Seal</p>
               </div>

               <div className="text-center">
                  <div className="h-[1px] bg-slate-200 mb-4 mx-auto w-40" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Verification Code</p>
                  <p className="text-sm font-bold text-slate-900 font-mono italic tracking-widest">{cert.verification_code}</p>
               </div>
            </div>

            {/* Bottom URL */}
            <div className="absolute bottom-0 text-[8px] font-black text-slate-300 uppercase tracking-widest mt-4">
               Verify this certificate at: <span className="text-indigo-400 italic">verify.zimlearn.co.zw/{cert.id}</span>
            </div>
         </div>
      </div>
    </div>
  )
}
