'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Play, Pause, ChevronLeft, ChevronRight,
  Volume2, VolumeX, GraduationCap, CheckCircle2,
} from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SlideType = 'title' | 'bullets' | 'definition' | 'example' | 'equation' | 'diagram' | 'summary'

export type LessonSlide = {
  id: string
  type: SlideType
  heading: string
  narration: string
  emoji?: string
  color?: string
  // bullets
  bullets?: string[]
  // definition
  term?: string
  definition?: string
  // example
  problem?: string
  steps?: string[]
  // equation
  equation?: string
  explanation?: string
  // diagram
  diagram?: string
  // summary
  points?: string[]
}

export type LessonScript = {
  title: string
  subject: string
  topic: string
  level: string
  slides: LessonSlide[]
}

type ColorSet = { bg: string; accent: string; lightBg: string; text: string }

// ─── Color Palette ────────────────────────────────────────────────────────────

const SLIDE_COLORS: Record<string, ColorSet> = {
  emerald: { bg: 'linear-gradient(145deg,#022c22 0%,#064e3b 100%)', accent: '#10b981', lightBg: 'rgba(16,185,129,.18)', text: '#6ee7b7' },
  blue:    { bg: 'linear-gradient(145deg,#0c1a35 0%,#1e3a8a 100%)', accent: '#3b82f6', lightBg: 'rgba(59,130,246,.18)',  text: '#93c5fd' },
  purple:  { bg: 'linear-gradient(145deg,#2e1065 0%,#4c1d95 100%)', accent: '#a855f7', lightBg: 'rgba(168,85,247,.18)', text: '#d8b4fe' },
  amber:   { bg: 'linear-gradient(145deg,#451a03 0%,#78350f 100%)', accent: '#f59e0b', lightBg: 'rgba(245,158,11,.18)', text: '#fcd34d' },
  rose:    { bg: 'linear-gradient(145deg,#4c0519 0%,#881337 100%)', accent: '#f43f5e', lightBg: 'rgba(244,63,94,.18)',  text: '#fda4af' },
  teal:    { bg: 'linear-gradient(145deg,#042f2e 0%,#134e4a 100%)', accent: '#14b8a6', lightBg: 'rgba(20,184,166,.18)', text: '#5eead4' },
  indigo:  { bg: 'linear-gradient(145deg,#1e1b4b 0%,#312e81 100%)', accent: '#6366f1', lightBg: 'rgba(99,102,241,.18)', text: '#a5b4fc' },
  orange:  { bg: 'linear-gradient(145deg,#431407 0%,#7c2d12 100%)', accent: '#f97316', lightBg: 'rgba(249,115,22,.18)', text: '#fdba74' },
}
const DEFAULT_COLORS = SLIDE_COLORS.indigo

// ─── Individual Slide Renderers ───────────────────────────────────────────────

type SlideProps = { slide: LessonSlide; colors: ColorSet }

function TitleSlide({ slide, colors }: SlideProps) {
  return (
    <div className="text-center max-w-lg w-full px-4">
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
        className="text-[5rem] leading-none mb-5">
        {slide.emoji ?? '🎓'}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
        style={{ background: colors.lightBg, color: colors.text }}>
        MaFundi Lesson
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="text-2xl sm:text-3xl font-black text-white leading-tight mb-5">
        {slide.heading}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
        className="text-slate-300 text-sm leading-relaxed italic">
        {slide.narration}
      </motion.p>
    </div>
  )
}

function BulletsSlide({ slide, colors }: SlideProps) {
  return (
    <div className="w-full max-w-xl px-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{slide.emoji ?? '📌'}</span>
        <h2 className="text-xl sm:text-2xl font-black text-white">{slide.heading}</h2>
      </motion.div>
      <ul className="space-y-3">
        {(slide.bullets ?? []).map((bullet, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.2 }}
            className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
              style={{ background: colors.lightBg, color: colors.text }}>
              {i + 1}
            </span>
            <span className="text-slate-200 text-sm sm:text-base leading-snug">{bullet}</span>
          </motion.li>
        ))}
      </ul>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + (slide.bullets?.length ?? 0) * 0.2 }}
        className="mt-5 text-slate-400 text-xs italic">{slide.narration}</motion.p>
    </div>
  )
}

function DefinitionSlide({ slide, colors }: SlideProps) {
  return (
    <div className="w-full max-w-xl px-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-5">
        <span className="text-3xl">{slide.emoji ?? '📖'}</span>
        <h2 className="text-xl font-black text-white">{slide.heading}</h2>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="rounded-2xl p-5 border-l-4"
        style={{ background: 'rgba(0,0,0,0.35)', borderColor: colors.accent }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="text-2xl sm:text-3xl font-black mb-3"
          style={{ color: colors.text }}>
          {slide.term ?? slide.heading}
        </motion.p>
        <div className="h-px mb-3" style={{ background: colors.accent + '55' }} />
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="text-slate-200 text-sm sm:text-base leading-relaxed">
          {slide.definition}
        </motion.p>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
        className="mt-4 text-slate-400 text-xs italic">{slide.narration}</motion.p>
    </div>
  )
}

function ExampleSlide({ slide, colors }: SlideProps) {
  return (
    <div className="w-full max-w-xl px-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{slide.emoji ?? '✏️'}</span>
        <h2 className="text-xl font-black text-white">{slide.heading}</h2>
      </motion.div>
      {/* Problem */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl p-4 mb-4"
        style={{ background: colors.lightBg, border: `1px solid ${colors.accent}44` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: colors.text }}>Question</p>
        <p className="text-white text-sm leading-snug">{slide.problem}</p>
      </motion.div>
      {/* Steps */}
      <div className="space-y-2">
        {(slide.steps ?? []).map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.25 }}
            className="flex items-start gap-3 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
              style={{ background: colors.accent, color: '#000' }}>
              {i + 1}
            </span>
            <span className="text-slate-200 text-sm leading-snug">{step}</span>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + (slide.steps?.length ?? 0) * 0.25 }}
        className="mt-4 text-slate-400 text-xs italic">{slide.narration}</motion.p>
    </div>
  )
}

function EquationSlide({ slide, colors }: SlideProps) {
  const equationHtml = (() => {
    if (!slide.equation) return ''
    try {
      return katex.renderToString(slide.equation, { displayMode: true, throwOnError: false })
    } catch {
      return `<code style="color:white">${slide.equation}</code>`
    }
  })()

  return (
    <div className="w-full max-w-xl px-4 text-center">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-3 mb-6">
        <span className="text-3xl">{slide.emoji ?? '🔢'}</span>
        <h2 className="text-xl font-black text-white">{slide.heading}</h2>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring' }}
        className="rounded-2xl p-6 mb-5"
        style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${colors.accent}55` }}>
        <div
          className="text-white [&_.katex]:text-white [&_.katex-html]:text-white overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: equationHtml }}
        />
      </motion.div>
      {slide.explanation && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          className="text-sm leading-relaxed mb-3" style={{ color: colors.text }}>
          {slide.explanation}
        </motion.p>
      )}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="text-slate-400 text-xs italic">{slide.narration}</motion.p>
    </div>
  )
}

function DiagramSlide({ slide, colors }: SlideProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState('')
  const [diagramError, setDiagramError] = useState(false)

  useEffect(() => {
    if (!slide.diagram) return
    let cancelled = false
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', darkMode: true })
      const uid = `merm-${slide.id}-${Date.now()}`
      mermaid.render(uid, slide.diagram!).then(({ svg }) => {
        if (!cancelled) setSvgContent(svg)
      }).catch(() => {
        if (!cancelled) setDiagramError(true)
      })
    })
    return () => { cancelled = true }
  }, [slide.id, slide.diagram])

  return (
    <div className="w-full max-w-xl px-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{slide.emoji ?? '🔄'}</span>
        <h2 className="text-xl font-black text-white">{slide.heading}</h2>
      </motion.div>
      <motion.div ref={containerRef} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-4 overflow-auto max-h-52"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.accent}33` }}>
        {svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} className="flex justify-center [&_svg]:max-w-full" />
        ) : diagramError ? (
          <pre className="text-slate-400 text-xs whitespace-pre-wrap">{slide.diagram}</pre>
        ) : (
          <div className="flex items-center justify-center h-20 gap-2">
            <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: colors.accent }} />
            <span className="text-slate-400 text-xs">Rendering diagram…</span>
          </div>
        )}
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-4 text-slate-400 text-xs italic">{slide.narration}</motion.p>
    </div>
  )
}

function SummarySlide({ slide, colors }: SlideProps) {
  return (
    <div className="w-full max-w-xl px-4">
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-5xl text-center mb-4">
        {slide.emoji ?? '🎯'}
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="text-xl sm:text-2xl font-black text-white text-center mb-5">
        {slide.heading}
      </motion.h2>
      <div className="space-y-2.5">
        {(slide.points ?? []).map((point, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.18 }}
            className="flex items-start gap-3 rounded-xl px-4 py-2.5"
            style={{ background: colors.lightBg }}>
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
            <span className="text-slate-200 text-sm leading-snug">{point}</span>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.4 + (slide.points?.length ?? 0) * 0.18 }}
        className="mt-5 text-center font-bold text-sm" style={{ color: colors.text }}>
        🌟 Lesson complete — great work!
      </motion.p>
    </div>
  )
}

function SlideRenderer({ slide, colors }: SlideProps) {
  switch (slide.type) {
    case 'title':      return <TitleSlide      slide={slide} colors={colors} />
    case 'bullets':    return <BulletsSlide    slide={slide} colors={colors} />
    case 'definition': return <DefinitionSlide slide={slide} colors={colors} />
    case 'example':    return <ExampleSlide    slide={slide} colors={colors} />
    case 'equation':   return <EquationSlide   slide={slide} colors={colors} />
    case 'diagram':    return <DiagramSlide    slide={slide} colors={colors} />
    case 'summary':    return <SummarySlide    slide={slide} colors={colors} />
    default:           return <BulletsSlide    slide={slide} colors={colors} />
  }
}

// ─── Main Player ─────────────────────────────────────────────────────────────

interface Props {
  lesson: LessonScript
  onClose: () => void
}

export function AnimatedLessonPlayer({ lesson, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [ttsSupported, setTtsSupported] = useState(true)
  const directionRef = useRef(1)

  const slide = lesson.slides[currentIndex]
  const colors = SLIDE_COLORS[slide?.color ?? 'indigo'] ?? DEFAULT_COLORS
  const isFirst = currentIndex === 0
  const isLast = currentIndex === lesson.slides.length - 1

  // Detect TTS support
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTtsSupported(false)
    }
  }, [])

  // TTS — cancel + restart every time slide, play state, mute, or speed changes
  useEffect(() => {
    if (!ttsSupported || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    if (!isPlaying || isMuted || !slide?.narration) return

    const utterance = new SpeechSynthesisUtterance(slide.narration)
    utterance.rate = speed
    utterance.pitch = 1.05
    utterance.volume = 1

    utterance.onend = () => {
      if (currentIndex < lesson.slides.length - 1) {
        directionRef.current = 1
        setCurrentIndex(i => i + 1)
      } else {
        setIsPlaying(false)
      }
    }

    // Small delay so Framer Motion slide entrance animation starts first
    const timer = setTimeout(() => {
      if (!isMuted) window.speechSynthesis.speak(utterance)
    }, 350)

    return () => {
      clearTimeout(timer)
      window.speechSynthesis.cancel()
    }
  }, [currentIndex, isPlaying, isMuted, speed, ttsSupported])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  }, [])

  function goNext() {
    if (isLast) return
    directionRef.current = 1
    setCurrentIndex(i => i + 1)
  }

  function goPrev() {
    if (isFirst) return
    directionRef.current = -1
    setCurrentIndex(i => i - 1)
  }

  function jumpTo(i: number) {
    directionRef.current = i > currentIndex ? 1 : -1
    setCurrentIndex(i)
  }

  function togglePlay() { setIsPlaying(p => !p) }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
      else if (e.key === ' ') { e.preventDefault(); togglePlay() }
      else if (e.key === 'Escape') { onClose() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  // Framer Motion slide transition variants (direction-aware)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? '-50%' : '50%',
      opacity: 0,
    }),
  }

  if (!slide) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col select-none"
      style={{ background: '#06060f' }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
        {/* Lesson info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: colors.accent }}>
            <GraduationCap size={14} className="text-white" />
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-white text-xs font-bold leading-none truncate">{lesson.subject}</p>
            <p className="text-slate-400 text-[10px] mt-0.5 truncate">{lesson.topic}</p>
          </div>
          <p className="sm:hidden text-white text-xs font-bold truncate max-w-[140px]">{lesson.topic}</p>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {[0.75, 1, 1.25, 1.5].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className="px-2 py-0.5 rounded text-[11px] font-bold transition-all duration-150"
              style={speed === s
                ? { background: colors.accent, color: '#000' }
                : { color: 'rgba(255,255,255,0.45)' }}>
              {s}×
            </button>
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0 ml-2">
          <X size={18} />
        </button>
      </div>

      {/* ── Slide area ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Ambient glow behind slide */}
        <div className="absolute inset-0 opacity-30 transition-all duration-700 pointer-events-none"
          style={{ background: colors.bg }} />

        <AnimatePresence custom={directionRef.current} mode="wait">
          <motion.div
            key={currentIndex}
            custom={directionRef.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center overflow-y-auto py-4"
            style={{ background: colors.bg }}
          >
            <SlideRenderer slide={slide} colors={colors} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}>

        {/* Prev */}
        <button onClick={goPrev} disabled={isFirst}
          aria-label="Previous slide"
          className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 transition">
          <ChevronLeft size={22} />
        </button>

        {/* Play / Pause */}
        <button onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
          style={{ background: colors.accent }}>
          {isPlaying
            ? <Pause size={18} className="text-white fill-white" />
            : <Play  size={18} className="text-white fill-white" />
          }
        </button>

        {/* Next */}
        <button onClick={goNext} disabled={isLast}
          aria-label="Next slide"
          className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 transition">
          <ChevronRight size={22} />
        </button>

        {/* Progress dots */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden px-1">
          {lesson.slides.map((_, i) => (
            <button key={i} onClick={() => jumpTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300 rounded-full hover:opacity-100"
              style={{
                width:   i === currentIndex ? 16 : 7,
                height:  7,
                opacity: i === currentIndex ? 1 : 0.35,
                background: i === currentIndex ? colors.accent : 'white',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Slide counter */}
        <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
          {currentIndex + 1}/{lesson.slides.length}
        </span>

        {/* Mute */}
        {ttsSupported && (
          <button onClick={() => setIsMuted(m => !m)}
            aria-label={isMuted ? 'Unmute' : 'Mute narration'}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition flex-shrink-0">
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        )}
      </div>

      {/* Keyboard hint (fades out) */}
      <motion.div
        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ delay: 3, duration: 1.5 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[10px] text-slate-500 bg-black/40 px-3 py-1 rounded-full">
          ← → arrow keys · Space to pause
        </p>
      </motion.div>
    </div>
  )
}
