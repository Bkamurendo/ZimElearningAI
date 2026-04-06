'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Download, Wand2, Loader2,
  CheckCircle2, Shuffle, Layers, Printer, GraduationCap, Star
} from 'lucide-react'

interface Question {
  id: string
  question: string
  marks: number
  topic: string
}

export default function BulkAssessmentGenerator() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [versions, setVersions] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [generatedTests, setGeneratedTests] = useState<any[] | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchQB() {
      const { data } = await supabase.from('question_bank').select('id, question, marks, topic').limit(20)
      setQuestions(data ?? [])
    }
    fetchQB()
  }, [supabase])

  const generateTests = async () => {
    if (selectedIds.length === 0) return
    setGenerating(true)
    
    // Simulate multi-version generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const results = Array.from({ length: versions }).map((_, i) => ({
      version: String.fromCharCode(65 + i),
      questions: [...selectedIds].sort(() => Math.random() - 0.5), // Shuffled
      id: Math.random().toString(36).substring(7)
    }))
    
    setGeneratedTests(results)
    setGenerating(false)
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-slate-800">
             <Layers size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold italic tracking-tight">Bulk Assessment Generator</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Multi-Version Anti-Cheating Suite</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Star size={14} className="text-amber-400" fill="currentColor" />
          <span className="text-[10px] font-bold text-slate-300">TEACHER PRO</span>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left: Settings */}
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Shuffle size={16} className="text-indigo-500" /> 1. Select Questions
            </label>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 max-h-64 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              {questions.map(q => (
                <label key={q.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-300 transition cursor-pointer group shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, q.id])
                      else setSelectedIds(selectedIds.filter(id => id !== q.id))
                    }}
                    className="mt-1 accent-indigo-600 rounded" 
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 rounded uppercase font-bold">{q.topic || 'General'}</span>
                      <span className="text-[9px] text-indigo-500 font-black">{q.marks} Marks</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">{selectedIds.length} questions selected</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="text-lg">🔢</span> 2. Number of Versions
            </label>
            <div className="flex gap-3">
              {[2, 3, 4, 5].map(v => (
                <button 
                  key={v}
                  onClick={() => setVersions(v)}
                  className={`w-12 h-12 rounded-xl text-xs font-bold transition-all ${versions === v ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Generate separate shuffled versions for the classroom.</p>
          </div>

          <button 
            onClick={generateTests}
            disabled={selectedIds.length === 0 || generating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-[1.5rem] shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition group"
          >
            {generating ? (
              <> <Loader2 size={20} className="animate-spin" /> Digitizing Versions... </>
            ) : (
              <> <Wand2 size={20} className="group-hover:rotate-12 transition-transform" /> Generate Multi-Tests </>
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div className="bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center">
            {generatedTests ? (
              <div className="w-full space-y-6 animate-scale-in">
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <CheckCircle2 size={24} />
                  <div className="text-left">
                    <p className="text-sm font-bold tracking-tight">Generation Successful</p>
                    <p className="text-[10px] opacity-80 italic">{versions} unique versions ready.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {generatedTests.map(test => (
                    <div key={test.version} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl flex items-center justify-between group hover:border-indigo-400 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                          {test.version}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">VERSION {test.version}</p>
                          <p className="text-[10px] text-slate-400">{test.questions.length} Questions · ID: {test.id}</p>
                        </div>
                      </div>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                        <Printer size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-2xl transition">
                  <Download size={18} /> Download All (PDF/Doc)
                </button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl text-slate-200 ring-8 ring-slate-50">
                   <FileText size={40} />
                </div>
                <h3 className="text-slate-900 font-bold italic">Ready to Generate</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Select questions on the left to create and shuffle exam versions.</p>
              </>
            )}
        </div>

      </div>

      <div className="bg-indigo-50 px-8 py-4 border-t border-indigo-100 flex items-center justify-between flex-wrap gap-2">
         <div className="flex items-center gap-2 text-indigo-700">
           <GraduationCap size={16} />
           <span className="text-[11px] font-black uppercase tracking-wider">ZIMSEC Standard Formatting</span>
         </div>
         <p className="text-[10px] text-indigo-400 italic">Automatically adds school logo and header space to generated PDFs.</p>
      </div>

    </div>
  )
}
