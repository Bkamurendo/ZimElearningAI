'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, BrainCircuit, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface MissionCardProps {
  studentName: string
  currentSubject?: string
  nextLesson?: string
  lessonId?: string
  progress: number
}

export default function MaFundiMissionCard({ 
  studentName, 
  currentSubject, 
  nextLesson, 
  lessonId,
  progress 
}: MissionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl group"
    >
      {/* AI Glow Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BrainCircuit size={24} className="text-white animate-pulse" />
             </div>
             <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Message from MaFundi</p>
                <h2 className="text-white font-black text-xl uppercase italic">What we are learning today</h2>
             </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight uppercase italic">
              Hello {studentName}, <br />
              {nextLesson ? (
                <span className="text-emerald-400">Let's work on {currentSubject}.</span>
              ) : (
                <span className="text-emerald-400">Let's see what you want to learn!</span>
              )}
            </h1>
            
            {nextLesson && (
              <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">
                You've done <span className="text-white font-bold">{progress}%</span> of this part. 
                Keep going—you are becoming a <span className="text-emerald-400 font-bold underline">Star Student!</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {lessonId ? (
              <Link href={`/student/lessons/${lessonId}`}>
                <Button className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/20">
                  Keep Learning <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/student/subjects">
                <Button className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/20">
                  Pick a Subject <Sparkles size={20} className="ml-2" />
                </Button>
              </Link>
            )}
            
            <Link href="/student/ai-workspace">
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-700 text-slate-300 font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">
                Ask a Question
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side: Quick Stats Visual */}
        <div className="flex items-center gap-4 lg:flex-col lg:items-end">
           <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] text-center min-w-[120px] shadow-xl">
              <Zap size={24} className="text-yellow-400 mx-auto mb-2 animate-bounce" />
              <p className="text-2xl font-black text-white">{progress}%</p>
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Done</p>
           </div>
           <div className="bg-orange-500/10 backdrop-blur-xl border border-orange-500/20 p-6 rounded-[2rem] text-center min-w-[120px] shadow-xl">
              <Target size={24} className="text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-500">A*</p>
              <p className="text-[10px] uppercase font-black text-orange-400 tracking-widest">My Goal</p>
           </div>
        </div>
      </div>
    </motion.div>
  )
}
