'use client'

import { useState } from 'react'
import { 
  Camera, Upload, FileText, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, Wand2, ArrowRight, X, Trash2
} from 'lucide-react'
import Image from 'next/image'

interface Props {
  assignmentId: string
  studentId: string
  studentName: string
}

export default function AIAutoGrader({ assignmentId, studentId, studentName }: Props) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const runGrading = async () => {
    if (!image) return
    setGrading(true)
    setError('')
    
    // In a real implementation, we would upload to Supabase Storage first
    // and then call a Vision-capable AI API (Claide 3.5 Sonnet / GPT-4o)
    
    try {
      // Simulate API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockResult = {
        score: 18,
        total: 20,
        grade: 'A',
        feedback: "Excellent understanding of the photosynthesis process. The diagram is well-labeled, although the explanation of the Calvin cycle could be more detailed. Handwriting was clearly transcribed.",
        rubricMatch: [
          { criteria: 'Key Concepts', status: 'full', comment: 'All key terms included.' },
          { criteria: 'Diagram Accuracy', status: 'full', comment: 'Accurate and neat labels.' },
          { criteria: 'Depth of Explanation', status: 'partial', comment: 'Calvin cycle needs more detail.' }
        ]
      }
      
      setResult(mockResult)
    } catch (err) {
      setError('AI Grading failed. Please try again or grade manually.')
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] border-2 border-indigo-100 shadow-xl overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-md">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Auto-Grader Pro</h3>
            <p className="text-[10px] text-indigo-100 uppercase font-black tracking-widest">Grading for: {studentName}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {!result ? (
          <>
            {/* Upload Area */}
            {!preview ? (
              <label className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  <Camera size={32} />
                </div>
                <p className="font-bold text-slate-700">Upload Student Work</p>
                <p className="text-xs text-slate-400 mt-1">Take a photo of the handwritten page</p>
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-100 shadow-md">
                <Image src={preview} alt="Student work preview" fill className="object-cover" />
                <button 
                  onClick={() => { setImage(null); setPreview(null) }}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-4 rounded-2xl flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={runGrading}
              disabled={!image || grading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition"
            >
              {grading ? (
                <> <Loader2 size={20} className="animate-spin" /> Analyzing Handwriting...</>
              ) : (
                <> <Wand2 size={20} /> Start AI Insight Grading </>
              )}
            </button>
          </>
        ) : (
          /* Result View */
          <div className="space-y-6 animate-scale-in">
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Recommendation</p>
                  <h4 className="text-2xl font-black text-indigo-600 italic">Distinction ({result.grade})</h4>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">{result.score}/<span className="text-gray-400">{result.total}</span></p>
                </div>
             </div>

             <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
                   <FileText size={80} />
                </div>
                <p className="text-xs font-bold text-emerald-800 mb-2 underline underline-offset-4 decoration-emerald-200">AI Feedback for Student:</p>
                <p className="text-sm text-emerald-900 leading-relaxed italic">{result.feedback}</p>
             </div>

             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Rubric Match Breakdown</p>
                {result.rubricMatch.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">{m.criteria}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">{m.comment}</span>
                  </div>
                ))}
             </div>

             <div className="pt-4 flex gap-3">
                <button className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition">
                  Confirm & Sync to Gradebook
                </button>
                <button className="px-5 py-3 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                  Discard
                </button>
             </div>
          </div>
        )}

      </div>

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium italic">
        Powered by MaFundi Vision Engine • Accuracy improves with each use.
      </div>
    </div>
  )
}
