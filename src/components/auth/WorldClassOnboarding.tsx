'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, GraduationCap, ArrowRight, 
  CheckCircle2, Target, Zap, 
  Globe, ShieldCheck, Star, 
  ChevronRight, BrainCircuit
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface OnboardingProps {
  onComplete: (data: any) => void
  error?: string
}

export default function WorldClassOnboarding({ onComplete, error }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    curriculum: 'ZIMSEC',
    grade: 'Form 4',
    goal: 'A* in all subjects'
  })

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => Math.max(0, s - 1))

  const steps = [
    {
      id: 'welcome',
      title: 'Your Academic Superpower Awaits',
      subtitle: 'Join 10,000+ Zimbabwean students mastering their exams with MaFundi AI.',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
             <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                  <BrainCircuit size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Personalized AI Tutor</p>
                  <p className="text-emerald-700 text-xs mt-0.5">MaFundi learns how you learn, then teaches you better.</p>
                </div>
             </div>
             <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                  <Target size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-sm">ZIMSEC & Cambridge Aligned</p>
                  <p className="text-blue-700 text-xs mt-0.5">Content updated weekly for the 2024 Heritage-Based Curriculum.</p>
                </div>
             </div>
          </div>
          <Button 
            onClick={nextStep}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            Begin Journey <ArrowRight size={18} className="ml-2" />
          </Button>
          <p className="text-center text-xs text-slate-400">
            Already have an account? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      )
    },
    {
      id: 'identity',
      title: 'Who are we teaching today?',
      subtitle: 'Use your real name so MaFundi can address you professionally.',
      component: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
            <input 
              autoFocus
              value={formData.fullName}
              onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Tendai Mupfure"
              className="w-full h-14 px-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
            <input 
              type="email"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              placeholder="you@email.com"
              className="w-full h-14 px-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
            />
          </div>
          <Button 
            disabled={!formData.fullName || !formData.email}
            onClick={nextStep}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-100 mt-4"
          >
            Next <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      )
    },
    {
      id: 'curriculum',
      title: 'Choose your Battleground',
      subtitle: 'MaFundi will adapt its knowledge base to your syllabus.',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
             {[
               { id: 'ZIMSEC', name: 'ZIMSEC', desc: 'Heritage-Based (National)', icon: Globe },
               { id: 'CAMBRIDGE', name: 'Cambridge', desc: 'International (IGCSE/A-Level)', icon: ShieldCheck },
               { id: 'CAPS', name: 'CAPS', desc: 'South African Standard', icon: Star },
             ].map(cur => (
               <button
                 key={cur.id}
                 onClick={() => setFormData(f => ({ ...f, curriculum: cur.id }))}
                 className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                   formData.curriculum === cur.id 
                     ? 'border-emerald-500 bg-emerald-50 shadow-inner' 
                     : 'border-slate-100 bg-white hover:border-emerald-200'
                 }`}
               >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.curriculum === cur.id ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                   <cur.icon size={24} />
                 </div>
                 <div className="text-left">
                    <p className={`font-black uppercase tracking-tighter ${formData.curriculum === cur.id ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {cur.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">{cur.desc}</p>
                 </div>
                 {formData.curriculum === cur.id && <CheckCircle2 size={20} className="ml-auto text-emerald-500" />}
               </button>
             ))}
          </div>
          <Button 
            onClick={nextStep}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-100 mt-4"
          >
            Confirm Curriculum <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      )
    },
    {
      id: 'password',
      title: 'Secure your Legacy',
      subtitle: 'Create a password to keep your progress safe.',
      component: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Choose a Password</label>
            <input 
              type="password"
              autoFocus
              value={formData.password}
              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 8 characters"
              className="w-full h-14 px-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
            />
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
             <ShieldCheck size={20} className="text-emerald-500" />
             <p className="text-[10px] font-bold text-slate-500 leading-tight">
               Your data is encrypted with military-grade security. 
               MaFundi will never share your study history.
             </p>
          </div>
          <Button 
            disabled={formData.password.length < 8}
            onClick={() => onComplete(formData)}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl mt-4"
          >
            Create My AI Teacher <Sparkles size={18} className="ml-2" />
          </Button>
        </div>
      )
    }
  ]

  const currentStep = steps[step]

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 min-h-[600px] flex flex-col justify-center">
      
      {/* Progress Bar */}
      <div className="flex items-center gap-1.5 mb-12 px-1">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
              i <= step ? 'bg-emerald-500' : 'bg-slate-100'
            }`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "circOut" }}
          className="space-y-8"
        >
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight uppercase italic italic">
              {currentStep.title}
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              {currentStep.subtitle}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 p-8 sm:p-10">
            {currentStep.component}
          </div>
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <button 
          onClick={prevStep}
          className="mt-8 text-xs font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors mx-auto"
        >
          Go Back
        </button>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center"
        >
          {error}
        </motion.div>
      )}

    </div>
  )
}
