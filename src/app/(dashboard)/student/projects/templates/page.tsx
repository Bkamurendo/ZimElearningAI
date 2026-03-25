'use client'

import { useState } from 'react'
import { Crown, Bot, Sparkles, ArrowRight, Loader2, Download, BookOpen, Lock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

const SUBJECTS = [
  'Agriculture', 'Biology', 'Chemistry', 'Physics', 'Combined Science',
  'Geography', 'History', 'Computer Science', 'Mathematics',
  'English Language', 'Shona', 'Ndebele', 'Food and Nutrition',
  'Fashion and Fabrics', 'Building Technology', 'Commerce', 'Accounts',
  'Art and Craft', 'Music', 'Environmental Science', 'Social Science',
]

const GRADES = [
  'Grade 5', 'Grade 6', 'Grade 7',
  'Form 1', 'Form 2', 'Form 3', 'Form 4',
  'Lower 6', 'Upper 6',
]

const HERITAGE_THEMES = [
  'Local environment & ecology',
  'Indigenous farming & food systems',
  'Community health & nutrition',
  'Water & sanitation',
  'Traditional technology & craft',
  'Cultural heritage & oral traditions',
  'Entrepreneurship & local economy',
  'Energy & natural resources',
  'Disaster risk & climate resilience',
]

export default function PremiumTemplatesPage() {
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [topic, setTopic] = useState('')
  const [heritageTheme, setHeritageTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState('')
  const [error, setError] = useState('')
  const [isPremiumError, setIsPremiumError] = useState(false)
  const [generated, setGenerated] = useState<{ subject: string; grade: string; topic: string } | null>(null)

  async function generateTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !grade || !topic.trim()) {
      setError('Please fill in subject, grade and topic')
      return
    }
    setLoading(true)
    setError('')
    setTemplate('')
    setIsPremiumError(false)
    try {
      const res = await fetch('/api/ai-teacher/sbp-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, topic: topic.trim(), heritage_theme: heritageTheme || undefined }),
      })
      const data = await res.json()
      if (res.status === 403 && data.upgrade) {
        setIsPremiumError(true)
        return
      }
      if (!res.ok) { setError(data.error ?? 'Failed to generate template'); return }
      setTemplate(data.template)
      setGenerated({ subject: data.subject, grade: data.grade, topic: data.topic })
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    if (!template || !generated) return
    const blob = new Blob([`# MaFundi SBP Template\n## ${generated.topic}\n### ${generated.subject} — ${generated.grade}\n\n${template}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SBP-Template-${generated.topic.replace(/\s+/g, '-').substring(0, 40)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MaFundi Project Templates</h1>
              <span className="text-xs font-bold px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">PRO</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate complete example SBP projects tailored to your subject and topic
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            MaFundi generates a <strong>complete annotated example project</strong> for your specific subject, grade, and topic.
            Use it to understand structure, flow, and what ZIMSEC markers look for.
            <strong> Always write your own project</strong> — based on YOUR community, observations, and experiences.
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Premium gate */}
        {isPremiumError && (
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-700 p-8 text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Lock size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Premium Feature</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              MaFundi Project Templates are available to Pro subscribers. Upgrade to get unlimited template generation, complete example projects for any subject, and advanced AI guidance.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/student/upgrade"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                <Crown size={16} />
                Upgrade to Pro
              </Link>
              <Link
                href="/student/projects/examples"
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium px-6 py-3 rounded-xl transition-all"
              >
                <BookOpen size={16} />
                View Free Examples
              </Link>
            </div>
          </div>
        )}

        {/* Generator form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <Bot size={18} className="text-violet-500" />
            Generate Your Example Project
          </h2>

          <form onSubmit={generateTemplate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="">Select subject…</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grade / Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="">Select grade…</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project Topic / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. The Effect of Solar Energy on Reducing Firewood Use in Rural Homes"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Heritage Theme <span className="text-xs text-slate-400 font-normal">(optional — recommended)</span>
              </label>
              <select
                value={heritageTheme}
                onChange={e => setHeritageTheme(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              >
                <option value="">Select a heritage theme…</option>
                {HERITAGE_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !subject || !grade || !topic.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
                : <><Sparkles size={16} /> Generate Example Project <ArrowRight size={16} /></>
              }
            </button>
          </form>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Bot size={24} className="text-white" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">MaFundi is writing your example project…</p>
            <p className="text-sm text-slate-500">Generating a complete 5-stage project tailored to your topic — this takes 15–25 seconds</p>
          </div>
        )}

        {/* Generated template */}
        {template && generated && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-700 overflow-hidden shadow-lg">
            {/* Template header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} />
                    <span className="text-sm font-medium opacity-90">MaFundi Generated Example</span>
                  </div>
                  <h3 className="text-lg font-bold line-clamp-2">{generated.topic}</h3>
                  <p className="text-sm opacity-80 mt-1">{generated.subject} · {generated.grade}</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-2 rounded-xl transition-all flex-shrink-0"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            {/* Warning banner */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-5 py-3 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <Sparkles size={14} className="flex-shrink-0 text-amber-500" />
              <span><strong>Inspiration only</strong> — your project must be written in YOUR OWN WORDS based on YOUR community and observations</span>
            </div>

            {/* Template content */}
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:text-slate-900 dark:prose-headings:text-white
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-blockquote:border-l-4 prose-blockquote:border-emerald-400 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-950/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300
                prose-strong:text-slate-900 dark:prose-strong:text-white
                prose-ul:text-slate-700 dark:prose-ul:text-slate-300
                prose-p:text-slate-700 dark:prose-p:text-slate-300
              ">
                <ReactMarkdown>{template}</ReactMarkdown>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap gap-3 items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ready to write your own version?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-xl transition-all"
                >
                  <Download size={14} /> Save as text
                </button>
                <Link
                  href="/student/projects/start"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Start My Project <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
