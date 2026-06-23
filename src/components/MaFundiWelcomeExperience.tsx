'use client'

import { useState, useEffect } from 'react'
import { Bot, Sparkles, Camera, Mic, BookOpen, ChevronRight, X } from 'lucide-react'
import { Button } from './ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function MaFundiWelcomeExperience() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem('mafundi_intro_seen')
    if (!hasSeen) {
      setTimeout(() => setIsOpen(true), 1500)
    }
  }, [])

  const steps = [
    {
      title: "Mwauya! I am MaFundi.",
      description: "Your official AI Super Teacher. I'm not just a chatbot—I am your 24/7 personal tutor grounded in the Zimbabwe Heritage-Based Curriculum.",
      icon: <Bot className="w-12 h-12 text-indigo-500" />,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "I have Vision.",
      description: "Struggling with a hard question? Just snap a photo of your textbook or past paper. I'll solve it step-by-step using ZIMSEC marking schemes.",
      icon: <Camera className="w-12 h-12 text-emerald-500" />,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "I am your Voice.",
      description: "Too busy to read? I can narrate your lesson notes as 'Audio Briefings' so you can study while you walk or help at home.",
      icon: <Mic className="w-12 h-12 text-orange-500" />,
      color: "from-orange-500 to-amber-600"
    },
    {
      title: "I am your Coach.",
      description: "I track your weak spots and predict your ZIMSEC grades. I'll tell you exactly what to study to reach that 'A'.",
      icon: <Sparkles className="w-12 h-12 text-purple-500" />,
      color: "from-purple-500 to-pink-600"
    }
  ]

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      close()
    }
  }

  const close = () => {
    localStorage.setItem('mafundi_intro_seen', 'true')
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={close}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <button 
              onClick={close}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition text-gray-400"
            >
              <X size={20} />
            </button>

            <div className={`h-48 bg-gradient-to-br ${steps[step].color} flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>
              <motion.div 
                key={step}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center"
              >
                {steps[step].icon}
              </motion.div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="flex gap-1.5 mb-6 justify-center">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`} 
                  />
                ))}
              </div>

              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-center space-y-4"
              >
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {steps[step].title}
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {steps[step].description}
                </p>
              </motion.div>

              <div className="mt-10 flex flex-col gap-3">
                <Button 
                  onClick={next}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl"
                >
                  {step === steps.length - 1 ? "Let's Start Learning" : "Next Skill"}
                  <ChevronRight size={16} className="ml-2" />
                </Button>
                {step === 0 && (
                  <button onClick={close} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition">
                    Skip Introduction
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
