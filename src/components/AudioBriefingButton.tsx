'use client'

import { useState } from 'react'
import { Headphones, Play, Pause, Square, Loader2, Sparkles, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  lessonId: string
  lessonTitle: string
}

export default function AudioBriefingButton({ lessonId, lessonTitle: _lessonTitle }: Props) {
  const [loading, setLoading] = useState(false)
  const [_script, setScript] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  async function generateBriefing() {
    setLoading(true)
    try {
      const res = await fetch('/api/student/audio/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId })
      })
      const data = await res.json()
      if (data.script) {
        setScript(data.script)
        playBriefing(data.script)
      }
    } catch (err) {
      console.error('Failed to generate briefing:', err)
    } finally {
      setLoading(false)
    }
  }

  function playBriefing(text: string) {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Try to find a nice English voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium')))
    if (preferredVoice) utterance.voice = preferredVoice

    utterance.rate = 0.95 // Slightly slower for better clarity
    utterance.pitch = 1.0

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }
    
    window.speechSynthesis.speak(utterance)
  }

  function togglePause() {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  function stop() {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }

  return (
    <div className="relative">
      {!isPlaying && !loading && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateBriefing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100 hover:bg-indigo-100"
        >
          <Headphones size={14} /> <span>MaFundi Audio Briefing</span>
          <Sparkles size={12} className="text-amber-500" />
        </motion.button>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold animate-pulse border border-slate-100">
          <Loader2 size={14} className="animate-spin" /> <span>Synthesizing briefing...</span>
        </div>
      )}

      {(isPlaying || isPaused) && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 bg-indigo-600 text-white rounded-xl p-1 shadow-lg shadow-indigo-100"
        >
          <div className="px-3 py-1 flex items-center gap-2 border-r border-white/10">
            <Volume2 size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Listening</span>
          </div>
          <button onClick={togglePause} className="p-2 hover:bg-white/10 rounded-lg transition">
            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
          </button>
          <button onClick={stop} className="p-2 hover:bg-white/10 rounded-lg transition">
            <Square size={14} fill="currentColor" />
          </button>
        </motion.div>
      )}
    </div>
  )
}
