'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, X, Send, Loader2, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface Props {
  lessonTitle: string
  lessonContent: string
  subjectName: string
}

export default function AskMaFundi({ lessonTitle, lessonContent, subjectName }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)

  const QUICK = [
    `Explain this lesson in simpler terms`,
    `What are the key points I should remember from this lesson?`,
    `Give me 3 practice questions on this lesson`,
    `How is this topic examined in ZIMSEC?`,
  ]

  async function ask(q: string) {
    const query = q.trim()
    if (!query || loading) return
    setQuestion('')
    setLoading(true)
    setAnswer('')

    const context = `The student is currently studying: "${lessonTitle}" (${subjectName})\n\nLesson content summary: ${lessonContent.slice(0, 800)}...\n\nStudent's question: ${query}`

    const res = await fetch('/api/ai-teacher/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: convId,
        message: context,
        subject_name: subjectName,
        mode: 'normal',
      }),
    })
    const data = await res.json()
    if (data.reply) {
      setAnswer(data.reply)
      if (!convId && data.conversation_id) setConvId(data.conversation_id)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl transition shadow-md shadow-teal-500/20 group"
      >
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">Ask MaFundi about this lesson</p>
          <p className="text-teal-100 text-xs">Get instant explanations, practice questions &amp; exam tips</p>
        </div>
        <ChevronRight size={18} className="text-white/60 group-hover:text-white transition" />
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-500 to-emerald-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">MaFundi AI Teacher</p>
            <p className="text-teal-100 text-xs">{lessonTitle}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition">
          <X size={16} className="text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick questions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Quick questions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => ask(q)} disabled={loading}
                className="text-left text-xs text-gray-700 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 border border-gray-100 hover:border-teal-200 rounded-xl px-3 py-2 transition disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Answer area */}
        {(loading || answer) && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin text-teal-500" />
                MaFundi is thinking…
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-code:bg-white prose-code:px-1 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {answer}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Custom question input */}
        <div className="flex items-center gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(question)}
            placeholder="Ask your own question about this lesson…"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 outline-none"
            disabled={loading}
          />
          <button onClick={() => ask(question)} disabled={!question.trim() || loading}
            className="w-10 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition flex-shrink-0">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>

        {/* Full AI teacher link */}
        {convId && (
          <Link href="/student/ai-teacher"
            className="flex items-center justify-center gap-2 text-xs text-teal-600 hover:text-teal-800 transition font-medium">
            Open full AI Teacher conversation →
          </Link>
        )}
      </div>
    </div>
  )
}
