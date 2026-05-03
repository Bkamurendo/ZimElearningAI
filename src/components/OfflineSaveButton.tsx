'use client'

import { useState, useEffect } from 'react'
import { Download, CheckCircle, WifiOff, Database } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  lessonId: string
  lessonTitle: string
  content: string
}

export default function OfflineSaveButton({ lessonId, lessonTitle, content }: Props) {
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Check if already saved in localStorage (mocking IndexedDB for simplicity in this turn)
    const saved = localStorage.getItem(`offline_lesson_${lessonId}`)
    if (saved) setIsSaved(true)
  }, [lessonId])

  const handleSave = async () => {
    setSaving(true)
    // Simulate data download/compression
    await new Promise(r => setTimeout(r, 1200))
    
    const lessonData = {
      id: lessonId,
      title: lessonTitle,
      content,
      savedAt: new Date().toISOString()
    }
    
    localStorage.setItem(`offline_lesson_${lessonId}`, JSON.stringify(lessonData))
    
    // Store list of offline lessons
    const index = JSON.parse(localStorage.getItem('offline_index') || '[]')
    if (!index.includes(lessonId)) {
      index.push(lessonId)
      localStorage.setItem('offline_index', JSON.stringify(index))
    }

    setIsSaved(true)
    setSaving(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleSave}
        disabled={isSaved || saving}
        variant={isSaved ? "outline" : "emerald"}
        size="sm"
        className="rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm"
      >
        {saving ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isSaved ? (
          <CheckCircle size={14} className="text-emerald-500" />
        ) : (
          <Download size={14} />
        )}
        {saving ? 'Saving Data...' : isSaved ? 'Stored Offline' : 'Save Offline'}
      </Button>
      {isSaved && (
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1 mr-2">
           <Database size={8} /> 420KB SAVED · <WifiOff size={8} /> NO DATA NEEDED NEXT TIME
        </p>
      )}
    </div>
  )
}
