'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react'

interface Topic {
  subject: string
  topic: string
  level: 'not_started' | 'learning' | 'practicing' | 'mastered'
}

export default function SyllabusMasteryMap() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch from /api/student/readiness-audit or a dedicated mastery endpoint
    fetch('/api/student/readiness-audit')
       .then(res => res.json())
       .then(_data => {
          // Flattening topics from the audit for demonstration
          // In production, we'd fetch the full syllabus topics
          setTopics([
            { subject: 'Mathematics', topic: 'Number Bases', level: 'mastered' },
            { subject: 'Mathematics', topic: 'Algebraic Expressions', level: 'practicing' },
            { subject: 'Mathematics', topic: 'Matrices & Transformations', level: 'learning' },
            { subject: 'Physics', topic: 'Dynamics & Forces', level: 'mastered' },
            { subject: 'Physics', topic: 'Electricity', level: 'not_started' },
          ])
       })
       .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={24} className="text-emerald-500 animate-spin" />
      </div>
    )
  }

  const subjects = Array.from(new Set(topics.map(t => t.subject)))

  return (
    <div className="space-y-8">
      {subjects.map(subject => (
        <div key={subject} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900">{subject} Syllabus Overview</h3>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Exam Target: Grade A
            </span>
          </div>

          <div className="space-y-4">
            {topics.filter(t => t.subject === subject).map(topic => (
              <div key={topic.topic} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-200 transition-all">
                <div className="mt-0.5">
                  {topic.level === 'mastered' ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : topic.level === 'practicing' ? (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  ) : topic.level === 'learning' ? (
                    <Circle size={18} className="text-amber-400 fill-amber-50" />
                  ) : (
                    <Circle size={18} className="text-gray-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-800">{topic.topic}</p>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                       topic.level === 'mastered' ? 'bg-emerald-100 text-emerald-700' :
                       topic.level === 'practicing' ? 'bg-blue-100 text-blue-700' :
                       topic.level === 'learning' ? 'bg-amber-100 text-amber-700' :
                       'bg-gray-100 text-gray-400'
                    }`}>
                       {topic.level.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        topic.level === 'mastered' ? 'bg-emerald-500 w-full' :
                        topic.level === 'practicing' ? 'bg-emerald-400 w-2/3' :
                        topic.level === 'learning' ? 'bg-amber-400 w-1/3' :
                        'w-0'
                      }`} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
             <AlertCircle size={18} className="text-blue-500 flex-shrink-0" />
             <p className="text-[10px] text-blue-700 leading-tight">
               <span className="font-bold">Next Priority:</span> Complete 2 quizzes in <strong>Algebra</strong> to reach 'Practicing' level and impact your global ZIMSEC ranking.
             </p>
          </div>
        </div>
      ))}
    </div>
  )
}
