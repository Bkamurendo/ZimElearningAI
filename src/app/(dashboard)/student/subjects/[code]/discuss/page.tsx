'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MessageSquare, Plus, X, Send, ChevronDown, ChevronUp, Pin, Bot, Sparkles, Loader2 } from 'lucide-react'

type Reply = {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles: { full_name: string | null; role: string } | null
  isAI?: boolean
}

type Discussion = {
  id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
  user_id: string
  profiles: { full_name: string | null; role: string } | null
  reply_count: number
  replies?: Reply[]
}

export default function SubjectDiscussPage() {
  const params = useParams<{ code: string }>()
  const code = params.code

  const [subjectName, setSubjectName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({})
  const [replyPosting, setReplyPosting] = useState<string | null>(null)
  const [aiAnswering, setAiAnswering] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 20

  useEffect(() => {
    async function loadSubject() {
      const res = await fetch(`/api/student/subjects`)
      const data = await res.json()
      const subj = (data.subjects ?? []).find((s: { code: string; id: string; name: string }) => s.code === code)
      if (subj) { setSubjectName(subj.name); setSubjectId(subj.id) }
    }
    loadSubject()
  }, [code])

  useEffect(() => {
    if (!subjectId) return
    loadDiscussions(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  async function loadDiscussions(off: number) {
    setLoading(true)
    const res = await fetch(`/api/student/discussions?subject_id=${subjectId}&offset=${off}&limit=${LIMIT}`)
    const data = await res.json()
    if (off === 0) {
      setDiscussions(data.discussions ?? [])
    } else {
      setDiscussions(prev => [...prev, ...(data.discussions ?? [])])
    }
    setHasMore((data.discussions ?? []).length === LIMIT)
    setOffset(off)
    setLoading(false)
  }

  async function postQuestion() {
    if (!newTitle.trim() || !newBody.trim()) return
    setPosting(true)
    const res = await fetch('/api/student/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subjectId, title: newTitle.trim(), body: newBody.trim() }),
    })
    const data = await res.json()
    if (data.discussion) {
      setDiscussions(prev => [data.discussion, ...prev])
      setNewTitle(''); setNewBody(''); setShowNew(false)
      setExpandedId(data.discussion.id)
    }
    setPosting(false)
  }

  async function loadReplies(discussionId: string) {
    const res = await fetch(`/api/student/discussions/${discussionId}/replies`)
    const data = await res.json()
    setDiscussions(prev => prev.map(d => d.id === discussionId ? { ...d, replies: data.replies ?? [] } : d))
  }

  async function postReply(discussionId: string) {
    const body = replyBodies[discussionId]?.trim()
    if (!body) return
    setReplyPosting(discussionId)
    const res = await fetch(`/api/student/discussions/${discussionId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const data = await res.json()
    if (data.reply) {
      setDiscussions(prev => prev.map(d =>
        d.id === discussionId
          ? { ...d, reply_count: d.reply_count + 1, replies: [...(d.replies ?? []), data.reply] }
          : d
      ))
      setReplyBodies(prev => ({ ...prev, [discussionId]: '' }))
    }
    setReplyPosting(null)
  }

  /** Ask MaFundi AI to answer a discussion question */
  async function askMaFundi(disc: Discussion) {
    setAiAnswering(disc.id)
    try {
      // Use the ai-tutor streaming endpoint to get an answer
      const prompt = `A student posted this question in the ${subjectName} discussion board:

**Title:** ${disc.title}

**Question:** ${disc.body}

Please provide a clear, accurate, ZIMSEC-aligned answer as MaFundi AI. Format your response in markdown. Keep it focused and educational.`

      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          subjectName,
          subjectCode: code,
          level: 'olevel',
        }),
      })

      if (!res.ok || !res.body) throw new Error('AI service unavailable')

      // Stream the response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') break
            try {
              const json = JSON.parse(payload)
              if (json.type === 'text') fullText += json.text
              if (json.type === 'error') throw new Error(json.message)
            } catch { /* skip malformed lines */ }
          }
        }
      }

      if (fullText) {
        const aiReply: Reply = {
          id: `ai-${Date.now()}`,
          body: fullText,
          created_at: new Date().toISOString(),
          user_id: 'mafundi-ai',
          profiles: { full_name: 'MaFundi AI', role: 'ai' },
          isAI: true,
        }
        setDiscussions(prev => prev.map(d =>
          d.id === disc.id
            ? { ...d, reply_count: d.reply_count + 1, replies: [...(d.replies ?? []), aiReply] }
            : d
        ))
      }
    } catch (err) {
      console.error('MaFundi answer failed:', err)
    }
    setAiAnswering(null)
  }

  function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    const disc = discussions.find(d => d.id === id)
    if (disc && !disc.replies) loadReplies(id)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href={`/student/subjects/${code}`}
            className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-4 transition">
            ← {subjectName || 'Subject'}
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{subjectName} Discussion</h1>
                <p className="text-sky-100 text-sm">Ask questions, share answers — MaFundi AI can help!</p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition border border-white/20">
              <Plus size={16} /> Ask Question
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* New question form */}
        {showNew && (
          <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Ask a Question</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <input type="text" placeholder="What's your question? (title)" value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-400 outline-none" />
            <textarea rows={4} placeholder="Describe your question in detail…" value={newBody}
              onChange={e => setNewBody(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-400 outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={postQuestion} disabled={posting}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                <Send size={14} /> {posting ? 'Posting…' : 'Post Question'}
              </button>
              <button onClick={() => setShowNew(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && discussions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : discussions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No discussions yet — be the first to ask!</p>
            <button onClick={() => setShowNew(true)}
              className="mt-3 text-sky-600 hover:text-sky-700 text-sm font-medium">+ Ask the first question</button>
          </div>
        ) : (
          <>
            {discussions.map(d => {
              const profile = d.profiles as { full_name: string | null; role: string } | null
              const isExpanded = expandedId === d.id
              const hasUnansweredReplies = !d.replies || d.replies.length === 0
              return (
                <div key={d.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${isExpanded ? 'border-sky-200' : 'border-gray-100'}`}>
                  <div className="p-5 cursor-pointer" onClick={() => toggleExpand(d.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {d.pinned && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Pin size={10} /> Pinned
                            </span>
                          )}
                          {profile?.role === 'teacher' && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Teacher</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">{d.title}</h3>
                        {!isExpanded && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.body}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{profile?.full_name ?? 'Anonymous'}</span>
                          <span>·</span>
                          <span>{timeAgo(d.created_at)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><MessageSquare size={11} /> {d.reply_count}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-50 px-5 pb-5">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap pt-4 pb-5">{d.body}</p>

                      {/* MaFundi AI Answer Button */}
                      {hasUnansweredReplies && d.replies !== undefined && (
                        <div className="mb-4">
                          <button
                            onClick={() => askMaFundi(d)}
                            disabled={aiAnswering === d.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-teal-200 disabled:opacity-60"
                          >
                            {aiAnswering === d.id ? (
                              <><Loader2 size={13} className="animate-spin" /> MaFundi is thinking…</>
                            ) : (
                              <><Bot size={13} /><Sparkles size={11} className="text-yellow-300" /> Ask MaFundi AI</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Replies */}
                      {d.replies ? (
                        <div className="space-y-3 mb-4">
                          {d.replies.map(r => {
                            const rProfile = r.profiles as { full_name: string | null; role: string } | null
                            const isAIReply = r.isAI || rProfile?.role === 'ai'
                            return (
                              <div key={r.id} className={`rounded-xl p-3.5 text-sm ${
                                isAIReply
                                  ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100'
                                  : rProfile?.role === 'teacher'
                                  ? 'bg-blue-50 border border-blue-100'
                                  : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {isAIReply ? (
                                    <div className="flex items-center gap-1">
                                      <Bot size={12} className="text-teal-600" />
                                      <span className="font-semibold text-teal-800 text-xs">MaFundi AI</span>
                                      <span className="text-[9px] font-black bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full uppercase tracking-tight">AI Answer</span>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-gray-800 text-xs">{rProfile?.full_name ?? 'Anonymous'}</span>
                                      {rProfile?.role === 'teacher' && (
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">Teacher</span>
                                      )}
                                    </>
                                  )}
                                  <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                                </div>
                                <p className={`whitespace-pre-wrap ${isAIReply ? 'text-teal-900 text-xs leading-relaxed' : 'text-gray-700'}`}>
                                  {r.body}
                                </p>
                              </div>
                            )
                          })}
                          {d.replies.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No replies yet — be the first, or ask MaFundi AI above!</p>
                          )}
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-gray-400">Loading replies…</div>
                      )}

                      {/* Reply box */}
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Write a reply…"
                          value={replyBodies[d.id] ?? ''}
                          onChange={e => setReplyBodies(prev => ({ ...prev, [d.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postReply(d.id) } }}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-400 outline-none"
                        />
                        <button onClick={() => postReply(d.id)} disabled={replyPosting === d.id}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition disabled:opacity-50">
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {hasMore && (
              <button onClick={() => loadDiscussions(offset + LIMIT)}
                className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
