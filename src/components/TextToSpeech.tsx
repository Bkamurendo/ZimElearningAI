'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'

interface Props {
  text: string
  label?: string
  className?: string
}

export function TextToSpeechButton({ text, label = 'Read aloud', className = '' }: Props) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check support on mount (SSR-safe)
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)

    // Cancel any ongoing speech when the component unmounts
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Pick the best available voice
  function pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null

    // Prefer en-GB → en-US → any English → first available
    const priorities = ['en-GB', 'en-US']
    for (const lang of priorities) {
      const match = voices.find(v => v.lang === lang)
      if (match) return match
    }
    const anyEnglish = voices.find(v => v.lang.startsWith('en'))
    return anyEnglish ?? voices[0]
  }

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setLoading(false)
  }, [])

  const speak = useCallback(() => {
    if (!supported) return
    if (speaking) { stop(); return }

    setLoading(true)

    const synth = window.speechSynthesis

    // If voices are not ready yet, wait for them
    function startSpeaking() {
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = pickVoice()
      if (voice) utterance.voice = voice
      utterance.rate  = 0.95
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => { setLoading(false); setSpeaking(true) }
      utterance.onend   = () => { setSpeaking(false); setLoading(false) }
      utterance.onerror = () => { setSpeaking(false); setLoading(false) }

      utteranceRef.current = utterance
      synth.speak(utterance)
    }

    // Chrome loads voices asynchronously
    if (synth.getVoices().length > 0) {
      startSpeaking()
    } else {
      const onVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged)
        startSpeaking()
      }
      synth.addEventListener('voiceschanged', onVoicesChanged)

      // Fallback if voiceschanged never fires (Firefox, Safari)
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', onVoicesChanged)
        startSpeaking()
      }, 500)
    }
  }, [supported, speaking, stop, text])

  if (!supported) {
    return (
      <span
        title="Text-to-speech is not supported in this browser"
        className={`inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-not-allowed select-none ${className}`}
      >
        <VolumeX size={14} />
        <span className="sr-only">Read aloud (not supported)</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={speak}
      title={speaking ? 'Stop reading' : label}
      aria-label={speaking ? 'Stop reading aloud' : label}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-all duration-150 select-none ${
        speaking
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
      } ${className}`}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : speaking
          ? <VolumeX size={13} />
          : <Volume2 size={13} />
      }
      <span>{loading ? 'Loading…' : speaking ? 'Stop' : label}</span>
    </button>
  )
}
