'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface A11ySettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl'
  contrast: 'normal' | 'high'
  reducedMotion: boolean
  dyslexicFont: boolean
}

const STORAGE_KEY = 'zimlearn_a11y'

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 'md',
  contrast: 'normal',
  reducedMotion: false,
  dyslexicFont: false,
}

// ── Context ──────────────────────────────────────────────────────────────────

interface A11yContextValue {
  settings: A11ySettings
  update: (patch: Partial<A11ySettings>) => void
}

const A11yContext = createContext<A11yContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
})

// ── Apply settings to <html> ─────────────────────────────────────────────────

function applySettings(s: A11ySettings) {
  const html = document.documentElement

  // Font size via data attribute (handled in CSS)
  html.setAttribute('data-font-size', s.fontSize)

  // High contrast class
  html.classList.toggle('high-contrast', s.contrast === 'high')

  // Reduced motion class
  html.classList.toggle('reduced-motion', s.reducedMotion)

  // Dyslexic font class
  html.classList.toggle('dyslexic-font', s.dyslexicFont)
}

// ── Provider (wrap app or layout) ────────────────────────────────────────────

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<A11ySettings>
        const merged: A11ySettings = { ...DEFAULT_SETTINGS, ...parsed }
        setSettings(merged)
        applySettings(merged)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  const update = useCallback((patch: Partial<A11ySettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage might be unavailable
      }
      applySettings(next)
      return next
    })
  }, [])

  return (
    <A11yContext.Provider value={{ settings, update }}>
      {children}
    </A11yContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useA11y() {
  return useContext(A11yContext)
}

// ── AccessibilityControls panel ──────────────────────────────────────────────

export function AccessibilityControls({ className = '' }: { className?: string }) {
  const { settings, update } = useA11y()

  const fontSizes: Array<{ value: A11ySettings['fontSize']; label: string; textClass: string }> = [
    { value: 'sm', label: 'A', textClass: 'text-xs' },
    { value: 'md', label: 'A', textClass: 'text-sm' },
    { value: 'lg', label: 'A', textClass: 'text-base' },
    { value: 'xl', label: 'A', textClass: 'text-lg' },
  ]

  return (
    <div className={`space-y-5 ${className}`}>

      {/* ── Font Size ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Font Size</p>
        <div className="flex gap-2">
          {fontSizes.map(({ value, label, textClass }) => (
            <button
              key={value}
              onClick={() => update({ fontSize: value })}
              aria-pressed={settings.fontSize === value}
              aria-label={`Font size ${value}`}
              className={`flex-1 h-10 rounded-xl border-2 font-bold transition-all ${textClass} ${
                settings.fontSize === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          {settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'md' ? '16px (default)' : settings.fontSize === 'lg' ? '18px' : '20px'}
        </p>
      </div>

      {/* ── Contrast ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contrast</p>
        <div className="flex gap-2">
          {(['normal', 'high'] as const).map(val => (
            <button
              key={val}
              onClick={() => update({ contrast: val })}
              aria-pressed={settings.contrast === val}
              className={`flex-1 h-10 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                settings.contrast === val
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* ── Reduced Motion ────────────────────────────────────────────── */}
      <label className="flex items-center justify-between gap-3 cursor-pointer group">
        <div>
          <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition">Reduced Motion</p>
          <p className="text-xs text-slate-400 mt-0.5">Minimise animations and transitions</p>
        </div>
        <button
          role="switch"
          aria-checked={settings.reducedMotion}
          onClick={() => update({ reducedMotion: !settings.reducedMotion })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            settings.reducedMotion ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>

      {/* ── Dyslexic Font ─────────────────────────────────────────────── */}
      <label className="flex items-center justify-between gap-3 cursor-pointer group">
        <div>
          <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition">Dyslexic-Friendly Font</p>
          <p className="text-xs text-slate-400 mt-0.5">Easier to read for dyslexic users</p>
        </div>
        <button
          role="switch"
          aria-checked={settings.dyslexicFont}
          onClick={() => update({ dyslexicFont: !settings.dyslexicFont })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            settings.dyslexicFont ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              settings.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>

      {/* ── Reset ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => update(DEFAULT_SETTINGS)}
        className="w-full text-xs text-slate-400 hover:text-slate-600 transition py-1 border border-dashed border-slate-200 rounded-xl hover:border-slate-300"
      >
        Reset to defaults
      </button>
    </div>
  )
}
