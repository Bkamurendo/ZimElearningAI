'use client'

import { useState } from 'react'
import { Brain, Info, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Topic {
  id: string
  topic_name: string
  importance: 'high' | 'normal' | 'low'
  mastery_level: number // 0-100
  confidence_score?: number
  last_explained_at?: string
  common_mistakes?: string[]
}

interface Props {
  subjectName: string
  topics: Topic[]
}

export function MasteryHeatmap({ subjectName, topics }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const getStatusColor = (level: number) => {
    if (level === 0) return 'bg-slate-100 text-slate-400 border-slate-200'
    if (level < 40) return 'bg-rose-50 text-rose-600 border-rose-100'
    if (level < 80) return 'bg-amber-50 text-amber-600 border-amber-100'
    return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  }

  const getFillColor = (level: number) => {
    if (level === 0) return 'bg-slate-200'
    if (level < 40) return 'bg-rose-400'
    if (level < 80) return 'bg-amber-400'
    return 'bg-emerald-500'
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Brain size={18} className="text-indigo-600" /> Syllabus Mastery Heatmap
          </h3>
          <p className="text-xs text-slate-400 font-medium">{subjectName} · {topics.length} core topics</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-400">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Learning</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /> Struggling</div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {topics.map((topic) => (
            <motion.button
              key={topic.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTopic(topic)}
              className={`relative h-20 rounded-2xl border transition-all flex flex-col items-center justify-center p-2 text-center group ${getStatusColor(topic.mastery_level)}`}
            >
              {topic.importance === 'high' && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-lg border-2 border-white">
                  !
                </div>
              )}
              <span className="text-[10px] font-bold leading-tight line-clamp-2 px-1">
                {topic.topic_name}
              </span>
              <div className="absolute bottom-2 left-3 right-3 h-1 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${getFillColor(topic.mastery_level)}`}
                  style={{ width: `${topic.mastery_level}%` }}
                />
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selectedTopic && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-slate-50 overflow-hidden"
            >
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 relative">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <Info size={16} />
                </button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${getStatusColor(selectedTopic.mastery_level)}`}>
                    {selectedTopic.mastery_level >= 80 ? '🎯' : selectedTopic.mastery_level >= 40 ? '💡' : '🚧'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{selectedTopic.topic_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-500 uppercase tracking-wider">
                        Mastery: {selectedTopic.mastery_level}%
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTopic.importance === 'high' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {selectedTopic.importance} Importance
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Concept Analysis</p>
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      {selectedTopic.mastery_level === 0 ? (
                        <p className="text-xs text-slate-400 italic">No study data yet. Ask MaFundi to explain this topic!</p>
                      ) : (
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-xs text-slate-600">
                             <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                             <span>Confidence Score: {(selectedTopic.confidence_score?.[1] || 0.5) * 10}%</span>
                          </li>
                          {selectedTopic.common_mistakes && selectedTopic.common_mistakes.length > 0 && (
                            <li className="flex items-start gap-2 text-xs text-slate-600">
                               <AlertCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                               <span>Common Mistake: {selectedTopic.common_mistakes[0]}</span>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Next Active Steps</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button className="bg-indigo-600 text-white rounded-xl py-2 px-3 text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2">
                        <Brain size={14} /> Explain Topic again
                      </button>
                      <button className="bg-white text-slate-700 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2">
                        <HelpCircle size={14} /> Practice Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
