'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layers, Plus, RotateCcw, Sparkles, X, ChevronRight } from 'lucide-react'

type Flashcard = {
  id: string
  front: string
  back: string
  subject_id: string | null
  lesson_id: string | null
  created_at: string
  subjects: { name: string } | null
  lessons: { title: string } | null
}

type Subject = { id: string; name: string; code: string }
type Lesson = { id: string; title: string }

export default function StudentFlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubject, setActiveSubject] = useState<string>('all')

  // Review mode
  const [reviewing, setReviewing] = useState(false)
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [reviewIdx, setReviewIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  const [again, setAgain] = useState<string[]>([])

  // Add card modal
  const [showAdd, setShowAdd] = useState(false)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false)
  const [genSubjectId, setGenSubjectId] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [genLessonId, setGenLessonId] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [cardsRes, subjRes] = await Promise.all([
        fetch('/api/student/flashcards'),
        fetch('/api/student/subjects'),
      ])
      const cardsData = await cardsRes.json()
      const subjData = await subjRes.json()
      setCards(cardsData.flashcards ?? [])
      setSubjects(subjData.subjects ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Load lessons when generate subject changes
  useEffect(() => {
    if (!genSubjectId) { setLessons([]); setGenLessonId(''); return }
    fetch(`/api/student/lessons?subject_id=${genSubjectId}`)
      .then(r => r.json())
      .then(d => { setLessons(d.lessons ?? []); setGenLessonId('') })
  }, [genSubjectId])

  const filtered = activeSubject === 'all' ? cards : cards.filter(c => c.subject_id === activeSubject)

  // Group by subject for deck list
  const decks: Record<string, { name: string; cards: Flashcard[] }> = {}
  for (const c of filtered) {
    const key = c.subject_id ?? 'general'
    const name = c.subjects ? (c.subjects as { name: string }).name : 'General'
    if (!decks[key]) decks[key] = { name, cards: [] }
    decks[key].cards.push(c)
  }

  function startReview(deckCards: Flashcard[]) {
    setReviewCards([...deckCards].sort(() => Math.random() - 0.5))
    setReviewIdx(0)
    setFlipped(false)
    setKnown([])
    setAgain([])
    setReviewing(true)
  }

  function handleKnow() {
    setKnown(prev => [...prev, reviewCards[reviewIdx].id])
    advance()
  }

  function handleAgain() {
    setAgain(prev => [...prev, reviewCards[reviewIdx].id])
    advance()
  }

  function advance() {
    setFlipped(false)
    setTimeout(() => setReviewIdx(prev => prev + 1), 150)
  }

  async function addCard() {
    if (!newFront.trim() || !newBack.trim()) return
    setAddLoading(true)
    const res = await fetch('/api/student/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: newSubjectId || null,
        cards: [{ front: newFront.trim(), back: newBack.trim() }],
      }),
    })
    const data = await res.json()
    if (data.flashcards?.length) {
      setCards(prev => [...data.flashcards, ...prev])
      setNewFront(''); setNewBack(''); setNewSubjectId('')
      setShowAdd(false)
    }
    setAddLoading(false)
  }

  async function deleteCard(id: string) {
    await fetch(`/api/student/flashcards?id=${id}`, { method: 'DELETE' })
    setCards(prev => prev.filter(c => c.id !== id))
  }

  async function generateCards() {
    if (!genLessonId) return
    setGenLoading(true)
    setGenResult(null)
    const res = await fetch('/api/student/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: genLessonId, subject_id: genSubjectId || null }),
    })
    const data = await res.json()
    if (data.flashcards?.length) {
      setCards(prev => [...data.flashcards, ...prev])
      setGenResult(`✓ Generated ${data.count} flashcards!`)
    } else {
      setGenResult(data.error ?? 'Failed to generate flashcards')
    }
    setGenLoading(false)
  }

  // ── Review Mode UI ──────────────────────────────────────────
  if (reviewing) {
    const done = reviewIdx >= reviewCards.length
    if (done) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deck Complete!</h2>
            <p className="text-gray-500 mb-6">{reviewCards.length} cards reviewed</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="text-2xl font-bold text-emerald-600">{known.length}</p>
                <p className="text-sm text-emerald-700">Known ✓</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="text-2xl font-bold text-amber-600">{again.length}</p>
                <p className="text-sm text-amber-700">Review again</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {again.length > 0 && (
                <button onClick={() => {
                  setReviewCards(reviewCards.filter(c => again.includes(c.id)))
                  setReviewIdx(0); setFlipped(false); setKnown([]); setAgain([])
                }} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition">
                  <RotateCcw size={15} /> Retry {again.length}
                </button>
              )}
              <button onClick={() => setReviewing(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition">
                Done
              </button>
            </div>
          </div>
        </div>
      )
    }

    const card = reviewCards[reviewIdx]
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 font-medium">{reviewIdx + 1} / {reviewCards.length}</p>
            <button onClick={() => setReviewing(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/60 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${(reviewIdx / reviewCards.length) * 100}%` }} />
          </div>

          {/* Card flip */}
          <div className="relative h-56 cursor-pointer" style={{ perspective: '1000px' }}
            onClick={() => setFlipped(f => !f)}>
            <div className="w-full h-full transition-all duration-500 relative"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              {/* Front */}
              <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-violet-100 flex flex-col items-center justify-center p-8 text-center"
                style={{ backfaceVisibility: 'hidden' }}>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-4">Question</p>
                <p className="text-xl font-semibold text-gray-900">{card.front}</p>
                <p className="text-xs text-gray-400 mt-6">Tap to reveal answer</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 bg-violet-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <p className="text-xs font-semibold text-violet-200 uppercase tracking-wide mb-4">Answer</p>
                <p className="text-xl font-semibold text-white">{card.back}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {flipped && (
            <div className="flex gap-4 mt-8">
              <button onClick={handleAgain}
                className="flex-1 py-3.5 bg-white border-2 border-amber-300 text-amber-700 font-semibold rounded-2xl hover:bg-amber-50 transition shadow-sm">
                Review again ✗
              </button>
              <button onClick={handleKnow}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition shadow-sm">
                Know it ✓
              </button>
            </div>
          )}
          {!flipped && (
            <button onClick={() => setFlipped(true)}
              className="w-full mt-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl transition shadow-sm">
              Flip Card
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Deck List UI ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-violet-100 hover:text-white text-sm mb-4 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Layers size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Flashcards</h1>
                <p className="text-violet-100 text-sm">{cards.length} card{cards.length !== 1 ? 's' : ''} across {Object.keys(decks).length} deck{Object.keys(decks).length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGenerate(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition border border-white/20">
                <Sparkles size={15} /> Generate
              </button>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-white text-violet-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-violet-50 transition">
                <Plus size={15} /> Add Card
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Subject filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveSubject('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeSubject === 'all' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            All Decks
          </button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => setActiveSubject(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${activeSubject === s.id ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.name}
            </button>
          ))}
        </div>

        {/* Add card modal */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-violet-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Flashcard</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <select value={newSubjectId} onChange={e => setNewSubjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none bg-white">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Front (Question)</label>
                <textarea rows={4} value={newFront} onChange={e => setNewFront(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none resize-none"
                  placeholder="Question or term…" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Back (Answer)</label>
                <textarea rows={4} value={newBack} onChange={e => setNewBack(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none resize-none"
                  placeholder="Answer or definition…" />
              </div>
            </div>
            <button onClick={addCard} disabled={addLoading}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
              {addLoading ? 'Saving…' : 'Save Card'}
            </button>
          </div>
        )}

        {/* Generate modal */}
        {showGenerate && (
          <div className="bg-white rounded-2xl border border-violet-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-violet-500" /> Generate from Lesson</h3>
              <button onClick={() => { setShowGenerate(false); setGenResult(null) }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500">AI will read the lesson content and create 6 flashcard pairs automatically.</p>
            <select value={genSubjectId} onChange={e => setGenSubjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none bg-white">
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {lessons.length > 0 && (
              <select value={genLessonId} onChange={e => setGenLessonId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 outline-none bg-white">
                <option value="">Select lesson…</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            )}
            {genResult && (
              <p className={`text-sm font-medium px-3 py-2 rounded-xl ${genResult.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {genResult}
              </p>
            )}
            <button onClick={generateCards} disabled={genLoading || !genLessonId}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2">
              <Sparkles size={15} /> {genLoading ? 'Generating…' : 'Generate Flashcards'}
            </button>
          </div>
        )}

        {/* Deck list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : Object.keys(decks).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <Layers size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No flashcards yet</p>
            <div className="flex gap-3 justify-center mt-3">
              <button onClick={() => setShowGenerate(true)}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1">
                <Sparkles size={14} /> Generate with AI
              </button>
              <span className="text-gray-300">or</span>
              <button onClick={() => setShowAdd(true)}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1">
                <Plus size={14} /> Add manually
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(decks).map(([key, deck]) => (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{deck.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => startReview(deck.cards)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition">
                    Review <ChevronRight size={14} />
                  </button>
                </div>
                {/* Card previews */}
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {deck.cards.slice(0, 3).map(card => (
                    <div key={card.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                        <p className="text-sm text-gray-700 truncate">{card.front}</p>
                        <p className="text-sm text-gray-400 truncate">{card.back}</p>
                      </div>
                      <button onClick={() => deleteCard(card.id)}
                        className="text-gray-200 hover:text-red-400 transition flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {deck.cards.length > 3 && (
                    <p className="px-5 py-2.5 text-xs text-gray-400">+{deck.cards.length - 3} more cards</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
